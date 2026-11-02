import { createClient } from "@/lib/supabase/server";

export interface Room {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  description: string | null;
  is_active: boolean;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicScheduleSlot {
  start_at: string;
  end_at: string;
}

export async function listActiveRooms(search?: string): Promise<{ data: Room[]; error: string | null }> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("rooms")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},code.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data as Room[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat data ruangan.";
    return { data: [], error: msg };
  }
}

export async function getActiveRoomById(id: string): Promise<{ data: Room | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return { data: null, error: error?.message || "Ruangan tidak ditemukan atau tidak aktif." };
    }
    return { data: data as Room, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat detail ruangan.";
    return { data: null, error: msg };
  }
}

export async function getPublicRoomSchedule(
  roomId: string,
  dateStr: string
): Promise<{ data: PublicScheduleSlot[]; error: string | null }> {
  try {
    const supabase = await createClient();
    
    // Call the dedicated RPC function which strictly returns only (start_at, end_at)
    const { data, error } = await supabase.rpc("get_public_room_schedule", {
      p_room_id: roomId,
      p_date: dateStr,
    });

    if (error) {
      // Fallback query if RPC is not yet applied
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("bookings")
        .select("start_at, end_at")
        .eq("room_id", roomId)
        .eq("status", "approved")
        .order("start_at", { ascending: true });

      if (fallbackError) {
        return { data: [], error: fallbackError.message };
      }
      return { data: (fallbackData as PublicScheduleSlot[]) || [], error: null };
    }

    return { data: (data as PublicScheduleSlot[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat jadwal terpakai.";
    return { data: [], error: msg };
  }
}
