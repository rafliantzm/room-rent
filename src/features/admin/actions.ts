"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import {
  roomFormSchema,
  rejectBookingSchema,
  cancelBookingSchema,
  type RoomFormInput,
} from "@/lib/validation";
import { revalidatePath } from "next/cache";

export type AdminActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// 1. Approve booking
export async function approveBookingAction(bookingId: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: approvedBooking, error } = await supabase.rpc("approve_booking", {
      p_booking_id: bookingId,
    });

    if (error) {
      if (error.message.includes("bentrok") || error.code === "23P01") {
        return {
          success: false,
          error: "Jadwal bentrok dengan peminjaman lain yang telah disetujui. Persetujuan ditolak demi mencegah pemesanan ganda.",
        };
      }
      if (error.message.includes("Surat peminjaman") || error.message.includes("surat")) {
        return {
          success: false,
          error: "Persetujuan ditolak: Surat peminjaman belum tersedia atau tidak ditemukan pada penyimpanan.",
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/peminjaman");
    revalidatePath(`/admin/peminjaman/${bookingId}`);
    revalidatePath("/admin/jadwal");
    revalidatePath("/peminjaman-saya");
    if (approvedBooking?.room_id) {
      revalidatePath(`/ruangan/${approvedBooking.room_id}`);
    }

    return { success: true, data: approvedBooking };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyetujui peminjaman.";
    return {
      success: false,
      error: msg,
    };
  }
}

// 2. Reject booking
export async function rejectBookingAction(
  bookingId: string,
  reason: string
): Promise<AdminActionResult> {
  try {
    await requireAdmin();

    const parsed = rejectBookingSchema.safeParse({ reason });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Alasan penolakan tidak valid.",
      };
    }

    const supabase = await createClient();
    const { data: rejectedBooking, error } = await supabase.rpc("reject_booking", {
      p_booking_id: bookingId,
      p_reason: parsed.data.reason,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/peminjaman");
    revalidatePath(`/admin/peminjaman/${bookingId}`);
    revalidatePath("/peminjaman-saya");

    return { success: true, data: rejectedBooking };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menolak peminjaman.";
    return {
      success: false,
      error: msg,
    };
  }
}

// 3. Cancel approved booking by admin
export async function cancelApprovedBookingAction(
  bookingId: string,
  reason: string
): Promise<AdminActionResult> {
  try {
    await requireAdmin();

    const parsed = cancelBookingSchema.safeParse({ reason });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Alasan pembatalan tidak valid.",
      };
    }

    const supabase = await createClient();
    const { data: cancelledBooking, error } = await supabase.rpc("cancel_approved_booking", {
      p_booking_id: bookingId,
      p_reason: parsed.data.reason,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/peminjaman");
    revalidatePath(`/admin/peminjaman/${bookingId}`);
    revalidatePath("/admin/jadwal");
    revalidatePath("/peminjaman-saya");
    if (cancelledBooking?.room_id) {
      revalidatePath(`/ruangan/${cancelledBooking.room_id}`);
    }

    return { success: true, data: cancelledBooking };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat membatalkan peminjaman.";
    return {
      success: false,
      error: msg,
    };
  }
}

// 4. Create room
export async function createRoomAction(input: RoomFormInput): Promise<AdminActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const parsed = roomFormSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage = Object.values(fieldErrors).flat()[0] || "Data ruangan tidak valid.";
      return { success: false, error: firstErrorMessage, fieldErrors };
    }

    const supabase = await createClient();

    // Check if code already exists case-insensitively
    const { data: existing } = await supabase
      .from("rooms")
      .select("id")
      .ilike("code", parsed.data.code)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: `Kode ruangan "${parsed.data.code}" sudah digunakan. Gunakan kode lain.`,
        fieldErrors: { code: ["Kode ruangan sudah terdaftar"] },
      };
    }

    const { data: newRoom, error } = await supabase
      .from("rooms")
      .insert({
        code: parsed.data.code,
        name: parsed.data.name,
        building: parsed.data.building,
        floor: parsed.data.floor,
        capacity: parsed.data.capacity,
        description: parsed.data.description || null,
        is_active: parsed.data.is_active,
        image_path: parsed.data.image_path || null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/ruangan");
    revalidatePath("/admin/ruangan");

    return { success: true, data: { id: newRoom.id } };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Gagal menambahkan ruangan.";
    return {
      success: false,
      error: msg,
    };
  }
}

