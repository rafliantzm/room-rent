"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { formatTimeIntervalWIB } from "@/lib/dates";
import { ClockIcon, CalendarIcon, CheckCircleIcon } from "@/components/ui/Icons";
import type { PublicScheduleSlot } from "@/features/rooms/queries";

interface RoomScheduleViewProps {
  roomId: string;
  selectedDate: string;
  minDate: string;
  maxDate: string;
  schedule: PublicScheduleSlot[];
}

export function RoomScheduleView({
  selectedDate,
  minDate,
  maxDate,
  schedule,
}: RoomScheduleViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [dateValue, setDateValue] = useState(selectedDate);

  const handleDateChange = (newDate: string) => {
    setDateValue(newDate);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", newDate);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  // Quick dates (Today, Tomorrow, Day after) based on minDate
  const { today, tomorrow, dayAfter } = useMemo(() => {
    const t0 = new Date(minDate + "T00:00:00Z");
    const t1 = new Date(t0.getTime() + 86400000).toISOString().split("T")[0];
    const t2 = new Date(t0.getTime() + 172800000).toISOString().split("T")[0];
    return { today: minDate, tomorrow: t1, dayAfter: t2 };
  }, [minDate]);

  return (
    <div className="academic-card p-6 space-y-5">
      {/* Header and Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Ketersediaan Jadwal (WIB)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Periksa slot waktu yang telah terpakai sebelum mengajukan permohonan.
          </p>
        </div>

        {/* Date Selector with input */}
        <div className="flex items-center gap-2">
          <input
            id="schedule-date"
            type="date"
            value={dateValue}
            min={minDate}
            max={maxDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Quick Date Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-[11px] font-medium mr-1">Pilihan Cepat:</span>
        <button
          type="button"
          onClick={() => handleDateChange(today)}
          className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
            dateValue === today
              ? "bg-blue-700 text-white shadow-2xs"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          Hari Ini
        </button>
        {tomorrow <= maxDate && (
          <button
            type="button"
            onClick={() => handleDateChange(tomorrow)}
            className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
              dateValue === tomorrow
                ? "bg-blue-700 text-white shadow-2xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            Besok
          </button>
        )}
        {dayAfter <= maxDate && (
          <button
            type="button"
            onClick={() => handleDateChange(dayAfter)}
            className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
              dateValue === dayAfter
                ? "bg-blue-700 text-white shadow-2xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            Lusa
          </button>
        )}
      </div>

      {/* Schedule State Content */}
      {isPending ? (
        <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          <span>Memperbarui jadwal tanggal {dateValue}...</span>
        </div>
      ) : schedule.length > 0 ? (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <ClockIcon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">
                Terdapat {schedule.length} jadwal penggunaan yang telah disetujui:
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Slot waktu di bawah ini tidak dapat dipinjam. Pilihlah rentang jam yang masih kosong.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {schedule.map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-white border border-rose-200 shadow-2xs"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>{formatTimeIntervalWIB(slot.start_at, slot.end_at)}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  Terpakai
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            * Jadwal berdampingan (contoh: 08.00–10.00 dan 10.00–12.00) diperbolehkan dan tidak bentrok.
          </p>
        </div>
      ) : (
        <div className="p-5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-center space-y-1.5">
          <CheckCircleIcon className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-950">
            Ruangan Belum Terpakai pada Tanggal Ini
          </h3>
          <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
            Seluruh slot jam operasional (07.00 – 21.00 WIB) masih berstatus terbuka dan siap Anda ajukan.
          </p>
        </div>
      )}
    </div>
  );
}
