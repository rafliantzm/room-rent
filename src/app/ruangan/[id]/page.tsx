import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getActiveRoomById, getPublicRoomSchedule } from "@/features/rooms/queries";
import { getCurrentUser } from "@/lib/auth";
import { getBookingDateBounds, getWIBDateString } from "@/lib/dates";
import { RoomScheduleView } from "@/components/rooms/RoomScheduleView";
import {
  BuildingIcon,
  UsersIcon,
  ChevronRightIcon,
  CalendarIcon,
  InfoIcon,
  CampusEmblemIcon,
  LayersIcon,
} from "@/components/ui/Icons";

interface RoomDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: RoomDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: room } = await getActiveRoomById(id);
  if (!room) {
    return { title: "Ruangan Tidak Ditemukan — SPRK" };
  }
  return {
    title: `${room.name} (${room.code}) — SPRK`,
    description: `Informasi kapasitas, lokasi, dan jadwal ketersediaan ruangan ${room.name} di ${room.building}.`,
  };
}

async function RoomDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const { data: room, error } = await getActiveRoomById(id);

  if (error || !room) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error || "Ruangan tidak ditemukan atau telah dinonaktifkan dari sistem."}
        </div>
        <Link
          href="/ruangan"
          className="inline-flex items-center text-xs font-semibold text-blue-700 hover:underline"
        >
          ← Kembali ke Direktori Ruangan
        </Link>
      </div>
    );
  }

  const { minDate, maxDate } = getBookingDateBounds();
  const dateParam = typeof resolvedSearchParams.date === "string" ? resolvedSearchParams.date : undefined;
  const selectedDate =
    dateParam && dateParam >= minDate && dateParam <= maxDate
      ? dateParam
      : getWIBDateString();

  const [{ data: schedule }, user] = await Promise.all([
    getPublicRoomSchedule(room.id, selectedDate),
    getCurrentUser(),
  ]);

  const bookingHref = user
    ? `/peminjaman/baru?room=${room.id}&date=${selectedDate}`
    : `/login?redirect=${encodeURIComponent(`/peminjaman/baru?room=${room.id}&date=${selectedDate}`)}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const imageUrl = room.image_path
    ? `${supabaseUrl}/storage/v1/object/public/room-images/${room.image_path}`
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/ruangan" className="hover:text-slate-900 transition-colors">
          Daftar Ruangan
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-none">
          {room.code} — {room.name}
        </span>
      </nav>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Room Profile & Specs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="academic-card overflow-hidden">
            {/* Room Photo */}
            <div className="relative w-full h-64 sm:h-80 bg-slate-100 border-b border-slate-100 flex items-center justify-center">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={`Foto ${room.name}`}
                  fill
                  unoptimized
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
                  <CampusEmblemIcon className="w-14 h-14 opacity-30 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-500">Foto ruangan belum tersedia</p>
                  <p className="text-[11px] text-slate-400">Pengelola belum mengunggah foto untuk ruangan ini.</p>
                </div>
              )}

              {/* Status pill on photo */}
              <div className="absolute top-4 left-4">
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-md bg-slate-900/85 text-white backdrop-blur border border-white/20 shadow-xs">
                  {room.code}
                </span>
              </div>
            </div>

            {/* Room Header & Details */}
            <div className="p-6 sm:p-7 space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/80">
                  Ruangan Akademik Aktif
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
                  {room.name}
                </h1>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-400 text-xs font-medium mb-1">
                    <BuildingIcon className="w-4 h-4 text-blue-600" />
                    <span className="hidden sm:inline">Gedung</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">{room.building}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-400 text-xs font-medium mb-1">
                    <LayersIcon className="w-4 h-4 text-indigo-600" />
                    <span className="hidden sm:inline">Lantai</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">{room.floor}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-400 text-xs font-medium mb-1">
                    <UsersIcon className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Kapasitas</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">{room.capacity} orang</p>
                </div>
              </div>

              {/* Description */}
              {room.description && (
                <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Keterangan & Fasilitas
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {room.description}
                  </p>
                </div>
              )}

              {/* Rules banner */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/70 text-xs text-blue-900 flex items-start gap-2.5">
                <InfoIcon className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <p className="font-bold text-blue-950">Aturan Penggunaan Fasilitas:</p>
                  <p className="text-blue-800">
                    Durasi peminjaman 30 menit s.d. 4 jam. Setiap pengajuan baru wajib melampirkan 1 berkas surat permohonan peminjaman dalam format PDF (maks. 5 MB).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Schedule & Quick Booking CTA (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
          {/* Action Box */}
          <div className="academic-card p-6 bg-gradient-to-br from-white to-blue-50/30 border-blue-200/80 shadow-xs space-y-4">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Alur Pengajuan
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Siap Mengajukan Ruangan?
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Pilih tanggal pada jadwal di bawah, lalu klik tombol berikut untuk mengisi data dan mengunggah surat PDF.
              </p>
            </div>

            <Link
              href={bookingHref}
              className="w-full py-3 px-5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-center"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Ajukan Peminjaman Ruangan</span>
            </Link>

            {!user && (
              <p className="text-[11px] text-slate-400 text-center">
                * Anda akan diminta login dengan akun Google terlebih dahulu.
              </p>
            )}
          </div>

          {/* Interactive Schedule View */}
          <RoomScheduleView
            roomId={room.id}
            selectedDate={selectedDate}
            minDate={minDate}
            maxDate={maxDate}
            schedule={schedule}
          />
        </div>
      </div>
    </div>
  );
}

export default function RoomDetailPage(props: RoomDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          <span>Memuat rincian ruangan dan jadwal...</span>
        </div>
      }
    >
      <RoomDetailContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