// 5. Update room
export async function updateRoomAction(
  roomId: string,
  input: RoomFormInput
): Promise<AdminActionResult> {
  try {
    await requireAdmin();

    const parsed = roomFormSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage = Object.values(fieldErrors).flat()[0] || "Data ruangan tidak valid.";
      return { success: false, error: firstErrorMessage, fieldErrors };
    }

    const supabase = await createClient();

    // PRD FR-08: Jangan izinkan penurunan kapasitas di bawah jumlah peserta pada booking approved yang belum berakhir
    const { data: maxUpcoming } = await supabase
      .from("bookings")
      .select("participant_count")
      .eq("room_id", roomId)
      .eq("status", "approved")
      .gt("end_at", new Date().toISOString())
      .order("participant_count", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxUpcoming && parsed.data.capacity < maxUpcoming.participant_count) {
      return {
        success: false,
        error: `Kapasitas tidak dapat diturunkan menjadi ${parsed.data.capacity} karena terdapat peminjaman disetujui mendatang dengan ${maxUpcoming.participant_count} peserta.`,
      };
    }

    // Check code uniqueness excluding current room
    const { data: existingCode } = await supabase
      .from("rooms")
      .select("id")
      .ilike("code", parsed.data.code)
      .neq("id", roomId)
      .maybeSingle();

    if (existingCode) {
      return {
        success: false,
        error: `Kode ruangan "${parsed.data.code}" sudah digunakan oleh ruangan lain.`,
      };
    }

    // Fetch current room to check if image_path is changing
    const { data: currentRoom } = await supabase
      .from("rooms")
      .select("image_path")
      .eq("id", roomId)
      .single();

    const newImagePath = parsed.data.image_path || null;

    const { error } = await supabase
      .from("rooms")
      .update({
        code: parsed.data.code,
        name: parsed.data.name,
        building: parsed.data.building,
        floor: parsed.data.floor,
        capacity: parsed.data.capacity,
        description: parsed.data.description || null,
        is_active: parsed.data.is_active,
        image_path: newImagePath,
      })
      .eq("id", roomId);

    if (error) {
      return { success: false, error: error.message };
    }

    // If image_path was replaced with a new one or removed, clean up old file from storage
    if (currentRoom?.image_path && currentRoom.image_path !== newImagePath) {
      await supabase.storage.from("room-images").remove([currentRoom.image_path]);
    }

    revalidatePath("/ruangan");
    revalidatePath(`/ruangan/${roomId}`);
    revalidatePath("/admin/ruangan");
    revalidatePath(`/admin/ruangan/${roomId}/edit`);

    return { success: true, data: { id: roomId } };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Gagal memperbarui data ruangan.";
    return {
      success: false,
      error: msg,
    };
  }
}

// 6. Toggle room active status
export async function toggleRoomActiveAction(
  roomId: string,
  isActive: boolean
): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("rooms")
      .update({ is_active: isActive })
      .eq("id", roomId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/ruangan");
    revalidatePath(`/ruangan/${roomId}`);
    revalidatePath("/admin/ruangan");

    return { success: true, data: { isActive } };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Gagal mengubah status aktif ruangan.";
    return {
      success: false,
      error: msg,
    };
  }
}

// 7. Delete room image explicitly
export async function deleteRoomImageAction(roomId: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: room, error: fetchError } = await supabase
      .from("rooms")
      .select("image_path")
      .eq("id", roomId)
      .single();

    if (fetchError || !room) {
      return { success: false, error: "Ruangan tidak ditemukan." };
    }

    if (room.image_path) {
      await supabase.storage.from("room-images").remove([room.image_path]);
    }

    const { error: updateError } = await supabase
      .from("rooms")
      .update({ image_path: null })
      .eq("id", roomId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/ruangan");
    revalidatePath(`/ruangan/${roomId}`);
    revalidatePath("/admin/ruangan");
    revalidatePath(`/admin/ruangan/${roomId}/edit`);

    return { success: true, data: { id: roomId } };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) throw err;
    const msg = err instanceof Error ? err.message : "Gagal menghapus foto ruangan.";
    return { success: false, error: msg };
  }
}
