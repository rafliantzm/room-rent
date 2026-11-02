import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", `/api/booking-letters/${bookingId}`);
      return NextResponse.redirect(loginUrl, 307);
    }

    // 2. Fetch booking record
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, letter_path")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new NextResponse("Pengajuan peminjaman tidak ditemukan.", { status: 404 });
    }

    if (!booking.letter_path) {
      return new NextResponse("Surat peminjaman belum tersedia untuk pengajuan ini.", { status: 404 });
    }

    // 3. Check authorization: owner or admin
    let isAuthorized = booking.user_id === user.id;

    if (!isAuthorized) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new NextResponse("Akses ditolak: Anda tidak memiliki wewenang untuk melihat surat ini.", {
        status: 403,
      });
    }

    // 4. Generate short-lived signed URL (max 60 seconds per PRD v1.2 §9.5)
    const { data: signedData, error: signError } = await supabase.storage
      .from("booking-letters")
      .createSignedUrl(booking.letter_path, 60);

    if (signError || !signedData?.signedUrl) {
      return new NextResponse("Gagal menghasilkan tautan akses berkas surat.", { status: 500 });
    }

    // 5. Redirect browser directly to the signed URL
    return NextResponse.redirect(signedData.signedUrl, 307);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kendala saat mengakses surat.";
    return new NextResponse(msg, { status: 500 });
  }
}
