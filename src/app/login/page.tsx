import { Suspense } from "react";
import Link from "next/link";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import {
  CampusEmblemIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  InfoIcon,
} from "@/components/ui/Icons";

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const redirect = typeof resolvedParams.redirect === "string" ? resolvedParams.redirect : undefined;
  const error = typeof resolvedParams.error === "string" ? resolvedParams.error : undefined;

  let errorMessage: string | null = null;
  if (error === "auth_failed") {
    errorMessage = "Autentikasi Google gagal atau dibatalkan oleh pengguna. Silakan coba kembali.";
  } else if (error === "server_error") {
    errorMessage = "Terjadi kendala pada server saat memproses sesi autentikasi. Silakan coba lagi.";
  } else if (error === "missing_code") {
    errorMessage = "Kode autentikasi OAuth tidak ditemukan. Silakan login kembali.";
  } else if (error === "profile_not_found") {
    errorMessage = "Profil pengguna tidak dapat dimuat. Silakan masuk kembali.";
  }

  return (
    <div className="max-w-md mx-auto my-12 sm:my-16 space-y-6">
      {/* Login Card (Swiss Modernism 2.0 & Academic Cleanliness) */}
      <div className="academic-card bg-white p-8 sm:p-10 space-y-7 shadow-md border-slate-200/90">
        <div className="text-center space-y-3.5">
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-amber-300 shadow-md mx-auto ring-1 ring-amber-400/20">
            <CampusEmblemIcon className="w-8 h-8" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
              PORTAL AKADEMIK UNISBANK
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2.5">
              Masuk ke SPRK
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Sistem Informasi Peminjaman Ruangan & Fasilitas Akademik Kampus
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {redirect && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2.5">
            <InfoIcon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Silakan masuk terlebih dahulu menggunakan akun Google untuk mengakses halaman tersebut.
            </span>
          </div>
        )}

        <div className="space-y-4">
          <GoogleLoginButton redirectTo={redirect} />

          <div className="flex items-center gap-1.5 justify-center text-[11px] text-slate-500">
            <ShieldCheckIcon className="w-4 h-4 text-slate-400" />
            <span>Autentikasi Terenkripsi via Google OAuth 2.0</span>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Baru pertama kali meminjam?{" "}
            <Link
              href="/panduan"
              className="text-blue-700 hover:text-blue-800 font-bold hover:underline"
            >
              Baca Panduan Alur Peminjaman →
            </Link>
          </p>
          <p className="text-[11px] text-slate-400">
            Dapat melihat jadwal dan ruangan tanpa harus login.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto my-16 p-8 text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Memuat halaman masuk...</p>
        </div>
      }
    >
      <LoginContent searchParams={props.searchParams} />
    </Suspense>
  );
}
