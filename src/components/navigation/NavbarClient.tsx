"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserProfile } from "@/lib/auth";
import { signOutAction } from "@/features/auth/actions";
import { CampusEmblemIcon, ShieldCheckIcon } from "@/components/ui/Icons";

interface NavbarClientProps {
  profile: UserProfile | null;
}

export function NavbarClient({ profile }: NavbarClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = profile?.role === "admin";
  const isAuthenticated = !!profile;

  const getNavLinkClass = (href: string) => {
    const isActive =
      pathname === href ||
      (href !== "/ruangan" && href !== "/admin/peminjaman" && pathname.startsWith(href));
    return `text-xs font-semibold px-3.5 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
      isActive
        ? "text-blue-700 bg-blue-50/80 font-bold shadow-2xs"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
    }`;
  };

  const getMobileNavLinkClass = (href: string) => {
    const isActive =
      pathname === href ||
      (href !== "/ruangan" && href !== "/admin/peminjaman" && pathname.startsWith(href));
    return `block text-sm font-semibold px-3.5 py-2.5 rounded-lg transition-colors ${
      isActive
        ? "text-blue-700 bg-blue-50 font-bold"
        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
    }`;
  };

  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <Link
            href={isAdmin ? "/admin/peminjaman" : "/ruangan"}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <CampusEmblemIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                  SPRK
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    <ShieldCheckIcon className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline leading-none mt-0.5">
                Sistem Peminjaman Ruangan Kampus
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/60 p-1 rounded-xl border border-slate-200/60" aria-label="Navigasi Utama">
          {isAdmin ? (
            <>
              <Link href="/admin/peminjaman" className={getNavLinkClass("/admin/peminjaman")}>
                Antrean Pengajuan
              </Link>
              <Link href="/admin/ruangan" className={getNavLinkClass("/admin/ruangan")}>
                Kelola Ruangan
              </Link>
              <Link href="/admin/jadwal" className={getNavLinkClass("/admin/jadwal")}>
                Jadwal Approved
              </Link>
            </>
          ) : (
            <>
              <Link href="/ruangan" className={getNavLinkClass("/ruangan")}>
                Daftar Ruangan
              </Link>
              <Link href="/panduan" className={getNavLinkClass("/panduan")}>
                Panduan Peminjaman
              </Link>
              {isAuthenticated && (
                <Link href="/peminjaman-saya" className={getNavLinkClass("/peminjaman-saya")}>
                  Peminjaman Saya
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Desktop User / Auth Button */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-900 line-clamp-1 max-w-[130px]">
                    {profile.full_name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {isAdmin ? "Administrator" : "Pengguna"}
                  </p>
                </div>
              </div>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-xs font-medium px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors shadow-2xs"
                >
                  Keluar
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors shadow-xs"
            >
              Masuk Akun
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-expanded={mobileMenuOpen}
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {isAuthenticated && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">{profile.full_name}</p>
                <p className="text-[10px] text-slate-500">{profile.email}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                {isAdmin ? "Admin" : "User"}
              </span>
            </div>
          )}

          {isAdmin ? (
            <>
              <Link
                href="/admin/peminjaman"
                onClick={() => setMobileMenuOpen(false)}
                className={getMobileNavLinkClass("/admin/peminjaman")}
              >
                Antrean Pengajuan
              </Link>
              <Link
                href="/admin/ruangan"
                onClick={() => setMobileMenuOpen(false)}
                className={getMobileNavLinkClass("/admin/ruangan")}
              >
                Kelola Ruangan
              </Link>
              <Link
                href="/admin/jadwal"
                onClick={() => setMobileMenuOpen(false)}
                className={getMobileNavLinkClass("/admin/jadwal")}
              >
                Jadwal Approved
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/ruangan"
                onClick={() => setMobileMenuOpen(false)}
                className={getMobileNavLinkClass("/ruangan")}
              >
                Daftar Ruangan
              </Link>
              <Link
                href="/panduan"
                onClick={() => setMobileMenuOpen(false)}
                className={getMobileNavLinkClass("/panduan")}
              >
                Panduan Peminjaman
              </Link>
              {isAuthenticated && (
                <Link
                  href="/peminjaman-saya"
                  onClick={() => setMobileMenuOpen(false)}
                  className={getMobileNavLinkClass("/peminjaman-saya")}
                >
                  Peminjaman Saya
                </Link>
              )}
            </>
          )}

          <div className="pt-3 border-t border-slate-100 mt-2">
            {isAuthenticated ? (
              <form action={signOutAction} className="w-full">
                <button
                  type="submit"
                  className="w-full text-center text-xs font-semibold py-2 px-4 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                >
                  Keluar dari Akun
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center text-xs font-semibold py-2.5 px-4 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors"
              >
                Masuk Akun Google
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
