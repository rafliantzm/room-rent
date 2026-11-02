-- Migration 004: Admin Provisioning Procedure
-- Compliant with PRD v1.1 (§4, §9.1, §15)
-- Petunjuk: Jalankan query ini di SQL Editor Supabase setelah calon admin login pertama kali via Google.

-- Ganti 'admin@kampus.ac.id' dengan email akun Google admin yang bersangkutan
UPDATE public.profiles
SET role = 'admin',
    updated_at = now()
WHERE email = 'admin@kampus.ac.id';

-- Verifikasi perubahan role:
-- SELECT id, full_name, email, role, updated_at FROM public.profiles WHERE role = 'admin';
