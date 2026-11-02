"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveBookingAction,
  rejectBookingAction,
  cancelApprovedBookingAction,
} from "@/features/admin/actions";
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  TrashIcon,
} from "@/components/ui/Icons";

interface AdminDecisionControlsProps {
  bookingId: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  isPastStart: boolean;
  hasLetter?: boolean;
}

export function AdminDecisionControls({
  bookingId,
  status,
  isPastStart,
  hasLetter = true,
}: AdminDecisionControlsProps) {
  const router = useRouter();

  // Mode: null | "approve" | "reject" | "cancel"
  const [activeModal, setActiveModal] = useState<null | "approve" | "reject" | "cancel">(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await approveBookingAction(bookingId);
      if (!res.success) {
        setErrorMessage(res.error);
        setLoading(false);
        return;
      }
      setActiveModal(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyetujui peminjaman.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await rejectBookingAction(bookingId, reason);
      if (!res.success) {
        setErrorMessage(res.error);
        setLoading(false);
        return;
      }
      setActiveModal(null);
      setReason("");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menolak peminjaman.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const handleCancelApproved = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await cancelApprovedBookingAction(bookingId, reason);
      if (!res.success) {
        setErrorMessage(res.error);
        setLoading(false);
        return;
      }
      setActiveModal(null);
      setReason("");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membatalkan peminjaman.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  if (status === "rejected" || status === "cancelled") {
    return (
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        <span>Pengajuan ini telah selesai diproses dan tidak dapat diubah statusnya lagi.</span>
      </div>
    );
  }

  if (status === "approved" && isPastStart) {
    return (
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        <span>Peminjaman yang telah berlangsung atau selesai tidak dapat dibatalkan melalui antarmuka operasional.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-start gap-2.5">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Tindakan Belum Berhasil:</p>
            <p className="mt-0.5 text-rose-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Button Row */}
      {activeModal === null && (
        <div className="flex flex-wrap items-center gap-3">
          {status === "pending" && (
            <>
              {hasLetter ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setActiveModal("approve");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Setujui Pengajuan</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Surat peminjaman belum tersedia. Pengajuan tanpa surat tidak dapat disetujui."
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-400 cursor-not-allowed text-xs font-semibold rounded-lg border border-slate-200"
                >
                  <AlertCircleIcon className="w-4 h-4 text-slate-400" />
                  <span>Setujui (Wajib Surat PDF)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setReason("");
                  setActiveModal("reject");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <XCircleIcon className="w-4 h-4" />
                <span>Tolak Pengajuan</span>
              </button>
            </>
          )}

          {status === "approved" && !isPastStart && (
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setReason("");
                setActiveModal("cancel");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 rounded-lg transition-colors"
            >
              <TrashIcon className="w-4 h-4 text-rose-600" />
              <span>Batalkan Peminjaman Disetujui</span>
            </button>
          )}
        </div>
      )}

      {/* Confirmation: Approve */}
      {activeModal === "approve" && (
        <div className="academic-card p-5 bg-emerald-50/60 border-emerald-200 rounded-xl space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircleIcon className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-950">
                Konfirmasi Persetujuan Peminjaman Ruangan
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed mt-1">
                Apakah Anda yakin ingin menyetujui pengajuan ini? Menyetujui pengajuan akan secara otomatis mengunci slot jadwal ruangan dan menolak pengajuan bentrok lainnya secara atomik.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/60">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              disabled={loading}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              {loading ? "Menyetujui..." : "Ya, Setujui Sekarang"}
            </button>
          </div>
        </div>
      )}

      {/* Form: Reject */}
      {activeModal === "reject" && (
        <form onSubmit={handleReject} className="academic-card p-5 bg-rose-50/60 border-rose-200 rounded-xl space-y-3">
          <div className="flex items-start gap-2.5">
            <XCircleIcon className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-950">
                Tolak Pengajuan Peminjaman
              </p>
              <p className="text-xs text-rose-800 mt-1">
                Alasan penolakan wajib diisi (10–300 karakter) dan akan terbaca oleh pemohon pada halaman detail peminjamannya.
              </p>
            </div>
          </div>
          <div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Ruangan akan digunakan untuk agenda ujian komprehensif fakultas pada jam tersebut..."
              required
              minLength={10}
              maxLength={300}
              className="w-full px-3.5 py-2.5 border border-rose-300 rounded-lg text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent transition-all"
            />
            <div className="flex justify-end text-[11px] text-slate-500 mt-1 font-mono">
              {reason.trim().length} / 300 karakter (min. 10)
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-200/60">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              disabled={loading}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 10 || reason.trim().length > 300}
              className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              {loading ? "Menolak..." : "Kirim Penolakan"}
            </button>
          </div>
        </form>
      )}

      {/* Form: Cancel Approved */}
      {activeModal === "cancel" && (
        <form onSubmit={handleCancelApproved} className="academic-card p-5 bg-amber-50/60 border-amber-200 rounded-xl space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircleIcon className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-950">
                Batalkan Peminjaman yang Telah Disetujui
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Alasan pembatalan wajib diisi (10–300 karakter) dan akan dikirimkan kepada pemohon. Slot jadwal akan langsung dilepaskan kembali.
              </p>
            </div>
          </div>
          <div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Pemeliharaan instalasi pendingin ruangan darurat sehingga ruangan tidak dapat digunakan..."
              required
              minLength={10}
              maxLength={300}
              className="w-full px-3.5 py-2.5 border border-amber-300 rounded-lg text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-all"
            />
            <div className="flex justify-end text-[11px] text-slate-500 mt-1 font-mono">
              {reason.trim().length} / 300 karakter (min. 10)
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200/60">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              disabled={loading}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 10 || reason.trim().length > 300}
              className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              {loading ? "Membatalkan..." : "Konfirmasi Pembatalan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
