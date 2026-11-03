import { createClient } from "@/lib/supabase/server";

export interface BookingWithRoom {
  id: string;
  user_id: string;
  room_id: string;
  request_key: string;
  letter_path: string | null;
  borrower_name?: string | null;
  borrower_nim?: string | null;
  start_at: string;
  end_at: string;
  purpose: string;
  participant_count: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  room?: {
    id: string;
    code: string;
    name: string;
    building: string;
    floor: string;
    capacity: number;
    image_path?: string | null;
  };
  user_profile?: {
    full_name: string;
    email: string;
  };
}

export async function getMyBookings(): Promise<{ data: BookingWithRoom[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], error: "Tidak terautentikasi." };
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        room:rooms(id, code, name, building, floor, capacity, image_path)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as unknown as BookingWithRoom[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat daftar peminjaman.";
    return { data: [], error: msg };
  }
}

export async function getMyBookingById(id: string): Promise<{ data: BookingWithRoom | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Tidak terautentikasi." };
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        room:rooms(id, code, name, building, floor, capacity, image_path)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return { data: null, error: error?.message || "Peminjaman tidak ditemukan." };
    }

    return { data: data as unknown as BookingWithRoom, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat detail peminjaman.";
    return { data: null, error: msg };
  }
}
