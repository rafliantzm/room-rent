import Link from "next/link";
import Image from "next/image";
import type { Room } from "@/features/rooms/queries";
import { BuildingIcon, UsersIcon, ArrowRightIcon, CampusEmblemIcon } from "@/components/ui/Icons";

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const imageUrl = room.image_path
    ? `${supabaseUrl}/storage/v1/object/public/room-images/${room.image_path}`
    : null;

  return (
    <div className="academic-card academic-card-hover group flex flex-col justify-between overflow-hidden bg-white">
      <div>
        {/* Room Photo / Graphic Frame */}
        <div className="relative w-full h-48 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 overflow-hidden border-b border-slate-100 flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={room.name}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/80 shadow-2xs flex items-center justify-center text-slate-400 border border-slate-200/60">
                <CampusEmblemIcon className="w-6 h-6 opacity-60 text-slate-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-500">Foto ruangan belum tersedia</span>
            </div>
          )}

          {/* Gradient Overlay for Readable Badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-black/20 pointer-events-none" />

          {/* Floating Badges */}
          <div className="absolute top-3 left-3">
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-slate-900/90 text-white backdrop-blur-md border border-white/20 shadow-xs tracking-wider">
              {room.code}
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/95 text-slate-800 backdrop-blur-md shadow-xs border border-white/60">
              <UsersIcon className="w-3.5 h-3.5 text-blue-700" />
              <span>{room.capacity} orang</span>
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-5 sm:p-6 space-y-3">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 leading-snug">
              {room.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
              <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                <BuildingIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{room.building}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                {room.floor}
              </span>
            </div>
          </div>

          {room.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-2.5 border-t border-slate-100/80">
              {room.description}
            </p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 sm:p-6 pt-0">
        <Link
          href={`/ruangan/${room.id}`}
          className="w-full py-2.5 px-4 bg-slate-50/90 group-hover:bg-blue-700 text-slate-700 group-hover:text-white font-bold text-xs rounded-xl transition-all duration-200 border border-slate-200/90 group-hover:border-blue-700 flex items-center justify-center gap-2 shadow-2xs group-hover:shadow-xs active:scale-[0.98]"
        >
          <span>Periksa Jadwal & Pinjam</span>
          <ArrowRightIcon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
