"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBookingAction } from "@/features/bookings/actions";
import { getOperationalTimeSlots, getBookingDateBounds, formatIndonesianDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { validatePdfMetadata, validatePdfBytes } from "@/lib/validation";
import type { Room } from "@/features/rooms/queries";
import type { UserProfile } from "@/lib/auth";
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  FilePdfIcon,
  UploadCloudIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@/components/ui/Icons";

interface BookingFormProps {
  room: Room;
  profile: UserProfile;
  initialDate?: string;
}

export function BookingForm({ room, profile, initialDate }: BookingFormProps) {
  const router = useRouter();
  const { minDate, maxDate } = getBookingDateBounds();

  // Generate idempotency request key on mount via lazy initializer
  const [requestKey] = useState<string>(() =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "10000000-0000-0000-0000-000000000000"
  );

  // Identity state: full_name prefilled from Google, NIM entered manually
  const [borrowerName, setBorrowerName] = useState<string>(profile.full_name || "");
  const [borrowerNim, setBorrowerNim] = useState<string>("");

  const [date, setDate] = useState<string>(initialDate || minDate);
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [purpose, setPurpose] = useState<string>("");
  const [participantCount, setParticipantCount] = useState<number>(1);

  // Mandatory PDF letter state (PRD v1.2)
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [letterError, setLetterError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const operationalSlots = getOperationalTimeSlots();

  // Calculate duration in hours
  const durationHours = useMemo(() => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const diff = endH * 60 + endM - (startH * 60 + startM);
    if (diff <= 0) return 0;
    const hours = diff / 60;
    return hours;
  }, [startTime, endTime]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLetterError(null);
    const files = e.target.files;
    if (!files || files.length === 0) {
      setLetterFile(null);
      return;
    }

    const file = files[0];

    // 1. Metadata check (MIME, extension, size <= 5 MB)
    const metaCheck = validatePdfMetadata({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!metaCheck.valid) {
      setLetterError(metaCheck.error || "Berkas surat tidak valid.");
      setLetterFile(null);
      e.target.value = "";
      return;
    }

    // 2. Magic bytes verification (%PDF-)
    try {
      const buffer = await file.slice(0, 5).arrayBuffer();
      const byteCheck = validatePdfBytes(new Uint8Array(buffer));
      if (!byteCheck.valid) {
        setLetterError(byteCheck.error || "Isi berkas bukan dokumen PDF yang valid.");
        setLetterFile(null);
        e.target.value = "";
        return;
      }
    } catch {
      setLetterError("Gagal memeriksa keabsahan berkas PDF.");
      setLetterFile(null);
      e.target.value = "";
      return;
    }

    setLetterFile(file);
  };

  const handleRemoveFile = () => {
    setLetterFile(null);
    setLetterError(null);
    const input = document.getElementById("letter-file") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});
    setLetterError(null);

    if (!requestKey) {
      setGeneralError("Gagal menghasilkan kunci sesi unik. Silakan muat ulang halaman.");
      return;
    }

    // PRD v1.2: Validate mandatory PDF letter
    if (!letterFile) {
      setLetterError("Surat peminjaman wajib diunggah dalam format PDF (maks. 5 MB).");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload PDF to private Supabase Storage bucket with User JWT
      const letterPath = `${profile.id}/${requestKey}.pdf`;
      setUploadStatus("Mengunggah surat peminjaman (PDF)...");

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("booking-letters")
        .upload(letterPath, letterFile, {
          upsert: true,
          contentType: "application/pdf",
        });

      if (uploadError) {
        setGeneralError(`Gagal mengunggah berkas surat: ${uploadError.message}`);
        setIsSubmitting(false);
        setUploadStatus(null);
        return;
      }

      // 2. Submit booking to Server Action (invokes atomic PostgreSQL RPC)
      setUploadStatus("Menyimpan pengajuan peminjaman...");
      const result = await createBookingAction({
        room_id: room.id,
        borrower_name: borrowerName.trim(),
        borrower_nim: borrowerNim.trim(),
        date,
        start_time: startTime,
        end_time: endTime,
        purpose,
        participant_count: Number(participantCount),
        request_key: requestKey,
        letter_path: letterPath,
      });

      if (!result.success) {
        setGeneralError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setIsSubmitting(false);
        setUploadStatus(null);
        return;
      }

      // Success: redirect to booking detail in Peminjaman Saya
      router.push(`/peminjaman-saya/${result.data.id}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kendala saat mengirim pengajuan. Silakan coba kembali.";
      setGeneralError(msg);
      setIsSubmitting(false);
      setUploadStatus(null);
    }
  };

  const isFormValid =
    !isSubmitting &&
    borrowerName.trim().length >= 3 &&
    borrowerName.trim().length <= 100 &&
    borrowerNim.trim().length >= 5 &&
    borrowerNim.trim().length <= 25 &&
    /^[a-zA-Z0-9.\-]+$/.test(borrowerNim.trim()) &&
    Boolean(letterFile) &&
    purpose.trim().length >= 10 &&
    purpose.trim().length <= 200 &&
    durationHours > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <div
          className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-sm rounded-xl flex items-start gap-3 shadow-xs"
          role="alert"
        >
          <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Pengajuan Belum Berhasil Diproses</p>
            <p className="text-xs text-rose-800 leading-relaxed">{generalError}</p>
          </div>
        </div>
      )}

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Cards */}
        <div className="lg:col-span-8 space-y-6">
          {/* Notice Card */}
          <div className="academic-card p-4 bg-blue-50/60 border-blue-200/80 rounded-xl flex items-start gap-3">
            <InfoIcon className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed space-y-1">
              <p className="font-semibold text-blue-950">
                Penting: Pengajuan belum mengunci ruangan secara final.
              </p>
              <p className="text-blue-800">
                Status awal pengajuan adalah <strong className="text-blue-950 font-bold">Menunggu Persetujuan</strong>. Administrator operasional kampus akan memverifikasi kesesuaian identitas pemohon dan surat permohonan resmi sebelum menyetujui jadwal Anda.
              </p>
            </div>
          </div>

          {/* Section 1: Identitas Peminjam */}
          <div className="academic-card p-6 bg-white space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                1
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Identitas Akademik Peminjam
                </h2>
                <span className="text-xs text-slate-500">
                  Data resmi pemohon untuk dicocokkan dengan surat permohonan dan kartu mahasiswa.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div>
                <label htmlFor="borrower-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap Peminjam <span className="text-rose-500">*</span>
                </label>
                <input
                  id="borrower-name"
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda..."
                  required
                  minLength={3}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Otomatis dari profil Google. Dapat disesuaikan dengan identitas akademik resmi (3–100 karakter).
                </p>
                {fieldErrors.borrower_name && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.borrower_name[0]}</p>
                )}
              </div>

              {/* NIM */}
              <div>
                <label htmlFor="borrower-nim" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor Induk Mahasiswa (NIM) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="borrower-nim"
                  type="text"
                  value={borrowerNim}
                  onChange={(e) => setBorrowerNim(e.target.value)}
                  placeholder="Contoh: 24.01.53.0003"
                  required
                  minLength={5}
                  maxLength={25}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Wajib diisi (5–25 karakter). Mendukung angka, huruf, titik, dan strip.
                </p>
                {fieldErrors.borrower_nim && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.borrower_nim[0]}</p>
                )}
              </div>
            </div>

            {/* Read-only Google Email info */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
              <span className="text-slate-600">
                Email Akun Terhubung: <strong className="text-slate-900 font-mono">{profile.email}</strong>
              </span>
              <span className="text-[11px] text-slate-500 italic">
                (Otomatis terikat melalui Google OAuth, tidak dapat diubah)
              </span>
            </div>
          </div>

          {/* Section 2: Ruangan Terpilih */}
          <div className="academic-card p-6 bg-white space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Ruangan Terpilih
              </h2>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white border border-slate-200 text-slate-800">
                    {room.code}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{room.name}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Lokasi: {room.building}, {room.floor}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Kapasitas Maksimal
                </span>
                <span className="text-sm font-bold text-blue-700">
                  {room.capacity} orang
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Jadwal & Waktu */}
          <div className="academic-card p-6 bg-white space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Waktu Pelaksanaan & Peserta
              </h2>
            </div>

            {/* Tanggal */}
            <div>
              <label htmlFor="booking-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Penggunaan Ruangan <span className="text-rose-500">*</span>
              </label>
              <div className="relative max-w-sm">
                <input
                  id="booking-date"
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                Dapat diajukan mulai hari ini s.d. 30 hari ke depan ({minDate} s.d. {maxDate})
              </p>
              {fieldErrors.date && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.date[0]}</p>
              )}
            </div>

            {/* Jam Mulai & Jam Selesai */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label htmlFor="start-time" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jam Mulai (WIB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="start-time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  >
                    {operationalSlots.slice(0, -1).map((slot) => (
                      <option key={slot} value={slot}>
                        {slot.replace(":", ".")} WIB
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.start_time && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.start_time[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="end-time" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jam Selesai (WIB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="end-time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  >
                    {operationalSlots.slice(1).map((slot) => (
                      <option key={slot} value={slot}>
                        {slot.replace(":", ".")} WIB
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.end_time && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.end_time[0]}</p>
                )}
              </div>
            </div>

            {/* Duration alert if invalid */}
            {durationHours <= 0 ? (
              <p className="text-xs text-rose-600 font-medium">
                Jam selesai harus lebih akhir daripada jam mulai kegiatan.
              </p>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                <ClockIcon className="w-3.5 h-3.5 text-slate-500" />
                Durasi penggunaan: {durationHours} Jam
              </div>
            )}

            {/* Jumlah Peserta */}
            <div className="pt-2 border-t border-slate-100">
              <label htmlFor="participants" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jumlah Peserta Hadir <span className="text-rose-500">*</span>
              </label>
              <div className="relative max-w-xs">
                <input
                  id="participants"
                  type="number"
                  min={1}
                  max={room.capacity}
                  value={participantCount}
                  onChange={(e) => setParticipantCount(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                Maksimal kapasitas ruangan: {room.capacity} orang
              </p>
              {fieldErrors.participant_count && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.participant_count[0]}</p>
              )}
            </div>
          </div>

          {/* Section 4: Keperluan Agenda */}
          <div className="academic-card p-6 bg-white space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                4
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Keperluan & Agenda Kegiatan
              </h2>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="purpose" className="block text-xs font-semibold text-slate-700">
                  Deskripsi Keperluan <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-xs font-mono ${
                    purpose.trim().length >= 10 && purpose.trim().length <= 200
                      ? "text-slate-500"
                      : "text-amber-700 font-bold"
                  }`}
                >
                  {purpose.trim().length} / 200 karakter
                </span>
              </div>
              <textarea
                id="purpose"
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Tuliskan tujuan peminjaman secara jelas (contoh: Rapat koordinasi panitia seminar nasional Informatika)..."
                required
                maxLength={200}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Minimal 10 karakter. Berikan rincian yang informatif agar mempermudah evaluasi persetujuan admin.
              </p>
              {fieldErrors.purpose && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.purpose[0]}</p>
              )}
            </div>
          </div>

          {/* Section 5: Upload Surat Wajib PDF */}
          <div className="academic-card p-6 bg-white space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                5
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Surat Permohonan Peminjaman (PDF Wajib)
                </h2>
                <span className="text-xs text-slate-500">
                  Berkas tersimpan privat di Supabase Storage dan hanya dapat dibaca oleh Admin.
                </span>
              </div>
            </div>

            {!letterFile ? (
              <label
                htmlFor="letter-file"
                className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-all text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
                  <UploadCloudIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Klik untuk memilih surat permohonan
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Format berkas <strong className="text-slate-700">.PDF</strong> dengan ukuran maksimal 5 MB
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs group-hover:border-blue-300">
                  Pilih Dokumen PDF
                </span>
                <input
                  id="letter-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FilePdfIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {letterFile.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{(letterFile.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        Terverifikasi PDF
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isSubmitting}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors shrink-0"
                >
                  Ganti Berkas
                </button>
              </div>
            )}

            {letterError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{letterError}</span>
              </div>
            )}
            {fieldErrors.letter_path && (
              <p className="text-xs text-rose-600 font-medium">{fieldErrors.letter_path[0]}</p>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Summary & Action Card */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="academic-card p-6 bg-white space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Ringkasan Pengajuan
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 block">Pemohon</span>
                <span className="font-bold text-slate-900 text-sm">{borrowerName || "—"}</span>
                <span className="text-slate-600 font-mono block mt-0.5">
                  NIM: {borrowerNim || "Belum diisi"}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-slate-500 block">Ruangan</span>
                <span className="font-bold text-slate-900 text-sm">{room.name}</span>
                <span className="text-slate-600 block">{room.building}, {room.floor}</span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-slate-500 block">Tanggal Penggunaan</span>
                <span className="font-semibold text-slate-900">
                  {formatIndonesianDate(date)}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-slate-500 block">Waktu & Durasi</span>
                <span className="font-semibold text-slate-900">
                  {startTime.replace(":", ".")} - {endTime.replace(":", ".")} WIB
                </span>
                <span className="text-slate-500 block">
                  {durationHours > 0 ? `(${durationHours} jam penggunaan)` : "Waktu belum valid"}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-slate-500 block">Jumlah Peserta</span>
                <span className="font-semibold text-slate-900">
                  {participantCount} dari maks. {room.capacity} orang
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-slate-500 block">Surat Permohonan PDF</span>
                {letterFile ? (
                  <span className="font-semibold text-emerald-700 inline-flex items-center gap-1 mt-0.5">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Berkas siap dilampirkan
                  </span>
                ) : (
                  <span className="font-medium text-amber-700 inline-flex items-center gap-1 mt-0.5">
                    <AlertCircleIcon className="w-3.5 h-3.5" />
                    Belum ada berkas PDF
                  </span>
                )}
              </div>
            </div>

            {/* Upload status indicator */}
            {uploadStatus && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-lg flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                <span className="font-medium">{uploadStatus}</span>
              </div>
            )}

            {/* Submit CTA button */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={!isFormValid}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{uploadStatus || "Memproses..."}</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Pengajuan Peminjaman</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <Link
                href={`/ruangan/${room.id}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Batalkan dan Kembali
              </Link>
            </div>
          </div>

          <div className="academic-card p-4 bg-slate-50/70 border-slate-200/80 rounded-xl text-center space-y-1">
            <p className="text-xs text-slate-600">
              Butuh format baku surat peminjaman?
            </p>
            <Link
              href="/panduan"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline"
            >
              Baca Panduan Peminjaman →
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
