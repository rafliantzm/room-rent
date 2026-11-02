"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelOwnBookingAction } from "@/features/bookings/actions";
import { AlertCircleIcon, TrashIcon } from "@/components/ui/Icons";

interface UserCancelBookingButtonProps {
  bookingId: string;
}

export function UserCancelBookingButton({ bookingId }: UserCancelBookingButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await cancelOwnBookingAction(bookingId);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setShowConfirm(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membatalkan peminjaman.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {error && (
        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 rounded-lg transition-colors"
        >
          <TrashIcon className="w-3.5 h-3.5 text-rose-600" />
          <span>Batalkan Peminjaman</span>
        </button>
      ) : (
        <div className="p-4 bg-rose-50 border border-rose-200/90 rounded-xl space-y-3 max-w-md shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-950">
                Konfirmasi Pembatalan Peminjaman
              </p>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                Slot waktu ruangan akan langsung dilepaskan kembali untuk pengguna lain. Tindakan ini permanen dan tidak dapat diurungkan.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-200/60">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-lg transition-colors"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              {loading ? "Membatalkan..." : "Ya, Batalkan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
