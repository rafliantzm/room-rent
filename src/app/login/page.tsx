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
      {/* Login Card */}
      <div className="academic-card bg-white p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-700 text-white shadow-xs mx-auto">
            <CampusEmblemIcon className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Portal Akademik
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
              Masuk ke SPRK
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Sistem Peminjaman Ruangan Kampus
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
