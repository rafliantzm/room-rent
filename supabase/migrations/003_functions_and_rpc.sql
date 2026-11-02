-- Migration 003: Atomic RPC Functions for SPRK
-- Compliant with PRD v1.1

-- 1. Public schedule query: returns ONLY start_at and end_at intervals for approved bookings
CREATE OR REPLACE FUNCTION public.get_public_room_schedule(
  p_room_id uuid,
  p_date date
)
RETURNS TABLE (
  start_at timestamptz,
  end_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.start_at, b.end_at
  FROM public.bookings b
  JOIN public.rooms r ON r.id = b.room_id
  WHERE b.room_id = p_room_id
    AND r.is_active = true
    AND b.status = 'approved'
    AND (b.start_at AT TIME ZONE 'Asia/Jakarta')::date = p_date
  ORDER BY b.start_at ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.get_public_room_schedule(uuid, date) TO anon, authenticated;


-- 2. Create booking: atomic validation and creation
CREATE OR REPLACE FUNCTION public.create_booking(
  p_room_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_purpose text,
  p_participant_count integer,
  p_request_key uuid
)
RETURNS public.bookings AS $$
DECLARE
  v_user_id uuid;
  v_room public.rooms%ROWTYPE;
  v_existing_booking public.bookings%ROWTYPE;
  v_new_booking public.bookings%ROWTYPE;
  v_start_wib timestamp;
  v_end_wib timestamp;
  v_now_wib timestamp;
  v_duration_seconds numeric;
  v_purpose_trimmed text;
BEGIN
  -- 1. Authentication check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi.' USING ERRCODE = '42501';
  END IF;

  -- 2. Idempotency check: if request_key already processed for this user, return existing record
  SELECT * INTO v_existing_booking
  FROM public.bookings
  WHERE user_id = v_user_id AND request_key = p_request_key;

  IF FOUND THEN
    RETURN v_existing_booking;
  END IF;

  -- 3. Room check
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ruangan tidak ditemukan.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_room.is_active THEN
    RAISE EXCEPTION 'Ruangan tidak tersedia atau sedang dinonaktifkan.' USING ERRCODE = 'P0001';
  END IF;

  -- 4. Capacity validation
  IF p_participant_count < 1 OR p_participant_count > v_room.capacity THEN
    RAISE EXCEPTION 'Jumlah peserta (% orang) harus antara 1 dan kapasitas ruangan (% orang).'
      , p_participant_count, v_room.capacity USING ERRCODE = 'P0001';
  END IF;

  -- 5. Purpose validation
  v_purpose_trimmed := trim(p_purpose);
  IF char_length(v_purpose_trimmed) < 10 OR char_length(v_purpose_trimmed) > 200 THEN
    RAISE EXCEPTION 'Keperluan peminjaman harus berisi antara 10 hingga 200 karakter.' USING ERRCODE = 'P0001';
  END IF;

  -- 6. Date and time rules (WIB Asia/Jakarta)
  IF p_end_at <= p_start_at THEN
    RAISE EXCEPTION 'Waktu selesai harus setelah waktu mulai.' USING ERRCODE = 'P0001';
  END IF;

  v_start_wib := p_start_at AT TIME ZONE 'Asia/Jakarta';
  v_end_wib := p_end_at AT TIME ZONE 'Asia/Jakarta';
  v_now_wib := now() AT TIME ZONE 'Asia/Jakarta';

  -- BR-03: Mulai dan selesai dalam hari kalender yang sama
  IF v_start_wib::date <> v_end_wib::date THEN
    RAISE EXCEPTION 'Peminjaman harus dimulai dan selesai pada hari kalender yang sama.' USING ERRCODE = 'P0001';
  END IF;

  -- BR-03: Rentang operasional 07.00 - 21.00 WIB
  IF (EXTRACT(HOUR FROM v_start_wib) < 7) OR
     (EXTRACT(HOUR FROM v_end_wib) > 21) OR
     (EXTRACT(HOUR FROM v_end_wib) = 21 AND (EXTRACT(MINUTE FROM v_end_wib) > 0 OR EXTRACT(SECOND FROM v_end_wib) > 0)) THEN
    RAISE EXCEPTION 'Waktu peminjaman harus berada dalam jam operasional 07.00 - 21.00 WIB.' USING ERRCODE = 'P0001';
  END IF;

  -- BR-04: Durasi 30 menit s.d. 4 jam (1800s - 14400s)
  v_duration_seconds := EXTRACT(EPOCH FROM (p_end_at - p_start_at));
  IF v_duration_seconds < 1800 OR v_duration_seconds > 14400 THEN
    RAISE EXCEPTION 'Durasi peminjaman minimal 30 menit dan maksimal 4 jam.' USING ERRCODE = 'P0001';
  END IF;

  -- BR-05: Kelipatan 30 menit
  IF (EXTRACT(MINUTE FROM v_start_wib)::integer NOT IN (0, 30)) OR
     (EXTRACT(SECOND FROM v_start_wib) <> 0) OR
     (EXTRACT(MINUTE FROM v_end_wib)::integer NOT IN (0, 30)) OR
     (EXTRACT(SECOND FROM v_end_wib) <> 0) THEN
    RAISE EXCEPTION 'Waktu mulai dan selesai harus berupa kelipatan 30 menit.' USING ERRCODE = 'P0001';
  END IF;

  -- BR-06: Waktu mulai minimal 30 menit dari sekarang
  IF p_start_at < (now() + interval '30 minutes') THEN
    RAISE EXCEPTION 'Waktu mulai pengajuan minimal 30 menit dari waktu saat ini.' USING ERRCODE = 'P0001';
  END IF;

  -- BR-07: Batas 30 hari kalender ke depan (inklusif) dalam WIB
  IF (v_start_wib::date < v_now_wib::date) OR (v_start_wib::date > (v_now_wib::date + 30)) THEN
    RAISE EXCEPTION 'Pengajuan peminjaman hanya dapat dilakukan maksimal 30 hari ke depan.' USING ERRCODE = 'P0001';
  END IF;

  -- 7. Overlap check with existing approved bookings
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE room_id = p_room_id
      AND status = 'approved'
      AND tstzrange(start_at, end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
  ) THEN
    RAISE EXCEPTION 'Jadwal sudah digunakan. Pilih waktu lain.' USING ERRCODE = '23P01';
  END IF;

  -- 8. Insert booking as pending
  INSERT INTO public.bookings (
    user_id,
    room_id,
    request_key,
    start_at,
    end_at,
    purpose,
    participant_count,
    status
  ) VALUES (
    v_user_id,
    p_room_id,
    p_request_key,
    p_start_at,
    p_end_at,
    v_purpose_trimmed,
    p_participant_count,
    'pending'
  )
  RETURNING * INTO v_new_booking;

  RETURN v_new_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.create_booking(uuid, timestamptz, timestamptz, text, integer, uuid) TO authenticated;


-- 3. Cancel own booking (User)
CREATE OR REPLACE FUNCTION public.cancel_own_booking(
  p_booking_id uuid
)
RETURNS public.bookings AS $$
DECLARE
  v_user_id uuid;
  v_booking public.bookings%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna belum terautentikasi.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Peminjaman tidak ditemukan.' USING ERRCODE = 'P0002';
  END IF;

  IF v_booking.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Anda tidak memiliki hak untuk membatalkan peminjaman ini.' USING ERRCODE = '42501';
  END IF;

  IF v_booking.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'Peminjaman dengan status % tidak dapat dibatalkan.', v_booking.status USING ERRCODE = 'P0001';
  END IF;

  IF v_booking.start_at <= now() THEN
    RAISE EXCEPTION 'Peminjaman yang waktu mulainya telah lewat tidak dapat dibatalkan.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled',
      cancelled_by = v_user_id,
      cancelled_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.cancel_own_booking(uuid) TO authenticated;


-- 4. Approve booking (Admin)
CREATE OR REPLACE FUNCTION public.approve_booking(
  p_booking_id uuid
)
RETURNS public.bookings AS $$
DECLARE
  v_admin_id uuid;
  v_booking public.bookings%ROWTYPE;
  v_room public.rooms%ROWTYPE;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Operasi ini hanya untuk admin.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE; -- lock row to serialize concurrent approvals

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Peminjaman tidak ditemukan.' USING ERRCODE = 'P0002';
  END IF;

  IF v_booking.status <> 'pending' THEN
    RAISE EXCEPTION 'Hanya pengajuan berstatus menunggu yang dapat disetujui. Status saat ini: %.', v_booking.status USING ERRCODE = 'P0001';
  END IF;

  IF v_booking.start_at <= now() THEN
    RAISE EXCEPTION 'Waktu mulai peminjaman telah lewat. Pengajuan tidak dapat disetujui.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE id = v_booking.room_id;
  IF NOT FOUND OR NOT v_room.is_active THEN
    RAISE EXCEPTION 'Ruangan sudah tidak aktif atau tidak ditemukan.' USING ERRCODE = 'P0001';
  END IF;

  IF v_booking.participant_count > v_room.capacity THEN
    RAISE EXCEPTION 'Kapasitas ruangan (% orang) tidak mencukupi peserta (% orang).'
      , v_room.capacity, v_booking.participant_count USING ERRCODE = 'P0001';
  END IF;

  -- Check conflict with other approved bookings
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE room_id = v_booking.room_id
      AND id <> p_booking_id
      AND status = 'approved'
      AND tstzrange(start_at, end_at, '[)') && tstzrange(v_booking.start_at, v_booking.end_at, '[)')
  ) THEN
    RAISE EXCEPTION 'Jadwal bentrok dengan peminjaman lain yang telah disetujui.' USING ERRCODE = '23P01';
  END IF;

  UPDATE public.bookings
  SET status = 'approved',
      reviewed_by = v_admin_id,
      reviewed_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.approve_booking(uuid) TO authenticated;


