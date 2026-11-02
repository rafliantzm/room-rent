import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { BookingWithRoom } from "@/features/bookings/queries";
import type { Room } from "@/features/rooms/queries";

export async function getAdminBookings(
  filterStatus?: string
): Promise<{ data: BookingWithRoom[]; error: string | null }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    let query = supabase
      .from("bookings")
      .select(`
        *,
        room:rooms(id, code, name, building, floor, capacity, image_path),
        user_profile:profiles!user_id(full_name, email)
      `);

    if (filterStatus && filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    // Default pending is ordered oldest first (created_at ASC) to prioritize backlog
    if (!filterStatus || filterStatus === "pending") {
      query = query.order("created_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as unknown as BookingWithRoom[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat antrean peminjaman admin.";
    return { data: [], error: msg };
  }
}

export async function getAdminBookingById(
  id: string
): Promise<{ data: BookingWithRoom | null; error: string | null }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        room:rooms(id, code, name, building, floor, capacity, image_path),
        user_profile:profiles!user_id(full_name, email)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return { data: null, error: error?.message || "Pengajuan tidak ditemukan." };
    }

    return { data: data as unknown as BookingWithRoom, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat detail pengajuan.";
    return { data: null, error: msg };
  }
}

export async function getAllRoomsAdmin(): Promise<{ data: Room[]; error: string | null }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as Room[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat daftar ruangan admin.";
    return { data: [], error: msg };
  }
}

export async function getRoomByIdAdmin(id: string): Promise<{ data: Room | null; error: string | null }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return { data: null, error: error?.message || "Ruangan tidak ditemukan." };
    }

    return { data: data as Room, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat detail ruangan.";
    return { data: null, error: msg };
  }
}

export async function getAdminSchedule(
  dateStr: string,
  roomId?: string
): Promise<{ data: BookingWithRoom[]; error: string | null }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    let query = supabase
      .from("bookings")
      .select(`
        *,
        room:rooms!inner(id, code, name, building, floor, capacity, image_path),
        user_profile:profiles!user_id(full_name, email)
      `)
      .eq("status", "approved");

    if (roomId && roomId !== "all") {
      query = query.eq("room_id", roomId);
    }

    // Filter by date matching in Asia/Jakarta timezone
    // Between start of day in UTC and end of day in UTC for that WIB date
    const startOfDayUTC = `${dateStr}T00:00:00+07:00`;
    const endOfDayUTC = `${dateStr}T23:59:59+07:00`;

    query = query
      .gte("start_at", new Date(startOfDayUTC).toISOString())
      .lte("start_at", new Date(endOfDayUTC).toISOString())
      .order("start_at", { ascending: true });

    const { data, error } = await query;
    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as unknown as BookingWithRoom[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat jadwal admin.";
    return { data: [], error: msg };
  }
}
