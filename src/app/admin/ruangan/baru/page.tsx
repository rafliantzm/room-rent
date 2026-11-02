import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { RoomForm } from "@/components/admin/RoomForm";
import { ChevronRightIcon, ShieldCheckIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Tambah Ruangan — Admin SPRK",
  description: "Formulir penambahan fasilitas ruangan kampus baru.",
};

export default async function AdminRuanganBaruPage() {
  await requireAdmin();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/admin/ruangan" className="hover:text-slate-800">
          Manajemen Ruangan
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Tambah Baru</span>
      </nav>

      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
          <ShieldCheckIcon className="w-3.5 h-3.5" />
          <span>Fasilitas Baru</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Tambah Fasilitas Ruangan Baru
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Lengkapi kode identitas unik, nama ruangan, lokasi gedung/lantai, kapasitas maksimal, dan foto representatif.
        </p>
      </div>

      <RoomForm />
    </div>
  );
}
