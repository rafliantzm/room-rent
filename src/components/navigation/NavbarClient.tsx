"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserProfile } from "@/lib/auth";
import { signOutAction } from "@/features/auth/actions";
import {
  CampusEmblemIcon,
  ShieldCheckIcon,
  BuildingIcon,
  BookOpenIcon,
  CalendarIcon,
  LayersIcon,
  ArrowRightIcon,
} from "@/components/ui/Icons";

interface NavbarClientProps {
  profile: UserProfile | null;
}

export function NavbarClient({ profile }: NavbarClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = profile?.role === "admin";
  const isAuthenticated = !!profile;

  const isLinkActive = (href: string) => {
    if (href === "/ruangan") return pathname === "/ruangan" || pathname === "/";
    if (href === "/admin/peminjaman") return pathname === "/admin/peminjaman";
    return pathname === href || pathname.startsWith(href);
  };

  const getNavLinkClass = (href: string) => {
    const active = isLinkActive(href);
    return `relative text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
      active
        ? "text-blue-900 bg-white shadow-xs border border-slate-200/60 font-bold scale-[1.02]"
        : "text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:-translate-y-0.5"
    }`;
  };

  const getMobileNavLinkClass = (href: string) => {
    const active = isLinkActive(href);
    return `flex items-center gap-2.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
      active
        ? "text-blue-900 bg-blue-50/80 font-bold border border-blue-200/60 shadow-2xs"
        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
    }`;
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-200">
      {/* 1. Top Institutional Ribbon */}
      <div className="bg-slate-900 text-slate-300 text-[11px] font-medium border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <span className="font-semibold text-white tracking-wide">
              UNIVERSITAS PILOT TERBANG NGAWI
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline truncate">
              Portal Layanan Peminjaman Fasilitas & Ruangan Kampus
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
              Sistem Aktif & Terverifikasi
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="text-slate-400 text-[10px] font-mono">
              07.00 – 21.00 WIB
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main High-Fidelity Header */}
      <div className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand Logo & Academic Identity */}
          <Link
            href={isAdmin ? "/admin/peminjaman" : "/ruangan"}
            className="flex items-center gap-3.5 group focus:outline-none"
          >
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-amber-300 flex items-center justify-center shadow-xs ring-1 ring-amber-400/20 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
              <CampusEmblemIcon className="w-6 h-6" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                  SPRK
                </span>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                    <ShieldCheckIcon className="w-3 h-3 text-amber-700" />
                    Admin Fasilitas
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Akademik
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline leading-tight mt-0.5">
                Sistem Peminjaman Ruangan Kampus
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links — Floating Segmented Pill */}
          <nav
            className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/70 shadow-xs"
            aria-label="Navigasi Utama"
          >
            {isAdmin ? (
              <>
                <Link
                  href="/admin/peminjaman"
                  className={getNavLinkClass("/admin/peminjaman")}
                >
                  <LayersIcon className="w-3.5 h-3.5" />
                  <span>Antrean Pengajuan</span>
                </Link>
                <Link
                  href="/admin/ruangan"
                  className={getNavLinkClass("/admin/ruangan")}
                >
                  <BuildingIcon className="w-3.5 h-3.5" />
                  <span>Kelola Ruangan</span>
                </Link>
                <Link
                  href="/admin/jadwal"
                  className={getNavLinkClass("/admin/jadwal")}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Jadwal Approved</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/ruangan"
                  className={getNavLinkClass("/ruangan")}
                >
                  <BuildingIcon className="w-3.5 h-3.5" />
                  <span>Daftar Ruangan</span>
                </Link>
                <Link
                  href="/panduan"
                  className={getNavLinkClass("/panduan")}
                >
                  <BookOpenIcon className="w-3.5 h-3.5" />
                  <span>Panduan</span>
                </Link>
                {isAuthenticated && (
                  <Link
                    href="/peminjaman-saya"
                    className={getNavLinkClass("/peminjaman-saya")}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Peminjaman Saya</span>
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Desktop User / Auth Button */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2.5 py-1.5 px-3 rounded-full bg-slate-50/90 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-700 to-indigo-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[120px] leading-tight">
                      {profile.full_name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">
                      {isAdmin ? "Administrator" : "Mahasiswa / Pemohon"}
                    </p>
                  </div>
                </div>

                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200/80 text-slate-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 active:scale-[0.97] transition-all duration-150 shadow-2xs cursor-pointer"
                  >
                    Keluar
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 text-xs font-bold px-4.5 py-2 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-full shadow-xs hover:shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer"
              >
                <span>Masuk Akun Google</span>
                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors"
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
      </div>

      {/* Mobile Drawer (Animated) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/98 backdrop-blur-2xl px-5 pt-3 pb-6 space-y-2.5 shadow-xl animate-slide-down">
          {isAuthenticated && (
            <div className="flex items-center gap-3 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-700 to-indigo-800 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1 truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{profile.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0 border border-blue-200">
                {isAdmin ? "Admin" : "Mahasiswa"}
              </span>
            </div>
          )}

          <div className="space-y-1">
            {isAdmin ? (
              <>
                <Link
                  href="/admin/peminjaman"
                  onClick={() => setMobileMenuOpen(false)}
                  className={getMobileNavLinkClass("/admin/peminjaman")}
                >
                  <LayersIcon className="w-4 h-4 text-blue-700" />
                  <span>Antrean Pengajuan</span>
                </Link>
                <Link
                  href="/admin/ruangan"
                  onClick={() => setMobileMenuOpen(false)}
                  className={getMobileNavLinkClass("/admin/ruangan")}
                >
                  <BuildingIcon className="w-4 h-4 text-blue-700" />
                  <span>Kelola Ruangan</span>
                </Link>
                <Link
                  href="/admin/jadwal"
                  onClick={() => setMobileMenuOpen(false)}
                  className={getMobileNavLinkClass("/admin/jadwal")}
                >
                  <CalendarIcon className="w-4 h-4 text-blue-700" />
                  <span>Jadwal Approved</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/ruangan"
                  onClick={() => setMobileMenuOpen(false)}
                  className={getMobileNavLinkClass("/ruangan")}
                >
                  <BuildingIcon className="w-4 h-4 text-blue-700" />
                  <span>Daftar Ruangan</span>
                </Link>
                <Link
                  href="/panduan"
                  onClick={() => setMobileMenuOpen(false)}
                  className={getMobileNavLinkClass("/panduan")}
                >
                  <BookOpenIcon className="w-4 h-4 text-blue-700" />
                  <span>Panduan Peminjaman</span>
                </Link>
                {isAuthenticated && (
                  <Link
                    href="/peminjaman-saya"
                    onClick={() => setMobileMenuOpen(false)}
                    className={getMobileNavLinkClass("/peminjaman-saya")}
                  >
                    <CalendarIcon className="w-4 h-4 text-blue-700" />
                    <span>Peminjaman Saya</span>
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            {isAuthenticated ? (
              <form action={signOutAction} className="w-full">
                <button
                  type="submit"
                  className="w-full text-center text-xs font-semibold py-2.5 px-4 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Keluar dari Akun
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full text-center text-xs font-bold py-3 px-4 rounded-xl bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition-all cursor-pointer"
              >
                <span>Masuk Akun Google</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
