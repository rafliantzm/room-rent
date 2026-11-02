-- Migration 005: Seed Test Rooms (Demo/Test Data)
-- Compliant with PRD v1.1 (§11, §19: Ditandai jelas sebagai DEMO)

INSERT INTO public.rooms (code, name, building, floor, capacity, description, is_active)
VALUES
  ('R-101', '[DEMO] Ruang Teori 101', 'Gedung Kuliah Bersama A', 'Lantai 1', 40, 'Ruang kelas teori dilengkapi proyektor dan papan tulis.', true),
  ('R-102', '[DEMO] Ruang Seminar 102', 'Gedung Kuliah Bersama A', 'Lantai 1', 60, 'Ruang seminar ber-AC dengan susunan meja fleksibel.', true),
  ('LAB-201', '[DEMO] Laboratorium Komputer 201', 'Gedung Sains & Teknologi B', 'Lantai 2', 30, 'Laboratorium komputer dengan 30 PC dan jaringan LAN.', true),
  ('AUD-301', '[DEMO] Auditorium Utama 301', 'Gedung Rektorat & Pusat Kegiatan', 'Lantai 3', 250, 'Auditorium kapasitas besar untuk kuliah umum dan simposium.', true),
  ('DISK-105', '[DEMO] Ruang Diskusi Mahasiswa 105', 'Gedung Perpustakaan Pusat', 'Lantai 1', 12, 'Ruang diskusi kelompok kecil dengan meja bundar dan whiteboard.', true),
  ('R-OFF', '[DEMO] Ruang Rapat Pemeliharaan', 'Gedung Kuliah Bersama A', 'Lantai 2', 20, 'Ruangan nonaktif untuk pengujian status peminjaman.', false)
ON CONFLICT DO NOTHING;
