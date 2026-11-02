import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPRK — Sistem Peminjaman Ruangan Kampus",
  description:
    "Portal Resmi Peminjaman Ruangan Akademik Kampus — Akses ketersediaan jadwal transparan, pengajuan terstruktur, dan persetujuan terverifikasi.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <Navbar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200/80 bg-white py-8 text-xs text-slate-500 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
                S
              </span>
              <p className="font-medium text-slate-700">
                SPRK — Sistem Peminjaman Ruangan Kampus
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Operasional Layanan: 07.00 – 21.00 WIB
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span>Hak Cipta © 2026 Layanan Fasilitas Kampus</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
