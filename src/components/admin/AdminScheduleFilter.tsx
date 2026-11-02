"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Room } from "@/features/rooms/queries";
import { CalendarIcon, BuildingIcon } from "@/components/ui/Icons";

interface AdminScheduleFilterProps {
  currentDate: string;
  currentRoom: string;
  rooms: Room[];
}

export function AdminScheduleFilter({
  currentDate,
  currentRoom,
  rooms,
}: AdminScheduleFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleDateChange = (newDate: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", newDate);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleRoomChange = (roomId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (roomId && roomId !== "all") {
      params.set("room", roomId);
    } else {
      params.delete("room");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="academic-card p-4 sm:p-5 bg-white space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date Selector */}
        <div>
          <label htmlFor="filter-date" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-700" />
            <span>Tanggal Operasional (WIB):</span>
          </label>
          <input
            id="filter-date"
            type="date"
            value={currentDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />
        </div>

        {/* Room Selector */}
        <div>
          <label htmlFor="filter-room" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <BuildingIcon className="w-3.5 h-3.5 text-blue-700" />
            <span>Saring Berdasarkan Ruangan:</span>
          </label>
          <select
            id="filter-room"
            value={currentRoom}
            onChange={(e) => handleRoomChange(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          >
            <option value="all">Semua Ruangan Kampus</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.code} — {room.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-xs text-blue-700 font-medium pt-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span>Memperbarui jadwal penggunaan...</span>
        </div>
      )}
    </div>
  );
}
