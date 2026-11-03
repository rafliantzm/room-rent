import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";
import { CampusEmblemIcon } from "@/components/ui/Icons";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const crimson = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SPRK — Sistem Peminjaman Ruangan Kampus Universitas Pilot Terbang Ngawi",
  description:
    "Portal Resmi Peminjaman Ruangan Akademik Universitas Pilot Terbang Ngawi — Jadwal ketersediaan transparan, pengajuan terstruktur, dan persetujuan terverifikasi.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${crimson.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50/60 text-slate-900 font-sans selection:bg-blue-600/10 selection:text-blue-900">
        <Navbar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
          {children}
        </main>
        <footer className="border-t border-slate-200/80 bg-white/90 backdrop-blur-md py-9 text-xs text-slate-500 mt-auto transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-amber-300 flex items-center justify-center shadow-xs ring-1 ring-slate-900/10">
                <CampusEmblemIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                  SPRK <span className="text-slate-400 font-normal text-xs">|</span>
                  <span className="font-medium text-slate-600 text-xs">Universitas Pilot Terbang Ngawi</span>
                </p>
                <p className="text-[11px] text-slate-500 font-normal">
                  Sistem Informasi Pengelolaan Fasilitas & Peminjaman Ruangan Kampus
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
                Layanan Fasilitas: 07.00 – 21.00 WIB
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span>Hak Cipta © 2026 Universitas Pilot Terbang Ngawi. Hak cipta dilindungi.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
