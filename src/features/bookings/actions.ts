"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { bookingFormSchema, type BookingFormInput } from "@/lib/validation";
import { wibToUTCISO } from "@/lib/dates";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createBookingAction(input: BookingFormInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();

    // 1. Validate input on the server
    const parsed = bookingFormSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || "Data pengajuan tidak valid.";
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const validData = parsed.data;
    const startIso = wibToUTCISO(validData.date, validData.start_time);
    const endIso = wibToUTCISO(validData.date, validData.end_time);

    const supabase = await createClient();

    // 2. Call the atomic PostgreSQL RPC function with mandatory letter_path and borrower identity
    const { data: newBooking, error } = await supabase.rpc("create_booking", {
      p_room_id: validData.room_id,
      p_start_at: startIso,
      p_end_at: endIso,
      p_purpose: validData.purpose,
      p_participant_count: validData.participant_count,
      p_request_key: validData.request_key,
      p_letter_path: validData.letter_path,
      p_borrower_name: validData.borrower_name,
      p_borrower_nim: validData.borrower_nim,
    });

    if (error) {
      // Map error to human-friendly Indonesian text per PRD
      if (error.message.includes("Jadwal sudah digunakan") || error.code === "23P01") {
        return { success: false, error: "Jadwal sudah digunakan. Pilih waktu lain." };
      }
      if (error.message.includes("Ruangan tidak tersedia") || error.message.includes("tidak aktif")) {
        return { success: false, error: "Ruangan tidak tersedia atau sedang dinonaktifkan." };
      }
      if (error.message.includes("Surat peminjaman wajib") || error.message.includes("belum terunggah")) {
        return { success: false, error: "Surat peminjaman wajib diunggah (PDF, maks. 5 MB)." };
      }
      if (error.message.includes("Path surat")) {
        return { success: false, error: "Berkas surat tidak valid atau bukan milik akun Anda." };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/peminjaman-saya");
    revalidatePath(`/ruangan/${validData.room_id}`);

    return { success: true, data: { id: newBooking.id } };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan pada server saat memproses pengajuan.";
    return {
      success: false,
      error: msg,
    };
  }
}

export async function cancelOwnBookingAction(bookingId: string): Promise<ActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();

    const { data: updatedBooking, error } = await supabase.rpc("cancel_own_booking", {
      p_booking_id: bookingId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/peminjaman-saya");
    revalidatePath(`/peminjaman-saya/${bookingId}`);
    if (updatedBooking?.room_id) {
      revalidatePath(`/ruangan/${updatedBooking.room_id}`);
    }

    return { success: true, data: updatedBooking };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : "Gagal membatalkan peminjaman.";
    return {
      success: false,
      error: msg,
    };
  }
}

// 3. Get short-lived signed URL for booking letter (User or Admin, max 60 seconds)
export async function getBookingLetterSignedUrlAction(
  bookingId: string
): Promise<ActionResult<{ signedUrl: string }>> {
  try {
    const { user, profile } = await requireUser();
    const supabase = await createClient();

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, user_id, letter_path")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return { success: false, error: "Data peminjaman tidak ditemukan." };
    }

    // Role check: must be owner or admin
    const isOwner = booking.user_id === user.id;
    const isAdmin = profile.role === "admin";

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: "Akses ditolak: Anda tidak memiliki izin untuk melihat dokumen ini.",
      };
    }

    if (!booking.letter_path) {
      return {
        success: false,
        error: "Surat peminjaman belum tersedia untuk pengajuan ini.",
      };
    }

    // PRD v1.2: Generate signed URL with maximum 60 seconds lifetime
    const { data: signedData, error: signError } = await supabase.storage
      .from("booking-letters")
      .createSignedUrl(booking.letter_path, 60);

    if (signError || !signedData?.signedUrl) {
      return {
        success: false,
        error: signError?.message || "Gagal membuat tautan akses berkas surat.",
      };
    }

    return { success: true, data: { signedUrl: signedData.signedUrl } };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : "Gagal mengakses surat peminjaman.";
    return { success: false, error: msg };
  }
}
