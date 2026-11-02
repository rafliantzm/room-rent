import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAllRoomsAdmin } from "@/features/admin/queries";
import { RoomToggleActiveButton } from "@/components/admin/RoomToggleActiveButton";
import {
  BuildingIcon,
  UsersIcon,
  MapPinIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Kelola Ruangan — Admin SPRK",
  description: "Manajemen data ruangan akademik, kapasitas, dan status aktif/nonaktif.",
};

export default async function AdminRuanganPage() {
  await requireAdmin();
  const { data: rooms, error } = await getAllRoomsAdmin();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>Katalog Fasilitas Kampus</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Ruangan Kampus
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Kelola identitas, kapasitas, lokasi fisik, foto utama, dan status ketersediaan fasilitas ruangan.
          </p>
        </div>
        <div>
          <Link
            href="/admin/ruangan/baru"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <BuildingIcon className="w-4 h-4" />
            <span>+ Tambah Ruangan Baru</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Rooms Table */}
      {rooms.length > 0 ? (
        <div className="academic-card bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs">
                <tr>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Ruangan</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Lokasi</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Kapasitas</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px]">Status Publik</th>
                  <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-[11px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {rooms.map((room) => {
                  const imageUrl = room.image_path
                    ? `${supabaseUrl}/storage/v1/object/public/room-images/${room.image_path}`
                    : null;

                  return (
                    <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={room.name}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <BuildingIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                                {room.code}
                              </span>
                              <span className="font-bold text-slate-900 truncate">
                                {room.name}
                              </span>
                            </div>
                            {room.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                                {room.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{room.building}, {room.floor}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-slate-900 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{room.capacity} orang</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        {room.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <RoomToggleActiveButton roomId={room.id} isActive={room.is_active} />
                          <Link
                            href={`/admin/ruangan/${room.id}/edit`}
                            className="text-xs font-semibold px-3 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
                          >
                            Edit
                          </Link>
                        </div>
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
              <BuildingIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                Belum Ada Data Ruangan
              </h2>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Katalog ruangan kampus masih kosong. Tambahkan data ruangan pertama untuk membuka layanan peminjaman.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/admin/ruangan/baru"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <BuildingIcon className="w-4 h-4" />
                Tambah Ruangan Baru
              </Link>
            </div>
          </div>
        )
      )}
    </div>
  );
}
