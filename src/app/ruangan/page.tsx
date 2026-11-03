import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { listActiveRooms } from "@/features/rooms/queries";
import { RoomCard } from "@/components/rooms/RoomCard";
import { RoomSearch } from "@/components/rooms/RoomSearch";
import { ArrowRightIcon, BuildingIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Daftar Ruangan Kampus — SPRK",
  description: "Daftar fasilitas ruangan aktif yang dapat dipinjam untuk kegiatan akademik dan mahasiswa.",
};

interface RuanganPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function RuanganContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;
  const errorParam = typeof resolvedParams.error === "string" ? resolvedParams.error : undefined;

  const { data: rooms, error } = await listActiveRooms(query);

  return (
    <div className="space-y-8">
      {/* Alert for unauthorized admin access attempt */}
      {errorParam === "unauthorized_admin" && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
          <span className="font-bold shrink-0">Akses Ditolak:</span>
          <span>Akun Anda tidak memiliki hak akses administrator. Anda dialihkan kembali ke direktori ruangan umum.</span>
        </div>
      )}

      {/* Hero Banner Section (Swiss Modernism 2.0 & Academic Prestige) */}
      <section className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-7 sm:p-10 md:p-12 shadow-md border border-slate-800/80 overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/25 text-xs font-semibold tracking-wide">
            <BuildingIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>DIREKTORI FASILITAS AKADEMIK</span>
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            <span className="text-amber-300 font-mono text-[11px]">UNISBANK</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight font-sans">
            Peminjaman Ruangan Kuliah, Lab & Pertemuan
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Akses ketersediaan jadwal terpakai secara transparan, periksa spesifikasi fasilitas, dan ajukan peminjaman kegiatan akademik dengan melampirkan berkas surat permohonan resmi secara terverifikasi.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/panduan"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md transition-all duration-200 border border-white/20 hover:scale-[1.02] active:scale-[0.98] shadow-xs"
            >
              <span>Pelajari Alur & Persyaratan</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
              <span>Jadwal Operasional 07.00 – 21.00 WIB</span>
            </div>
          </div>
        </div>

        {/* Ambient academic lighting accents */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -top-16 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Search and Results Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="w-full sm:max-w-md">
          <RoomSearch />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 font-medium">
          <span className="px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs">
            Menampilkan <strong className="text-slate-800">{rooms.length}</strong> ruangan aktif
          </span>
          {query && (
            <Link
              href="/ruangan"
              className="text-blue-700 hover:text-blue-800 hover:underline font-semibold"
            >
              Hapus Filter
            </Link>
          )}
        </div>
      </div>

      {/* Database connection notice if any */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs sm:text-sm">
          <p className="font-semibold">Informasi Basis Data:</p>
          <p className="text-xs mt-1 text-amber-700">
            {error.includes("environment variables")
              ? "Konfigurasi Supabase (.env.local) belum terhubung ke proyek room-rental. Silakan isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
              : error}
          </p>
        </div>
      )}

      {/* Room Grid */}
      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        !error && (
          <div className="text-center py-16 px-4 academic-card border-dashed">
            <BuildingIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              {query ? `Tidak ada ruangan yang cocok dengan "${query}"` : "Belum ada ruangan aktif yang tersedia"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {query
                ? "Silakan coba kata kunci lain seperti nama gedung, nomor lantai, atau kode ruangan."
                : "Pengelola fasilitas kampus akan menambahkan daftar ruangan aktif segera."}
            </p>
            {query && (
              <div className="mt-5">
                <Link
                  href="/ruangan"
                  className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Lihat Semua Ruangan
                </Link>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

export default function RuanganPage(props: RuanganPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-44 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-72 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-72 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-72 rounded-xl bg-slate-200 animate-pulse" />
          </div>
        </div>
      }
    >
      <RuanganContent searchParams={props.searchParams} />
    </Suspense>
  );
}
