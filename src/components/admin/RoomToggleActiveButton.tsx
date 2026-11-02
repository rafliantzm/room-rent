"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleRoomActiveAction } from "@/features/admin/actions";

interface RoomToggleActiveButtonProps {
  roomId: string;
  isActive: boolean;
}

export function RoomToggleActiveButton({ roomId, isActive }: RoomToggleActiveButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    try {
      setLoading(true);
      const res = await toggleRoomActiveAction(roomId, !isActive);
      if (!res.success) {
        alert(res.error);
      }
      setLoading(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status ruangan.";
      alert(msg);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
        isActive
          ? "border-amber-200 text-amber-800 bg-amber-50/70 hover:bg-amber-100/70"
          : "border-emerald-200 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70"
      }`}
    >
      {loading ? "..." : isActive ? "Nonaktifkan" : "Aktifkan"}
    </button>
  );
}
