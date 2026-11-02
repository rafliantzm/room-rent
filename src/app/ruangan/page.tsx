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

      {/* Hero Banner Section */}
      <section className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 md:p-10 shadow-sm border border-slate-800 overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/20 text-[11px] font-semibold tracking-wide">
            <BuildingIcon className="w-3.5 h-3.5" />
            <span>FASILITAS AKADEMIK KAMPUS</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Peminjaman Ruangan Kuliah & Pertemuan
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Periksa ketersediaan jadwal terpakai, ketahui kapasitas dan fasilitas ruangan, lalu ajukan permohonan peminjaman dengan melampirkan surat permohonan resmi secara mudah.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/panduan"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg backdrop-blur-md transition-colors border border-white/20"
            >
              <span>Pelajari Alur Panduan</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Subtle decorative background circles */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -top-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
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
