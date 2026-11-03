-- Migration 007: Add borrower_name and borrower_nim to public.bookings
-- Compliant with SPRK Update: Identitas Peminjam (Nama & NIM)

-- 1. Non-destructively add columns to public.bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS borrower_name text NULL,
  ADD COLUMN IF NOT EXISTS borrower_nim text NULL;

COMMENT ON COLUMN public.bookings.borrower_name IS 'Nama lengkap peminjam untuk keperluan identitas akademik resmi.';
COMMENT ON COLUMN public.bookings.borrower_nim IS 'Nomor Induk Mahasiswa (NIM) peminjam kampus.';

-- 2. Update atomic create_booking RPC to accept and validate borrower_name and borrower_nim
CREATE OR REPLACE FUNCTION public.create_booking(
  p_room_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_purpose text,
  p_participant_count integer,
  p_request_key uuid,
  p_letter_path text,
  p_borrower_name text,
  p_borrower_nim text
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
  v_borrower_name_trimmed text;
  v_borrower_nim_trimmed text;
  v_expected_letter_path text;
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

  -- 4. Identity validation (Nama & NIM)
  v_borrower_name_trimmed := trim(p_borrower_name);
  IF v_borrower_name_trimmed IS NULL OR char_length(v_borrower_name_trimmed) < 3 OR char_length(v_borrower_name_trimmed) > 100 THEN
    RAISE EXCEPTION 'Nama peminjam harus berisi antara 3 hingga 100 karakter.' USING ERRCODE = 'P0001';
  END IF;

  v_borrower_nim_trimmed := trim(p_borrower_nim);
  IF v_borrower_nim_trimmed IS NULL OR char_length(v_borrower_nim_trimmed) < 5 OR char_length(v_borrower_nim_trimmed) > 25 THEN
    RAISE EXCEPTION 'NIM peminjam harus berisi antara 5 hingga 25 karakter.' USING ERRCODE = 'P0001';
  END IF;

  IF v_borrower_nim_trimmed !~ '^[a-zA-Z0-9.\-]+$' THEN
    RAISE EXCEPTION 'NIM hanya boleh berisi huruf, angka, titik, dan tanda hubung (-).' USING ERRCODE = 'P0001';
  END IF;

  -- 5. Capacity validation
  IF p_participant_count < 1 OR p_participant_count > v_room.capacity THEN
    RAISE EXCEPTION 'Jumlah peserta (% orang) harus antara 1 dan kapasitas ruangan (% orang).'
      , p_participant_count, v_room.capacity USING ERRCODE = 'P0001';
  END IF;

  -- 6. Purpose validation
  v_purpose_trimmed := trim(p_purpose);
  IF char_length(v_purpose_trimmed) < 10 OR char_length(v_purpose_trimmed) > 200 THEN
    RAISE EXCEPTION 'Keperluan peminjaman harus berisi antara 10 hingga 200 karakter.' USING ERRCODE = 'P0001';
  END IF;

  -- 7. Date and time rules (WIB Asia/Jakarta)
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

  -- 8. Overlap check with existing approved bookings
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE room_id = p_room_id
      AND status = 'approved'
      AND tstzrange(start_at, end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
  ) THEN
    RAISE EXCEPTION 'Jadwal sudah digunakan. Pilih waktu lain.' USING ERRCODE = '23P01';
  END IF;

  -- 9. Mandatory Letter Verification (PRD v1.2 BR-19)
  IF p_letter_path IS NULL OR trim(p_letter_path) = '' THEN
    RAISE EXCEPTION 'Surat peminjaman wajib diunggah (PDF, maks. 5 MB).' USING ERRCODE = 'P0001';
  END IF;

  v_expected_letter_path := v_user_id::text || '/' || p_request_key::text || '.pdf';
  IF p_letter_path <> v_expected_letter_path THEN
    RAISE EXCEPTION 'Path surat peminjaman tidak valid atau bukan milik pemohon.' USING ERRCODE = '42501';
  END IF;

  -- Verify object exists in private storage bucket 'booking-letters'
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'booking-letters'
      AND name = p_letter_path
  ) THEN
    RAISE EXCEPTION 'Surat peminjaman belum terunggah atau tidak ditemukan di penyimpanan.' USING ERRCODE = 'P0002';
  END IF;

  -- 10. Insert booking as pending with borrower_name, borrower_nim, and letter_path
  INSERT INTO public.bookings (
    user_id,
    room_id,
    request_key,
    letter_path,
    borrower_name,
    borrower_nim,
    start_at,
    end_at,
    purpose,
    participant_count,
    status
  ) VALUES (
    v_user_id,
    p_room_id,
    p_request_key,
    p_letter_path,
    v_borrower_name_trimmed,
    v_borrower_nim_trimmed,
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

GRANT EXECUTE ON FUNCTION public.create_booking(uuid, timestamptz, timestamptz, text, integer, uuid, text, text, text) TO authenticated;
