# SPRK — Sistem Peminjaman Ruangan Kampus

SPRK (Sistem Peminjaman Ruangan Kampus) adalah aplikasi web layanan operasional kampus untuk melihat ketersediaan ruangan, memeriksa jadwal terpakai, mengajukan peminjaman secara transparan, dan memantau status persetujuan admin.

Dibangun dengan arsitektur **Next.js App Router (React 19 + TypeScript + Tailwind CSS)** dan **Supabase (PostgreSQL + RLS + Google OAuth)** sesuai spesifikasi penuh pada [prd.md](file:///D:/WEB/room-rent/prd.md).

---

## 1. Fitur Utama

- **Panduan Pengguna Publik (`/panduan`)**: Penjelasan lengkap 5 alur langkah peminjaman, arti status pengajuan, dan 6 FAQ resmi kampus (dapat diakses tanpa login).
- **Direktori & Jadwal Ruangan Publik (`/ruangan`, `/ruangan/[id]`)**: Menampilkan daftar fasilitas ruangan aktif, pencarian instan nama/kode, filter tanggal, dan slot jam yang telah terpakai (WIB) tanpa membocorkan data pribadi pemohon.
- **Autentikasi Google OAuth**: Integrasi Supabase Auth menggunakan Google Provider dengan sesi berbasis cookie PKCE yang aman.
- **Formulir Pengajuan Peminjaman (`/peminjaman/baru`)**: Validasi Zod di sisi server, batasan operasional 07.00–21.00 WIB, kelipatan 30 menit, durasi 30 menit s.d. 4 jam, batasan kapasitas ruangan, serta kunci idempotensi `request_key` untuk mencegah pengiriman ganda.
- **Peminjaman Saya (`/peminjaman-saya`, `/peminjaman-saya/[id]`)**: Riwayat pengajuan milik pengguna sendiri, status terupdate (Menunggu, Disetujui, Ditolak, Dibatalkan), catatan penolakan/pembatalan admin, serta aksi pembatalan mandiri sebelum jadwal mulai.
- **Operasional Administrator (`/admin/*`)**:
  - **Antrean Pengajuan (`/admin/peminjaman`)**: Filter status (default Menunggu diprioritaskan terlama terlebih dahulu).
  - **Persetujuan Atomik (`/admin/peminjaman/[id]`)**: Keputusan Setujui (terlindungi PostgreSQL exclusion constraint), Tolak (dengan alasan wajib 10–300 karakter), dan Batalkan (dengan alasan wajib).
  - **Manajemen Fasilitas Ruangan (`/admin/ruangan`)**: Tambah ruangan baru, edit data, dan aktifkan/nonaktifkan ruangan (tanpa hard-delete).
  - **Jadwal Ruangan Terpadu (`/admin/jadwal`)**: Tampilan jadwal yang telah disetujui per tanggal dan ruangan.

---

## 2. Struktur Proyek

```text
room-rent/
├── prd.md                               # Dokumen spesifikasi acuan tunggal (Single Source of Truth)
├── .env.example                         # Contoh variabel lingkungan
├── .gitignore                           # Git ignore (melindungi .env dan credentials)
├── package.json                         # Dependencies & scripts
├── tsconfig.json                        # Konfigurasi TypeScript
├── vitest.config.mts                    # Konfigurasi automated testing
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql       # Skema tabel profiles, rooms, bookings & GiST exclusion constraint
│       ├── 002_rls_policies.sql         # Row Level Security (RLS) untuk profiles, rooms, bookings
│       ├── 003_functions_and_rpc.sql    # Fungsi PostgreSQL RPC atomik (create, approve, reject, cancel)
│       ├── 004_admin_provisioning.sql   # Panduan SQL penetapan admin pertama
│       └── 005_seed_test_rooms.sql      # Data seed ruangan berlabel [DEMO]
├── tests/
│   ├── business-rules.test.ts           # Pengujian aturan bisnis BR-03 s.d. BR-08 & timezone WIB
│   ├── overlap.test.ts                  # Pengujian formula pencegahan bentrok jadwal
│   └── validation.test.ts               # Pengujian validasi Zod form pengajuan, ruangan, dan admin
└── src/
    ├── app/                             # Next.js App Router pages & route handlers
    │   ├── admin/                       # Rute operasional admin (/peminjaman, /ruangan, /jadwal)
    │   ├── auth/callback/               # Handler callback PKCE OAuth
    │   ├── login/                       # Halaman masuk dengan Google
    │   ├── panduan/                     # Halaman panduan pengguna publik
    │   ├── peminjaman/baru/             # Formulir pengajuan peminjaman
    │   ├── peminjaman-saya/             # Daftar & detail peminjaman milik user
    │   ├── ruangan/                     # Direktori & detail jadwal ruangan publik
    │   ├── globals.css                  # Desain tema akademik minimalis
    │   └── layout.tsx                   # Layout global & font Inter
    ├── components/                      # Komponen antarmuka pengguna
    ├── features/                        # Query dan Server Actions (auth, rooms, bookings, admin)
    ├── lib/                             # Supabase clients (browser & server), auth, dates, validation
    └── proxy.ts                         # Next.js 16+ proxy untuk pembaruan sesi cookie & proteksi rute
```

---

## 3. Langkah Konfigurasi Pemilik Proyek (Supabase & Google OAuth)

### Langkah A: Menjalankan Migrasi Database di Supabase
1. Buka [Dashboard Supabase](https://supabase.com/dashboard) pada proyek **`room-rental`**.
2. Masuk ke menu **SQL Editor**.
3. Jalankan file-file migrasi secara berurutan:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_functions_and_rpc.sql`
   - `supabase/migrations/005_seed_test_rooms.sql` (opsional untuk data ruangan pengujian)

### Langkah B: Konfigurasi Google OAuth
1. Buka [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**.
2. Buat **OAuth 2.0 Client ID** bertipe **Web application**.
3. Masukkan Authorized redirect URIs:
   - Salin dari dashboard Supabase (**Authentication > Providers > Google**). Contoh: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
4. Di Dashboard Supabase (**Authentication > Providers > Google**):
   - Aktifkan provider **Google**.
   - Masukkan **Client ID** dan **Client Secret** dari Google Cloud Console.
5. Di Dashboard Supabase (**Authentication > URL Configuration**):
   - Atur **Site URL** ke `http://localhost:3000` (atau domain produksi).
   - Tambahkan Redirect URL: `http://localhost:3000/auth/callback` (dan URL produksi saat deployment).

### Langkah C: Menetapkan Role Administrator
Akun Google yang pertama kali login akan otomatis memiliki role `user`. Untuk mengubahnya menjadi `admin`:
1. Login terlebih dahulu satu kali menggunakan akun Google calon admin.
2. Buka **SQL Editor** di Supabase Dashboard, jalankan query dari `supabase/migrations/004_admin_provisioning.sql`:
   ```sql
   UPDATE public.profiles
   SET role = 'admin', updated_at = now()
   WHERE email = 'admin@kampus.ac.id';
   ```

---

## 4. Menjalankan Aplikasi Secara Lokal

### 1. Siapkan `.env.local`
Salin template `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi nilai variabel dari **Supabase Dashboard > Project Settings > API**:
```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<SUPABASE_PUBLISHABLE_KEY>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Jalankan Perintah Pengembangan
```bash
# Menjalankan development server
npm run dev

# Menjalankan automated test suite (Vitest)
npm run test

# Menjalankan pengecekan TypeScript
npm run typecheck

# Menjalankan linter ESLint
npm run lint

# Membangun aplikasi produksi
npm run build

# Menjalankan build produksi
npm run start
```

Buka peramban di `http://localhost:3000` untuk mulai menggunakan aplikasi.
