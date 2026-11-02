import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminSchedule, getAllRoomsAdmin } from "@/features/admin/queries";
import { getWIBDateString, formatTimeIntervalWIB, formatIndonesianDate } from "@/lib/dates";
import { AdminScheduleFilter } from "@/components/admin/AdminScheduleFilter";
import {
  CalendarIcon,
  ClockIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Jadwal Penggunaan Ruangan — Admin SPRK",
  description: "Daftar peminjaman yang telah disetujui per tanggal dan ruangan.",
};

interface AdminJadwalPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function AdminJadwalContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const resolvedParams = await searchParams;

  const dateParam = typeof resolvedParams.date === "string" ? resolvedParams.date : getWIBDateString();
  const roomParam = typeof resolvedParams.room === "string" ? resolvedParams.room : "all";

  const [{ data: bookings, error }, { data: rooms }] = await Promise.all([
    getAdminSchedule(dateParam, roomParam),
    getAllRoomsAdmin(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
          <ShieldCheckIcon className="w-3.5 h-3.5" />
          <span>Agenda Operasional</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Jadwal Ruangan Disetujui
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Pantau seluruh alokasi ruangan yang telah resmi disetujui (status Approved) pada tanggal operasional terpilih.
        </p>
      </div>

      {/* Filter Component */}
      <AdminScheduleFilter
        currentDate={dateParam}
        currentRoom={roomParam}
        rooms={rooms}
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Schedule Table */}
      {bookings.length > 0 ? (
        <div className="academic-card bg-white overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold text-slate-900">
                Jadwal: {formatIndonesianDate(dateParam)}
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
              {bookings.length} Peminjaman Disetujui
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200 text-slate-600 text-xs">
                <tr>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Rentang Waktu (WIB)</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Ruangan</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Pemohon</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Keperluan</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Peserta</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px] text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <ClockIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{formatTimeIntervalWIB(booking.start_at, booking.end_at)}</span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{booking.room?.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {booking.room?.code} • {booking.room?.building}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900">
                        {booking.user_profile?.full_name || "Pengguna Kampus"}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {booking.user_profile?.email || "-"}
                      </div>
                    </td>

                    <td className="py-4 px-5 max-w-xs text-slate-700">
                      <p className="line-clamp-2 leading-relaxed">{booking.purpose}</p>
                    </td>

                    <td className="py-4 px-5 text-slate-800 font-medium">
                      {booking.participant_count} orang
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/peminjaman/${booking.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 rounded-lg transition-colors"
                      >
                        <span>Detail</span>
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !error && (
          <div className="academic-card p-12 bg-white text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-900">
              Tidak Ada Jadwal Disetujui
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Belum ada peminjaman yang disetujui pada tanggal {formatIndonesianDate(dateParam)}. Seluruh slot ruangan berstatus bebas pada tanggal tersebut.
            </p>
          </div>
        )
      )}
    </div>
  );
}

export default function AdminJadwalPage(props: AdminJadwalPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Memuat jadwal penggunaan ruangan...</p>
        </div>
      }
    >
      <AdminJadwalContent searchParams={props.searchParams} />
    </Suspense>
  );
}
