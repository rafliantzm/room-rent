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
    <div className="academic-card academic-card-hover group flex flex-col justify-between overflow-hidden">
      <div>
        {/* Room Photo / Graphic Frame */}
        <div className="relative w-full h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden border-b border-slate-100 flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={room.name}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
              <CampusEmblemIcon className="w-10 h-10 opacity-40 text-slate-500" />
              <span className="text-[11px] font-medium text-slate-500">Foto ruangan belum tersedia</span>
            </div>
          )}

          {/* Floating Badges */}
          <div className="absolute top-3 left-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900/85 text-white backdrop-blur-md border border-white/20 shadow-xs">
              {room.code}
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-slate-800 backdrop-blur-md shadow-xs border border-white/40">
              <UsersIcon className="w-3 h-3 text-blue-700" />
              <span>{room.capacity} org</span>
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-5 space-y-3">
          <div>
            <h2 className="font-bold text-base text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
              {room.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="inline-flex items-center gap-1">
                <BuildingIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{room.building}</span>
              </span>
              <span>•</span>
              <span className="font-medium text-slate-600">{room.floor}</span>
            </div>
          </div>

          {room.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-2 border-t border-slate-100">
              {room.description}
            </p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 pt-0">
        <Link
          href={`/ruangan/${room.id}`}
          className="w-full py-2.5 px-4 bg-slate-50 group-hover:bg-blue-700 text-slate-700 group-hover:text-white font-semibold text-xs rounded-lg transition-all duration-150 border border-slate-200 group-hover:border-blue-700 flex items-center justify-center gap-2 shadow-2xs"
        >
          <span>Periksa Jadwal & Ajukan</span>
          <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
