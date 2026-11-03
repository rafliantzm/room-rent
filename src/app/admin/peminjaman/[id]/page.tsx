import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminBookingById } from "@/features/admin/queries";
import {
  formatIndonesianDate,
  formatTimeIntervalWIB,
  formatDateTimeWIB,
  isPast,
} from "@/lib/dates";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AdminDecisionControls } from "@/components/admin/AdminDecisionControls";
import {
  CalendarIcon,
  ClockIcon,
  BuildingIcon,
  FilePdfIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
} from "@/components/ui/Icons";

interface AdminBookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Pemeriksaan Pengajuan — Admin SPRK",
  description: "Rincian dan tindakan persetujuan pengajuan peminjaman ruangan.",
};

async function AdminBookingDetailContent({ params }: AdminBookingDetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const { data: booking, error } = await getAdminBookingById(id);

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="academic-card p-8 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
            <AlertCircleIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Pengajuan Tidak Ditemukan</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {error || "Data pengajuan peminjaman tidak ditemukan di database."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/peminjaman"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              ← Kembali ke Antrean Pengajuan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPastStart = isPast(booking.start_at);
  const isApproved = booking.status === "approved";
  const hasEnded = isApproved && isPast(booking.end_at);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/admin/peminjaman" className="hover:text-slate-800">
          Antrean Pengajuan
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold font-mono">{booking.room?.code}</span>
      </nav>

      {/* Main Container Card */}
      <div className="academic-card bg-white p-6 sm:p-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-1">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span>Pemeriksaan Berkas Permohonan</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Pemeriksaan Pengajuan Peminjaman
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              ID Pengajuan: {booking.id}
            </p>
          </div>

          <div className="shrink-0">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {hasEnded && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Masa waktu kegiatan untuk peminjaman ini telah berakhir pada masa lalu.</span>
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
                {booking.borrower_name || booking.user_profile?.full_name || "Belum tercatat"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">NIM:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {booking.borrower_nim || "Belum tercatat"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Email Akun Google:</span>
              <span className="font-mono text-slate-800 font-medium">
                {booking.user_profile?.email || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Room & Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-blue-700 flex items-center justify-center shrink-0">
              <BuildingIcon className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Ruangan yang Diajukan
              </span>
              <p className="text-sm font-bold text-slate-900">
                {booking.room?.name}
              </p>
              <p className="text-xs text-slate-600 font-mono">
                {booking.room?.code} • {booking.room?.building}, {booking.room?.floor}
              </p>
              <p className="text-xs text-slate-500">
                Kapasitas: {booking.room?.capacity} orang
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-blue-700 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Jadwal & Peserta
              </span>
              <p className="text-sm font-bold text-slate-900">
                {formatIndonesianDate(booking.start_at)}
              </p>
              <p className="text-xs font-bold text-blue-700 font-mono">
                {formatTimeIntervalWIB(booking.start_at, booking.end_at)}
              </p>
              <p className="text-xs text-slate-700 font-medium">
                Jumlah Peserta: {booking.participant_count} orang
              </p>
            </div>
          </div>
        </div>

        {/* Keperluan Kegiatan */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Keperluan Agenda Kegiatan
          </span>
          <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
            {booking.purpose}
          </p>
          <div className="pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Dikirim pemohon pada: {formatDateTimeWIB(booking.created_at)}
          </div>
        </div>

        {/* Examination of Attached Letter PDF (PRD v1.2 FR-09) */}
        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Surat Permohonan Peminjaman Resmi (PDF)
            </span>
            {booking.letter_path ? (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ✓ Berkas Terlampir
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Surat Tidak Tersedia
              </span>
            )}
          </div>

          {booking.letter_path ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <FilePdfIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Dokumen Surat Resmi Pemohon (PDF)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Periksa tanda tangan dan keabsahan surat sebelum menyetujui pengajuan.
                  </p>
                </div>
              </div>

              <a
                href={`/api/booking-letters/${booking.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
              >
                <span>Buka Surat PDF</span>
                <ExternalLinkIcon className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs leading-relaxed">
              <strong>Catatan:</strong> Surat peminjaman belum tersedia karena pengajuan dibuat sebelum pembaruan sistem. Pengajuan tanpa surat tidak dapat disetujui. Silakan tolak pengajuan dengan catatan agar pemohon mengajukan ulang beserta surat permohonan.
            </div>
          )}
        </div>

        {/* Existing Notes / Review History */}
        {booking.review_note && (
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1">
            <span className="font-bold text-rose-900 uppercase tracking-wider block">
              Catatan Penolakan Admin
            </span>
            <p className="text-rose-800 text-sm leading-relaxed">
              {booking.review_note}
            </p>
            {booking.reviewed_at && (
              <p className="text-[11px] text-rose-600 pt-1">
                Ditolak pada: {formatDateTimeWIB(booking.reviewed_at)}
              </p>
            )}
          </div>
        )}

        {booking.cancellation_reason && (
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs space-y-1">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              Alasan Pembatalan
            </span>
            <p className="text-slate-800 leading-relaxed">
              {booking.cancellation_reason}
            </p>
            {booking.cancelled_at && (
              <p className="text-[11px] text-slate-500 pt-1">
                Dibatalkan pada: {formatDateTimeWIB(booking.cancelled_at)}
              </p>
            )}
          </div>
        )}

        {/* Action Controls Section */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Tindakan Keputusan Administrator
          </span>
          <AdminDecisionControls
            bookingId={booking.id}
            status={booking.status}
            isPastStart={isPastStart}
            hasLetter={Boolean(booking.letter_path)}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminBookingDetailPage(props: AdminBookingDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Memuat rincian pengajuan...</p>
        </div>
      }
    >
      <AdminBookingDetailContent params={props.params} />
    </Suspense>
  );
}