-- 5. Reject booking (Admin)
CREATE OR REPLACE FUNCTION public.reject_booking(
  p_booking_id uuid,
  p_reason text
)
RETURNS public.bookings AS $$
DECLARE
  v_admin_id uuid;
  v_booking public.bookings%ROWTYPE;
  v_reason_trimmed text;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Operasi ini hanya untuk admin.' USING ERRCODE = '42501';
  END IF;

  v_reason_trimmed := trim(p_reason);
  IF char_length(v_reason_trimmed) < 10 OR char_length(v_reason_trimmed) > 300 THEN
    RAISE EXCEPTION 'Alasan penolakan wajib diisi antara 10 hingga 300 karakter.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Peminjaman tidak ditemukan.' USING ERRCODE = 'P0002';
  END IF;

  IF v_booking.status <> 'pending' THEN
    RAISE EXCEPTION 'Hanya pengajuan berstatus menunggu yang dapat ditolak. Status saat ini: %.', v_booking.status USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.bookings
  SET status = 'rejected',
      review_note = v_reason_trimmed,
      reviewed_by = v_admin_id,
      reviewed_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.reject_booking(uuid, text) TO authenticated;


-- 6. Cancel approved booking (Admin)
CREATE OR REPLACE FUNCTION public.cancel_approved_booking(
  p_booking_id uuid,
  p_reason text
)
RETURNS public.bookings AS $$
DECLARE
  v_admin_id uuid;
  v_booking public.bookings%ROWTYPE;
  v_reason_trimmed text;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Operasi ini hanya untuk admin.' USING ERRCODE = '42501';
  END IF;

  v_reason_trimmed := trim(p_reason);
  IF char_length(v_reason_trimmed) < 10 OR char_length(v_reason_trimmed) > 300 THEN
    RAISE EXCEPTION 'Alasan pembatalan wajib diisi antara 10 hingga 300 karakter.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Peminjaman tidak ditemukan.' USING ERRCODE = 'P0002';
  END IF;

  IF v_booking.status <> 'approved' THEN
    RAISE EXCEPTION 'Hanya peminjaman berstatus disetujui yang dapat dibatalkan melalui tindakan ini. Status saat ini: %.', v_booking.status USING ERRCODE = 'P0001';
  END IF;

  IF v_booking.start_at <= now() THEN
    RAISE EXCEPTION 'Peminjaman yang sudah dimulai atau selesai tidak dapat dibatalkan.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled',
      cancelled_by = v_admin_id,
      cancelled_at = now(),
      cancellation_reason = v_reason_trimmed
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.cancel_approved_booking(uuid, text) TO authenticated;
