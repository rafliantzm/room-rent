"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertCircleIcon } from "@/components/ui/Icons";

interface GoogleLoginButtonProps {
  redirectTo?: string;
}

export function GoogleLoginButton({ redirectTo }: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const supabase = createClient();

      const callbackUrl = new URL("/auth/callback", window.location.origin);
      if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
        callbackUrl.searchParams.set("next", redirectTo);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        setErrorMessage(`Gagal memulai login Google: ${error.message}`);
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Konfigurasi Supabase belum lengkap. Pastikan URL dan Publishable Key telah diatur di .env.local.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div className="p-3.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs transition-all"
      >
        {/* Official Google 'G' Icon */}
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12c0 2.02.46 3.84 1.26 5.42l4.02-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>{loading ? "Menghubungkan ke Google..." : "Masuk dengan Akun Google"}</span>
      </button>
    </div>
  );
}
