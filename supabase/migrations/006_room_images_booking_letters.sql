-- Migration 006: Storage Buckets, RLS, and Media Columns for SPRK v1.2
-- Compliant with SPRK_PRD_v1.2.md

-- 1. Add image_path to public.rooms (nullable, stores relative object path)
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS image_path text NULL;

-- 2. Add letter_path to public.bookings (nullable for legacy bookings, mandatory for new bookings)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS letter_path text NULL;

-- 3. Create or configure Supabase Storage buckets
-- 'room-images': public bucket, max 3 MB, JPEG/PNG/WebP
-- 'booking-letters': private bucket, max 5 MB, PDF only
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('room-images', 'room-images', true, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('booking-letters', 'booking-letters', false, 5242880, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Storage RLS Policies for 'room-images'
-- Public read for anyone; mutation restricted to Admins only
DROP POLICY IF EXISTS "room_images_public_select" ON storage.objects;
CREATE POLICY "room_images_public_select" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'room-images');

DROP POLICY IF EXISTS "room_images_admin_insert" ON storage.objects;
CREATE POLICY "room_images_admin_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'room-images' AND public.is_admin());

DROP POLICY IF EXISTS "room_images_admin_update" ON storage.objects;
CREATE POLICY "room_images_admin_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'room-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'room-images' AND public.is_admin());

DROP POLICY IF EXISTS "room_images_admin_delete" ON storage.objects;
CREATE POLICY "room_images_admin_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'room-images' AND public.is_admin());

-- 5. Storage RLS Policies for 'booking-letters'
-- Private bucket: user can only upload to their own folder <auth.uid()>/...
-- Reading permitted only to the owner (<auth.uid()>) or Admin
-- Deletion permitted only for unbooked files by owner or Admin (prevents deleting active booking letters)
DROP POLICY IF EXISTS "booking_letters_user_insert" ON storage.objects;
CREATE POLICY "booking_letters_user_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'booking-letters' AND
    split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "booking_letters_select_owner_or_admin" ON storage.objects;
CREATE POLICY "booking_letters_select_owner_or_admin" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'booking-letters' AND
    (split_part(name, '/', 1) = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "booking_letters_user_delete_unbooked" ON storage.objects;
CREATE POLICY "booking_letters_user_delete_unbooked" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'booking-letters' AND
    (
      (split_part(name, '/', 1) = auth.uid()::text AND NOT EXISTS (
        SELECT 1 FROM public.bookings WHERE letter_path = name
      ))
      OR public.is_admin()
    )
  );

-- 6. Update create_booking RPC to mandate letter_path and verify storage object
DROP FUNCTION IF EXISTS public.create_booking(uuid, timestamptz, timestamptz, text, integer, uuid);

CREATE OR REPLACE FUNCTION public.create_booking(
  p_room_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_purpose text,
  p_participant_count integer,
  p_request_key uuid,
  p_letter_path text
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

  -- 8. Mandatory Letter Verification (PRD v1.2 BR-19)
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

  -- 9. Insert booking as pending with letter_path
  INSERT INTO public.bookings (
    user_id,
    room_id,
    request_key,
    letter_path,
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

GRANT EXECUTE ON FUNCTION public.create_booking(uuid, timestamptz, timestamptz, text, integer, uuid, text) TO authenticated;

-- 7. Update approve_booking RPC to verify letter_path
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

  -- PRD v1.2: Admin tidak boleh menyetujui jika surat peminjaman belum ada / tidak ditemukan
  IF v_booking.letter_path IS NULL OR trim(v_booking.letter_path) = '' THEN
    RAISE EXCEPTION 'Surat peminjaman belum tersedia.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'booking-letters'
      AND name = v_booking.letter_path
  ) THEN
    RAISE EXCEPTION 'Surat peminjaman tidak ditemukan pada penyimpanan.' USING ERRCODE = 'P0002';
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
