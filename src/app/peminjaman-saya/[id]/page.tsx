import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getMyBookingById } from "@/features/bookings/queries";
import {
  formatIndonesianDate,
  formatTimeIntervalWIB,
  formatDateTimeWIB,
  isPast,
} from "@/lib/dates";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserCancelBookingButton } from "@/components/bookings/UserCancelBookingButton";
import {
  CalendarIcon,
  ClockIcon,
  BuildingIcon,
  UsersIcon,
  FilePdfIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
} from "@/components/ui/Icons";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Detail Peminjaman — SPRK",
  description: "Rincian status dan jadwal pengajuan peminjaman ruangan kampus.",
};

async function BookingDetailContent({ params }: BookingDetailPageProps) {
  const { user } = await requireUser();
  const { id } = await params;
  const { data: booking, error } = await getMyBookingById(id);

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="academic-card p-8 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
            <AlertCircleIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Peminjaman Tidak Ditemukan</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {error || "Data peminjaman tidak ditemukan atau Anda tidak memiliki hak akses."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/peminjaman-saya"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              ← Kembali ke Peminjaman Saya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = booking.status === "approved";
  const hasEnded = isApproved && isPast(booking.end_at);
  const canCancel =
    (booking.status === "pending" || booking.status === "approved") && !isPast(booking.start_at);
  const wasCancelledByMe = booking.status === "cancelled" && booking.cancelled_by === user.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/peminjaman-saya" className="hover:text-slate-800">
          Peminjaman Saya
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold font-mono">{booking.room?.code}</span>
      </nav>

      {/* Main Container Card */}
      <div className="academic-card bg-white p-6 sm:p-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {booking.room?.code}
              </span>
              <span className="text-xs text-slate-500">• {booking.room?.building}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {booking.room?.name || "Ruangan Kampus"}
            </h1>
            <p className="text-xs text-slate-500">
              ID Pengajuan: <span className="font-mono">{booking.id}</span>
            </p>
          </div>

          <div className="shrink-0">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Dynamic Status Notice Banner */}
        {booking.status === "pending" && (
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircleIcon className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed space-y-0.5">
              <p className="font-bold">Pengajuan Sedang Ditinjau Admin Operasional</p>
              <p className="text-amber-800">
                Dokumen surat permohonan Anda sedang diverifikasi. Ruangan belum terkunci secara final hingga pengajuan disetujui.
              </p>
            </div>
          </div>
        )}

        {booking.status === "approved" && !hasEnded && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed space-y-0.5">
              <p className="font-bold">Pengajuan Disetujui!</p>
              <p className="text-emerald-800">
                Jadwal penggunaan ruangan telah resmi tercatat. Silakan hadir tepat waktu sesuai jadwal operasional yang disetujui.
              </p>
            </div>
          </div>
        )}

        {hasEnded && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-slate-700">
            <ClockIcon className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Masa waktu penggunaan ruangan ini telah berakhir.</span>
          </div>
        )}

        {booking.status === "rejected" && (
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
              <AlertCircleIcon className="w-4 h-4 text-rose-600" />
              <span>Alasan Penolakan dari Admin:</span>
            </div>
            <p className="text-sm text-rose-900 pl-6 leading-relaxed">
              {booking.review_note || "Tidak ada catatan khusus yang dilampirkan oleh admin."}
            </p>
            {booking.reviewed_at && (
              <p className="text-[11px] text-rose-600 pl-6">
                Ditinjau pada {formatDateTimeWIB(booking.reviewed_at)}
              </p>
            )}
          </div>
        )}

        {booking.status === "cancelled" && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <p className="font-bold text-slate-900">
              {wasCancelledByMe ? "Pengajuan Dibatalkan oleh Anda" : "Pengajuan Dibatalkan oleh Admin"}
            </p>
            {booking.cancelled_at && (
              <p className="text-slate-600">
                Waktu pembatalan: {formatDateTimeWIB(booking.cancelled_at)}
              </p>
            )}
            {booking.cancellation_reason && (
              <div className="pt-2 border-t border-slate-200 mt-2">
                <span className="font-semibold text-slate-700 block">Alasan Pembatalan:</span>
                <p className="text-slate-800 mt-0.5">{booking.cancellation_reason}</p>
              </div>
            )}
          </div>
        )}

        {/* Applicant Identity Card */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Identitas Pemohon
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Nama Lengkap:</span>
              <span className="font-bold text-slate-900 text-sm">
                {booking.borrower_name || user.user_metadata?.full_name || "Belum tercatat"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">NIM:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {booking.borrower_nim || "Belum tercatat"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Email Akun:</span>
              <span className="font-mono text-slate-800 font-medium">
                {user.email || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Schedule & Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-blue-700 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Tanggal Pelaksanaan
              </span>
              <p className="text-sm font-bold text-slate-900">
                {formatIndonesianDate(booking.start_at)}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-blue-700 flex items-center justify-center shrink-0">
              <ClockIcon className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Rentang Waktu (WIB)
              </span>
              <p className="text-sm font-bold text-slate-900 font-mono">
                {formatTimeIntervalWIB(booking.start_at, booking.end_at)}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-blue-700 flex items-center justify-center shrink-0">
              <BuildingIcon className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Lokasi Ruangan
              </span>
              <p className="text-sm font-bold text-slate-900">
                {booking.room?.building}, {booking.room?.floor}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-blue-700 flex items-center justify-center shrink-0">
              <UsersIcon className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Peserta & Diajukan Pada
              </span>
              <p className="text-sm font-bold text-slate-900">
                {booking.participant_count} orang
              </p>
              <p className="text-xs text-slate-500">
                Diajukan {formatDateTimeWIB(booking.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Keperluan Kegiatan */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Keperluan Kegiatan
          </span>
          <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
            {booking.purpose}
          </p>
        </div>

        {/* Attached Letter Document */}
        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Dokumen Surat Permohonan Resmi (PDF)
          </span>

          {booking.letter_path ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <FilePdfIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    Surat Permohonan Terverifikasi
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tersimpan secara privat di Supabase Storage
                  </p>
                </div>
              </div>

              <a
                href={`/api/booking-letters/${booking.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
              >
                <span>Lihat Berkas PDF</span>
                <ExternalLinkIcon className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-500">
              Surat peminjaman tidak terlampir (pengajuan terdahulu).
            </div>
          )}
        </div>

        {/* Bottom Cancellation Action */}
        {canCancel && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-600">
              Agenda Anda dibatalkan atau berubah jadwal?
            </p>
            <UserCancelBookingButton bookingId={booking.id} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingDetailPage(props: BookingDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Memuat rincian peminjaman...</p>
        </div>
      }
    >
      <BookingDetailContent params={props.params} />
    </Suspense>
  );
}
