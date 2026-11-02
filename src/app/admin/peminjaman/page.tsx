import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminBookings } from "@/features/admin/queries";
import { formatIndonesianDate, formatTimeIntervalWIB, isPast } from "@/lib/dates";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  CalendarIcon,
  ClockIcon,
  FilePdfIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Kelola Pengajuan Peminjaman — Admin SPRK",
  description: "Antrean verifikasi dan persetujuan peminjaman ruangan kampus.",
};

interface AdminPeminjamanPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function AdminPeminjamanContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const resolvedParams = await searchParams;
  const statusFilter = typeof resolvedParams.status === "string" ? resolvedParams.status : "pending";

  const { data: bookings, error } = await getAdminBookings(statusFilter);

  const filterTabs = [
    { key: "pending", label: "Menunggu Keputusan" },
    { key: "all", label: "Semua Status" },
    { key: "approved", label: "Disetujui" },
    { key: "rejected", label: "Ditolak" },
    { key: "cancelled", label: "Dibatalkan" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
          <ShieldCheckIcon className="w-3.5 h-3.5" />
          <span>Panel Operasional Administrator</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Antrean Pengajuan Peminjaman
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Verifikasi keabsahan dokumen surat permohonan peminjaman dan berikan persetujuan atau penolakan jadwal secara objektif.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto" aria-label="Filter Status">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/peminjaman?status=${tab.key}`}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-blue-700 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings Table */}
      {bookings.length > 0 ? (
        <div className="academic-card bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs">
                <tr>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Pemohon</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Ruangan</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Jadwal Pelaksanaan</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Peserta & Surat</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => {
                  const isApproved = booking.status === "approved";
                  const hasEnded = isApproved && isPast(booking.end_at);

                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-4 px-5 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {booking.user_profile?.full_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {booking.user_profile?.full_name || "Pengguna Kampus"}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {booking.user_profile?.email || "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 align-top">
                        <div className="font-bold text-slate-900 text-xs group-hover:text-blue-700 transition-colors">
                          {booking.room?.name || "Ruangan"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {booking.room?.code} • {booking.room?.building}
                        </div>
                      </td>

                      <td className="py-4 px-5 align-top">
                        <div className="text-xs text-slate-900 font-semibold flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatIndonesianDate(booking.start_at)}</span>
                        </div>
                        <div className="text-xs text-slate-600 font-mono mt-1 flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatTimeIntervalWIB(booking.start_at, booking.end_at)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 align-top text-xs">
                        <div className="text-slate-800 font-medium">
                          {booking.participant_count} orang
                        </div>
                        <div className="mt-1">
                          {booking.letter_path ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                              <FilePdfIcon className="w-3 h-3 text-rose-500" />
                              Ada Surat PDF
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-700 font-medium">
                              Belum ada surat
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 align-top">
                        <StatusBadge status={booking.status} />
                        {hasEnded && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Selesai
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                        <Link
                          href={`/admin/peminjaman/${booking.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 rounded-lg transition-colors"
                        >
                          <span>Periksa</span>
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
              Tidak Ada Pengajuan dengan Filter Ini
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {statusFilter === "pending"
                ? "Semua antrean pengajuan peminjaman telah selesai diproses oleh admin."
                : "Belum ada catatan pengajuan pada kategori filter status ini."}
            </p>
          </div>
        )
      )}
    </div>
  );
}

export default function AdminPeminjamanPage(props: AdminPeminjamanPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Memuat data pengajuan peminjaman...</p>
        </div>
      }
    >
      <AdminPeminjamanContent searchParams={props.searchParams} />
    </Suspense>
  );
}
