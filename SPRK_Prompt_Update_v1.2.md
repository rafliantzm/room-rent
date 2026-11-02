# PROMPT IMPLEMENTASI PERUBAHAN SPRK v1.2 — WAJIB SURAT DAN FOTO RUANGAN

Anda adalah Senior Next.js, Supabase, PostgreSQL, dan Security Engineer. Lanjutkan aplikasi yang **sudah berfungsi** di `D:\WEB\room-rent`. Jangan scaffold ulang, jangan reset DB, jangan mengubah Google OAuth, role Admin/User, panduan, alur booking/approval, dan desain minimalis yang sudah berfungsi.

**Dokumen acuan terbaru:** `SPRK_PRD_v1.2.md` (baca SELURUH dokumen). Bandingkan dengan `prd.md` lama untuk memastikan tidak ada fitur penting yang hilang. Proyek Supabase tetap **`room-rental`**, menggunakan `.env.local` yang telah diatur. Jangan menampilkan secret.

## Target perubahan wajib

**1. Surat permohonan PDF pada form User**
- Setiap booking **baru** harus mengunggah tepat satu surat PDF, maksimal **5 MB**. PDF diwajibkan di UI, divalidasi ulang di server dan proses create booking. Tolak PDF palsu/rusak, ukuran berlebih, atau path yang bukan milik user saat ini.
- Buat bucket Supabase Storage **`booking-letters` private** dengan batas MIME/ukuran dan Storage RLS: user hanya upload/baca miliknya, Admin membaca surat booking yang dikelola; pengunjung dan user lain tidak boleh melihatnya. Gunakan object path `<auth.uid()>/<request_key>.pdf`, tidak menyimpan URL publik atau signed URL di database.
- Di `/peminjaman/baru`, tambahkan field **Surat Permohonan (PDF, wajib)** setelah jumlah peserta, tampilkan nama file, batas ukuran, error inline, dan status upload. Alur submit: upload PDF aman → verifikasi keberadaan/owner → buat booking `pending` dengan `letter_path` → tampilkan sukses hanya jika database berhasil.
- Retry harus idempotent memakai `request_key`. Jika upload berhasil tetapi booking gagal, tangani cleanup yang aman tanpa menghapus surat booking yang sudah tersimpan.
- Pada `/peminjaman-saya/[id]`, user bisa melihat surat miliknya lewat akses terproteksi.

**2. Pemeriksaan surat oleh Admin**
- Pada `/admin/peminjaman/[id]` tampilkan **Lihat Surat PDF** sebelum tombol Setujui/Tolak.
- Admin **tidak boleh menyetujui** booking baru jika surat tidak tersedia/tidak valid. Admin menolak booking beserta alasan (menggunakan `review_note` yang sudah ada). **Satu keputusan booking juga merupakan keputusan surat**: tidak membuat `document_status`, persetujuan bertingkat, atau tombol terima berkas tersendiri.
- Surat hanya bisa diakses via auth + Storage RLS atau signed URL singkat (maks. 60 detik) setelah server memeriksa role dan kepemilikan booking.

**3. Satu foto ruangan oleh Admin**
- Buat bucket Supabase Storage **`room-images` public** untuk pembacaan foto, tetapi mutasi hanya Admin. Hanya JPEG/PNG/WebP maks. **3 MB**.
- Pada `/admin/ruangan/baru` dan `/admin/ruangan/[id]/edit`, admin bisa upload, preview, mengganti, atau menghapus **satu foto utama opsional**.
- Simpan `rooms.image_path`, bukan public URL permanen. Di `/ruangan/[id]`, tampilkan foto kepada User/pengunjung; jika belum tersedia, tampilkan teks sederhana, bukan ilustrasi dekoratif. Pada daftar ruangan, thumbnail opsional bila tidak membuat UI padat.
- Gunakan object path baru ketika mengganti foto; jaga referensi database dan bersihkan orphan secara aman.

**4. Update Panduan Pengguna**
- Pertahankan 5 langkah dan FAQ yang sudah ada. Pada langkah pengajuan, jelaskan bahwa surat PDF **wajib** dan akan diperiksa Admin. Jelaskan penolakan karena surat tidak sesuai berarti User harus memperbaiki surat dan membuat pengajuan baru. Panduan tetap publik dan mudah ditemukan.

## Migrasi dan keamanan — sangat penting

1. Audit kondisi source dan database **live** terlebih dahulu. Cek migration yang sudah diterapkan. Buat migration **baru** dengan nomor berikutnya, jangan edit atau jalankan ulang 001–003 yang sudah diterapkan. Tambah `bookings.letter_path text null` dan `rooms.image_path text null`. Kolom tetap nullable agar booking lama tidak rusak; **RPC `create_booking` baru mewajibkan surat**. Pending lama tanpa surat tidak boleh diapprove; admin bisa menolak dengan alasan meminta submit ulang. Booking approved lama harus tetap utuh.
2. Buat konfigurasi dua bucket, kebijakan `storage.objects` dengan otorisasi tepat, RPC baru atau revisi terkontrol yang **mengonfirmasi objek surat ada, milik user, cocok dengan `request_key`, dan berasal dari bucket privat**. Pertahankan exclusion constraint `bookings_no_approved_overlap`, status transition, dan idempotensi.
3. Gunakan API Supabase Storage untuk operasi file; jangan INSERT/DELETE langsung ke `storage.objects`. Jangan gunakan public bucket untuk surat. Jangan tambahkan service-role key di browser.
4. Untuk file hingga 5 MB, utamakan browser → Supabase Storage dengan user JWT/RLS (menghindari limit default Server Actions 1 MB); operasi server menerima object path dan memverifikasi ulang server-side.

## Acceptance tests wajib

- Submit tanpa surat, file tidak valid, PDF >5MB → **gagal**, tak ada booking baru.
- Submit dengan PDF valid → tepat satu booking pending dan surat tersimpan.
- User A tak bisa membaca surat User B; anon tak bisa membaca surat; admin bisa melihat.
- Admin membuka surat lalu menerima/menolak; alasan penolakan tampil pada akun User.
- Request palsu tanpa surat atau path user lain tidak dapat membuat booking maupun memperoleh approval.
- Admin unggah/ganti/hapus satu foto; foto tampil di detail ruangan publik; User tidak boleh unggah.
- Booking lama tetap utuh setelah migrasi; pencegahan konflik jadwal dan semua fitur sebelumnya tetap PASS.
- Test retry setelah gagal penyimpanan, file orphan, dan double booking concurrent.
- Jalankan `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` dan laporkan hasil nyata; jangan klaim PASS tanpa tes.

**Output akhir:** daftar file yang diubah, nomor/status migration, kebijakan bucket yang diterapkan, bukti uji role dan file, status QA, masalah tersisa. Tidak menambahkan pembayaran, galeri, notifikasi, OCR, e-signature, dashboard statistik, atau fitur lain di luar PRD. **Mulai audit dan implementasi sekarang.**
