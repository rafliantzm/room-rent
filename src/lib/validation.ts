// Zod validation schemas for SPRK
// Compliant with PRD v1.2 §5, §7, §8, §9

import { z } from "zod";
import { getBookingDateBounds, wibToUTCISO } from "./dates";

// Room Schema for Admin (Create & Update)
export const roomFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Kode ruangan minimal 2 karakter")
    .max(30, "Kode ruangan maksimal 30 karakter")
    .regex(/^[A-Za-z0-9\-]+$/, "Kode ruangan hanya boleh berupa huruf, angka, dan tanda strip (-)")
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(3, "Nama ruangan minimal 3 karakter")
    .max(100, "Nama ruangan maksimal 100 karakter"),
  building: z
    .string()
    .trim()
    .min(2, "Nama gedung minimal 2 karakter")
    .max(100, "Nama gedung maksimal 100 karakter"),
  floor: z
    .string()
    .trim()
    .min(1, "Lantai minimal 1 karakter")
    .max(30, "Lantai maksimal 30 karakter"),
  capacity: z.coerce
    .number({ message: "Kapasitas harus berupa angka" })
    .int("Kapasitas harus berupa bilangan bulat")
    .min(1, "Kapasitas minimal 1 orang")
    .max(1000, "Kapasitas maksimal 1000 orang"),
  description: z
    .string()
    .trim()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
  image_path: z.string().nullable().optional(),
});

export type RoomFormInput = z.infer<typeof roomFormSchema>;

// Booking submission schema
export const bookingFormSchema = z
  .object({
    room_id: z.string().uuid("ID ruangan tidak valid"),
    borrower_name: z
      .string({ message: "Nama lengkap peminjam wajib diisi" })
      .trim()
      .min(3, "Nama lengkap minimal 3 karakter")
      .max(100, "Nama lengkap maksimal 100 karakter"),
    borrower_nim: z
      .string({ message: "NIM peminjam wajib diisi" })
      .trim()
      .min(5, "NIM minimal 5 karakter")
      .max(25, "NIM maksimal 25 karakter")
      .regex(/^[a-zA-Z0-9.\-]+$/, "NIM hanya boleh berisi huruf, angka, titik, dan tanda hubung (-)"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
    start_time: z
      .string()
      .regex(/^(0[7-9]|1\d|20):(00|30)$/, "Waktu mulai harus dalam jam 07.00 - 20.30 WIB kelipatan 30 menit"),
    end_time: z
      .string()
      .regex(/^(0[7-9]|1\d|20):(00|30)$|^21:00$/, "Waktu selesai harus dalam jam 07.30 - 21.00 WIB kelipatan 30 menit"),
    purpose: z
      .string()
      .trim()
      .min(10, "Keperluan peminjaman minimal 10 karakter")
      .max(200, "Keperluan peminjaman maksimal 200 karakter"),
    participant_count: z.coerce
      .number({ message: "Jumlah peserta harus berupa angka" })
      .int("Jumlah peserta harus bilangan bulat")
      .min(1, "Jumlah peserta minimal 1 orang"),
    request_key: z.string().uuid("Request key idempotensi tidak valid"),
    letter_path: z
      .string({ message: "Surat peminjaman wajib diunggah (PDF, maks. 5 MB)." })
      .trim()
      .min(1, "Surat peminjaman wajib diunggah (PDF, maks. 5 MB)."),
  })
  .superRefine((data, ctx) => {
    // 1. Check end_time > start_time
    const [startH, startM] = data.start_time.split(":").map(Number);
    const [endH, endM] = data.end_time.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Waktu selesai harus lebih lambat dari waktu mulai",
        path: ["end_time"],
      });
      return;
    }

    // 2. Check duration between 30 minutes and 4 hours (240 minutes)
    const duration = endMinutes - startMinutes;
    if (duration < 30) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Durasi peminjaman minimal 30 menit",
        path: ["end_time"],
      });
    }
    if (duration > 240) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Durasi peminjaman maksimal 4 jam",
        path: ["end_time"],
      });
    }

    // 3. Check date range (today to today + 30 days in WIB)
    const { minDate, maxDate } = getBookingDateBounds();
    if (data.date < minDate || data.date > maxDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Tanggal peminjaman harus antara hari ini (${minDate}) dan 30 hari ke depan (${maxDate})`,
        path: ["date"],
      });
    }

    // 4. Check that start time is at least 30 minutes in the future from now
    try {
      const startIso = wibToUTCISO(data.date, data.start_time);
      const startTimeMs = new Date(startIso).getTime();
      const minAllowedMs = Date.now() + 30 * 60 * 1000; // 30 minutes from now

      if (startTimeMs < minAllowedMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Waktu mulai harus minimal 30 menit dari waktu saat ini",
          path: ["start_time"],
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Waktu tidak valid",
        path: ["start_time"],
      });
    }
  });

export type BookingFormInput = z.infer<typeof bookingFormSchema>;

// Admin reject schema
export const rejectBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Alasan penolakan minimal 10 karakter")
    .max(300, "Alasan penolakan maksimal 300 karakter"),
});

// Admin cancel schema
export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Alasan pembatalan minimal 10 karakter")
    .max(300, "Alasan pembatalan maksimal 300 karakter"),
});

// --- File Validation Constants & Helpers (PRD v1.2) ---

export const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function validatePdfMetadata(file: { name: string; size: number; type?: string }): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: "Surat peminjaman wajib diunggah (PDF, maks. 5 MB)." };
  }

  if (file.size <= 0) {
    return { valid: false, error: "Berkas PDF kosong atau rusak." };
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran surat melebihi batas maksimal 5 MB (ukuran saat ini: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
  const isPdfMime = file.type ? file.type === "application/pdf" : true;

  if (!isPdfExt || !isPdfMime) {
    return { valid: false, error: "Format berkas harus berupa dokumen PDF (.pdf)." };
  }

  return { valid: true };
}

export function validatePdfBytes(bytes: Uint8Array): { valid: boolean; error?: string } {
  // Check %PDF- signature: 0x25, 0x50, 0x44, 0x46, 0x2D
  if (
    bytes.length < 5 ||
    bytes[0] !== 0x25 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x44 ||
    bytes[3] !== 0x46 ||
    bytes[4] !== 0x2d
  ) {
    return { valid: false, error: "Isi berkas bukan dokumen PDF yang valid." };
  }
  return { valid: true };
}

export function validateImageMetadata(file: { name: string; size: number; type?: string }): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: "Berkas foto wajib dipilih." };
  }

  if (file.size <= 0) {
    return { valid: false, error: "Berkas gambar kosong atau rusak." };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran foto melebihi batas maksimal 3 MB (ukuran saat ini: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  const lowerName = file.name.toLowerCase();
  const validExt =
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".webp");

  const validMime = file.type
    ? (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)
    : true;

  if (!validExt || !validMime) {
    return { valid: false, error: "Format gambar harus berupa JPEG, PNG, atau WebP." };
  }

  return { valid: true };
}

export function validateImageBytes(bytes: Uint8Array): { valid: boolean; error?: string } {
  if (bytes.length < 12) {
    return { valid: false, error: "Berkas gambar tidak valid atau rusak." };
  }

  // 1. JPEG check: FF D8 FF
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  // 2. PNG check: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  // 3. WebP check: RIFF at 0..3 and WEBP at 8..11
  const isRiff =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const isWebp =
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  if (!isJpeg && !isPng && !(isRiff && isWebp)) {
    return { valid: false, error: "Isi berkas bukan format gambar yang didukung (JPEG, PNG, WebP)." };
  }

  return { valid: true };
}
