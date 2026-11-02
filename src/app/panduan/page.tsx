import Link from "next/link";
import type { Metadata } from "next";
import {
  SearchIcon,
  CalendarIcon,
  FilePdfIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BuildingIcon,
  InfoIcon,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Panduan Pengguna — SPRK",
  description:
    "Panduan lengkap langkah demi langkah peminjaman ruangan kampus, arti status pengajuan, dan tanya jawab (FAQ).",
};

export default function PanduanPage() {
  const steps = [
    {
      num: 1,
      title: "Cari Ruangan Sesuai Kebutuhan",
      desc: "Buka menu Direktori Ruangan pada navigasi utama. Anda dapat memfilter ruangan berdasarkan nama, kode ruangan, gedung, lantai, dan kapasitas peserta yang dibutuhkan.",
      icon: SearchIcon,
    },
    {
      num: 2,
      title: "Periksa Ketersediaan Jadwal",
      desc: "Buka halaman detail ruangan, pilih tanggal pelaksanaan yang direncanakan, dan cek slot waktu yang masih kosong pada jam operasional kampus (07.00 – 21.00 WIB).",
      icon: CalendarIcon,
    },
    {
      num: 3,
      title: "Login Google & Unggah Surat Permohonan (PDF)",
      desc: "Masuk menggunakan Akun Google resmi Anda. Lengkapi formulir waktu, jumlah peserta, agenda kegiatan, serta unggah 1 berkas Surat Permohonan resmi bertanda tangan (format PDF, maks. 5 MB).",
      icon: FilePdfIcon,
    },
    {
      num: 4,
      title: "Verifikasi Berkas oleh Admin Operasional",
      desc: "Setelah pengajuan terkirim, status awal adalah Menunggu. Administrator kampus akan memverifikasi keabsahan surat dan kelayakan agenda sebelum menyetujui jadwal Anda.",
      icon: ShieldCheckIcon,
    },
    {
      num: 5,
      title: "Pantau Status di Menu Peminjaman Saya",
      desc: "Lihat hasil keputusan admin pada menu Peminjaman Saya. Jika Disetujui, ruangan resmi terkunci untuk Anda. Jika Ditolak, baca catatan evaluasi admin untuk perbaikan pengajuan berikutnya.",
      icon: CheckCircleIcon,
    },
  ];

  const faqs = [
    {
      q: "Apakah harus login terlebih dahulu untuk melihat ruangan dan jadwal?",
      a: "Tidak. Siapa pun dapat melihat direktori ruangan aktif dan jadwal slot waktu yang terpakai secara terbuka tanpa perlu login. Login Google baru diwajibkan saat Anda hendak mengirimkan pengajuan peminjaman.",
    },
    {
      q: "Apakah pengajuan peminjaman langsung otomatis mengunci ruangan?",
      a: "Tidak. Seluruh pengajuan baru berstatus Menunggu dan wajib ditinjau secara manual oleh admin operasional kampus guna mencegah benturan kegiatan akademik prioritas.",
    },
    {
      q: "Mengapa surat permohonan wajib diunggah dalam format PDF?",
      a: "Surat permohonan bertanda tangan adalah dokumen pertanggungjawaban legal kegiatan organisasi/sivitas akademika. Berkas PDF tersimpan secara aman dan privat di Supabase Storage untuk diverifikasi admin.",
    },
    {
      q: "Bagaimana jika jadwal yang saya ajukan bentrok dengan pihak lain?",
      a: "Sistem SPRK menerapkan perlindungan tingkat database (PostgreSQL exclusion constraint). Dua peminjaman pada ruangan dan slot waktu yang sama tidak akan pernah bisa disetujui bersamaan.",
    },
    {
      q: "Apakah saya bisa membatalkan jadwal yang telah diajukan?",
      a: "Ya. Anda dapat membatalkan peminjaman milik Anda sendiri selama waktu mulai kegiatan belum tiba. Slot waktu akan otomatis dilepaskan kembali agar dapat dimanfaatkan oleh pemohon lain.",
    },
    {
      q: "Apa yang harus dilakukan jika pengajuan ditolak?",
      a: "Buka rincian peminjaman Anda pada menu Peminjaman Saya untuk membaca alasan penolakan dari admin. Perbaiki kekurangan surat atau cari slot waktu lain, lalu buat pengajuan baru.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
          Panduan Operasional Kampus
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Panduan Prosedur Peminjaman Ruangan
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Petunjuk resmi alur pengajuan peminjaman fasilitas ruangan akademik SPRK. Bacalah panduan di bawah ini sebelum mengirimkan permohonan peminjaman.
        </p>
      </div>

      {/* Mandatory Notice Banner (PRD v1.2 FR-07) */}
      <div className="academic-card p-5 bg-blue-50/70 border-blue-200 rounded-xl flex items-start gap-3">
        <InfoIcon className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-950 space-y-1 leading-relaxed">
          <p className="font-bold text-blue-900 uppercase tracking-wider">
            Ketentuan Wajib Dokumen Permohonan:
          </p>
          <p>
            Surat permohonan dalam format <strong>PDF (maksimal 5 MB) adalah syarat wajib</strong> yang harus disiapkan oleh pemohon, bukan dokumen otomatis yang digenerate sistem. Foto ruangan yang disediakan di direktori merupakan referensi visual kondisi fasilitas. Pengajuan tanpa berkas PDF tidak dapat dikirimkan ke antrean admin.
          </p>
        </div>
      </div>

      {/* 5 Langkah Utama */}
      <section className="space-y-4" aria-labelledby="langkah-heading">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-700 text-white text-xs font-bold">
            1
          </span>
          <h2 id="langkah-heading" className="text-lg font-bold text-slate-900">
            Alur 5 Langkah Peminjaman Ruangan
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="academic-card p-5 bg-white flex flex-col sm:flex-row items-start gap-4 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      Langkah {step.num}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Arti Status Peminjaman */}
      <section className="space-y-4" aria-labelledby="status-heading">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-700 text-white text-xs font-bold">
            2
          </span>
          <h2 id="status-heading" className="text-lg font-bold text-slate-900">
            Arti dan Definisi Status Pengajuan
          </h2>
        </div>

        <div className="academic-card bg-white overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-[11px] w-40">Status</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-[11px]">Penjelasan Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3.5 px-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Menunggu</span>
                  </span>
                </td>
                <td className="py-3.5 px-5 text-slate-700 leading-relaxed">
                  Pengajuan telah masuk ke sistem dan sedang dalam antrean verifikasi berkas oleh admin operasional. Ruangan belum terkunci.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Disetujui</span>
                  </span>
                </td>
                <td className="py-3.5 px-5 text-slate-700 leading-relaxed">
                  Surat permohonan telah diverifikasi dan disetujui. Slot jadwal ruangan telah resmi terkunci dan siap digunakan sesuai agenda.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span>Ditolak</span>
                  </span>
                </td>
                <td className="py-3.5 px-5 text-slate-700 leading-relaxed">
                  Pengajuan tidak dapat disetujui. Catatan alasan penolakan dari admin tertera pada halaman rincian peminjaman Anda.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Dibatalkan</span>
                  </span>
                </td>
                <td className="py-3.5 px-5 text-slate-700 leading-relaxed">
                  Peminjaman dibatalkan (oleh pemohon sendiri atau oleh admin dengan alasan resmi sebelum jadwal dimulai). Slot waktu telah dilepaskan kembali.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Tanya Jawab (FAQ) */}
      <section className="space-y-4" aria-labelledby="faq-heading">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-700 text-white text-xs font-bold">
            3
          </span>
          <h2 id="faq-heading" className="text-lg font-bold text-slate-900">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {faqs.map((faq, i) => (
            <div key={i} className="academic-card p-5 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-xs flex items-start gap-2">
                <span className="text-blue-700 font-mono font-bold">Q{i + 1}.</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <div className="academic-card p-8 bg-white text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto">
          <BuildingIcon className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Siap Memilih Ruangan Kegiatan Anda?
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Jelajahi seluruh fasilitas ruangan kampus dan periksa ketersediaan jadwal hari ini.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/ruangan"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <span>Buka Direktori Ruangan</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
