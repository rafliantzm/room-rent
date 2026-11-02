import Link from "next/link";
import { CampusEmblemIcon, BuildingIcon } from "@/components/ui/Icons";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto my-16 text-center space-y-6">
      <div className="academic-card p-8 bg-white space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto">
          <CampusEmblemIcon className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Error 404
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Halaman yang Anda tuju tidak tersedia atau tautan telah dipindahkan.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/ruangan"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors w-full sm:w-auto justify-center"
          >
            <BuildingIcon className="w-4 h-4" />
            <span>Kembali ke Direktori Ruangan</span>
          </Link>
          <Link
            href="/panduan"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2"
          >
            Baca Panduan
          </Link>
        </div>
      </div>
    </div>
  );
}
