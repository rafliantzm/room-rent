import { getCurrentProfile } from "@/lib/auth";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const profile = await getCurrentProfile();
  return <NavbarClient profile={profile} />;
}
