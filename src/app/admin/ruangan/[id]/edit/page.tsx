import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getRoomByIdAdmin } from "@/features/admin/queries";
import { RoomForm } from "@/components/admin/RoomForm";
import { ChevronRightIcon, AlertCircleIcon, ShieldCheckIcon } from "@/components/ui/Icons";

interface EditRoomPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Edit Ruangan — Admin SPRK",
  description: "Formulir pembaruan data fasilitas ruangan kampus.",
};

async function EditRoomContent({ params }: EditRoomPageProps) {
  await requireAdmin();
  const { id } = await params;
  const { data: room, error } = await getRoomByIdAdmin(id);

  if (error || !room) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="academic-card p-8 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
            <AlertCircleIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Ruangan Tidak Ditemukan</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {error || "Data ruangan tidak ditemukan di sistem."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/ruangan"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              ← Kembali ke Manajemen Ruangan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/admin/ruangan" className="hover:text-slate-800">
          Manajemen Ruangan
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-mono">{room.code}</span>
        <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Edit Data</span>
      </nav>

      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
          <ShieldCheckIcon className="w-3.5 h-3.5" />
          <span>Edit Fasilitas</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Perbarui Ruangan: {room.name}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Perbarui data operasional ruangan. Kapasitas tidak dapat diturunkan di bawah jumlah peserta pada jadwal mendatang yang telah disetujui.
        </p>
      </div>

      <RoomForm initialRoom={room} />
    </div>
  );
}

export default function AdminEditRoomPage(props: EditRoomPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Memuat data ruangan...</p>
        </div>
      }
    >
      <EditRoomContent params={props.params} />
    </Suspense>
  );
}
