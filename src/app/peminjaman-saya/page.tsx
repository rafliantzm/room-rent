import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getMyBookings } from "@/features/bookings/queries";
import { formatIndonesianDate, formatTimeIntervalWIB, isPast } from "@/lib/dates";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  CalendarIcon,
  ClockIcon,
  BuildingIcon,
  FilePdfIcon,
  ChevronRightIcon,
  AlertCircleIcon,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Peminjaman Saya — SPRK",
  description: "Daftar seluruh riwayat pengajuan peminjaman ruangan kampus milik Anda.",
};

export default async function PeminjamanSayaPage() {
  await requireUser();
  const { data: bookings, error } = await getMyBookings();

  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const approvedCount = bookings.filter((b) => b.status === "approved").length;
  const otherCount = bookings.filter((b) => b.status === "rejected" || b.status === "cancelled").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            Portal Peminjam
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Riwayat Peminjaman Saya
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Pantau status verifikasi dokumen surat, persetujuan admin operasional, dan jadwal pemakaian ruangan Anda.
          </p>
        </div>
        <div>
          <Link
            href="/ruangan"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <BuildingIcon className="w-4 h-4" />
            + Ajukan Peminjaman Baru
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Overview */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="academic-card p-3.5 bg-white">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Pengajuan
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {totalCount}
            </span>
          </div>

          <div className="academic-card p-3.5 bg-white border-l-4 border-l-amber-500">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
              Menunggu Review
            </span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">
              {pendingCount}
            </span>
          </div>

          <div className="academic-card p-3.5 bg-white border-l-4 border-l-emerald-500">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Disetujui
            </span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              {approvedCount}
            </span>
          </div>

          <div className="academic-card p-3.5 bg-white border-l-4 border-l-slate-300">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Ditolak / Batal
            </span>
            <span className="text-2xl font-bold text-slate-700 mt-1 block">
              {otherCount}
            </span>
          </div>
        </div>
      )}

      {/* Bookings Table / Cards */}
      {bookings.length > 0 ? (
        <div className="academic-card bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs">
                <tr>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Ruangan</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Jadwal Pelaksanaan</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Keperluan & Dokumen</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Status Pengajuan</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px] text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => {
                  const isApproved = booking.status === "approved";
                  const hasEnded = isApproved && isPast(booking.end_at);

                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-4 px-5 align-top">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {booking.room?.name || "Ruangan Kampus"}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {booking.room?.code} • {booking.room?.building}
                        </div>
                      </td>

                      <td className="py-4 px-5 align-top">
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatIndonesianDate(booking.start_at)}</span>
                        </div>
                        <div className="text-xs text-slate-600 font-mono mt-1 flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatTimeIntervalWIB(booking.start_at, booking.end_at)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 align-top max-w-xs">
                        <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                          {booking.purpose}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                          <span>{booking.participant_count} peserta</span>
                          <span>•</span>
                          {booking.letter_path ? (
                            <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                              <FilePdfIcon className="w-3 h-3 text-rose-500" />
                              Surat PDF
                            </span>
                          ) : (
                            <span className="text-slate-400">Tanpa berkas</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 align-top">
                        <StatusBadge status={booking.status} />
                        {hasEnded && (
                          <p className="text-[10px] text-slate-500 font-medium mt-1">
                            Selesai digunakan
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                        <Link
                          href={`/peminjaman-saya/${booking.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 rounded-lg transition-colors"
                        >
                          <span>Buka</span>
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
          <div className="academic-card p-12 bg-white text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                Belum Ada Riwayat Peminjaman
              </h2>
              <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Anda belum pernah mengajukan peminjaman ruangan. Buka direktori ruangan kampus untuk mengecek ketersediaan jadwal dan fasilitas.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/ruangan"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <BuildingIcon className="w-4 h-4" />
                Lihat Direktori Ruangan
              </Link>
            </div>
          </div>
        )
      )}
    </div>
  );
}
