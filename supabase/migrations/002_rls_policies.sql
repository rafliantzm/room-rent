-- Migration 002: Row Level Security (RLS) Policies
-- Compliant with PRD v1.1

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Helper function: check if authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Policies for profiles
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- No direct client INSERT/UPDATE/DELETE on profiles
DROP POLICY IF EXISTS "profiles_no_client_insert" ON public.profiles;
CREATE POLICY "profiles_no_client_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "profiles_no_client_update" ON public.profiles;
CREATE POLICY "profiles_no_client_update" ON public.profiles
  FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS "profiles_no_client_delete" ON public.profiles;
CREATE POLICY "profiles_no_client_delete" ON public.profiles
  FOR DELETE TO authenticated USING (false);

-- Policies for rooms
DROP POLICY IF EXISTS "rooms_select_public_active_or_admin" ON public.rooms;
CREATE POLICY "rooms_select_public_active_or_admin" ON public.rooms
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "rooms_admin_insert" ON public.rooms;
CREATE POLICY "rooms_admin_insert" ON public.rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "rooms_admin_update" ON public.rooms;
CREATE POLICY "rooms_admin_update" ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "rooms_no_delete" ON public.rooms;
CREATE POLICY "rooms_no_delete" ON public.rooms
  FOR DELETE
  TO anon, authenticated
  USING (false);

-- Policies for bookings
-- User can only see their own bookings; Admin can see all bookings
DROP POLICY IF EXISTS "bookings_select_own_or_admin" ON public.bookings;
CREATE POLICY "bookings_select_own_or_admin" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Direct client INSERT/UPDATE/DELETE on bookings is completely denied;
-- all operations must be executed via controlled atomic RPC functions.
DROP POLICY IF EXISTS "bookings_deny_direct_insert" ON public.bookings;
CREATE POLICY "bookings_deny_direct_insert" ON public.bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "bookings_deny_direct_update" ON public.bookings;
CREATE POLICY "bookings_deny_direct_update" ON public.bookings
  FOR UPDATE
  TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "bookings_deny_direct_delete" ON public.bookings;
CREATE POLICY "bookings_deny_direct_delete" ON public.bookings
  FOR DELETE
  TO anon, authenticated
  USING (false);
