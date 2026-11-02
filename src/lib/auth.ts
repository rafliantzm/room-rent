import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export type UserRole = "user" | "admin";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      // Return a basic profile representation from user metadata if database sync is pending
      return {
        id: user.id,
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Pengguna Kampus",
        email: user.email || "",
        role: "user",
        created_at: user.created_at,
        updated_at: user.created_at,
      };
    }

    return profile as UserProfile;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<{ user: User; profile: UserProfile }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login?error=profile_not_found");
  }

  return { user, profile };
}

export async function requireAdmin(): Promise<{ user: User; profile: UserProfile }> {
  const { user, profile } = await requireUser();
  if (profile.role !== "admin") {
    redirect("/ruangan?error=unauthorized_admin");
  }
  return { user, profile };
}
