import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function isSafeRedirect(url: string | null): boolean {
  if (!url) return false;
  // Must start with a single slash and not double slash (protocol-relative)
  return url.startsWith("/") && !url.startsWith("//");
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const redirectTarget = isSafeRedirect(next) ? next : null;

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.user) {
        console.error("OAuth exchange code error:", error);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
      }

      // Check role in profiles to determine proper destination
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const userRole = profile?.role ?? "user";

      if (userRole === "admin") {
        // If an admin logged in and has an allowed admin redirect, honour it; otherwise send to admin dashboard
        if (redirectTarget && redirectTarget.startsWith("/admin")) {
          return NextResponse.redirect(`${origin}${redirectTarget}`);
        }
        return NextResponse.redirect(`${origin}/admin/peminjaman`);
      }

      // Normal user destination
      if (redirectTarget && !redirectTarget.startsWith("/admin")) {
        return NextResponse.redirect(`${origin}${redirectTarget}`);
      }
      return NextResponse.redirect(`${origin}/ruangan`);
    } catch (err) {
      console.error("Auth callback exception:", err);
      return NextResponse.redirect(`${origin}/login?error=server_error`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
