import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getActiveRoomById } from "@/features/rooms/queries";
import { BookingForm } from "@/components/bookings/BookingForm";
import { BuildingIcon, ChevronRightIcon, AlertCircleIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Form Pengajuan Peminjaman — SPRK",
  description: "Formulir pengajuan peminjaman ruangan kampus SPRK.",
};

interface BookingNewPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function BookingNewContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { profile } = await requireUser();
  const resolvedParams = await searchParams;
  const roomId = typeof resolvedParams.room === "string" ? resolvedParams.room : undefined;
  const dateParam = typeof resolvedParams.date === "string" ? resolvedParams.date : undefined;

  if (!roomId) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="academic-card p-8 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircleIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Ruangan Belum Dipilih</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Untuk membuat pengajuan baru, silakan pilih salah satu ruangan aktif terlebih dahulu dari direktori kampus.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/ruangan"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
            >
              <BuildingIcon className="w-4 h-4" />
              Pilih Ruangan di Direktori
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data: room, error } = await getActiveRoomById(roomId);

  if (error || !room) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="academic-card p-8 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
            <AlertCircleIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Ruangan Tidak Tersedia</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ruangan yang dipilih tidak ditemukan atau sedang dinonaktifkan dari sistem peminjaman.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/ruangan"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              ← Kembali ke Direktori Ruangan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/ruangan" className="hover:text-slate-800">
          Direktori
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
        <Link href={`/ruangan/${room.id}`} className="hover:text-slate-800 font-medium">
          {room.code}
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Pengajuan Peminjaman</span>
      </nav>

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              Formulir Resmi SPRK
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pengajuan Peminjaman Ruangan
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Lengkapi rincian agenda, waktu pelaksanaan, dan unggah surat permohonan peminjaman bertanda tangan.
            </p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs font-medium text-slate-500 block">Ruangan Sasaran:</span>
            <span className="text-base font-bold text-slate-900">{room.name}</span>
            <span className="text-xs text-slate-600 block">({room.code})</span>
          </div>
        </div>
      </div>

      <BookingForm room={room} profile={profile} initialDate={dateParam} />
    </div>
  );
}

export default function BookingNewPage(props: BookingNewPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Memuat formulir pengajuan...</p>
        </div>
      }
    >
      <BookingNewContent searchParams={props.searchParams} />
    </Suspense>
  );
}
