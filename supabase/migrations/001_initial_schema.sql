-- Migration 001: Initial Schema for SPRK (Sistem Peminjaman Ruangan Kampus)
-- Compliant with PRD v1.1

CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to sync new user from auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name text;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Pengguna Kampus'
  );

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, v_full_name, NEW.email, 'user')
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      updated_at = now();
  -- NOTE: role is strictly preserved and NEVER updated from auth metadata

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Table: rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  building text NOT NULL,
  floor text NOT NULL,
  capacity integer NOT NULL CHECK (capacity >= 1 AND capacity <= 1000),
  description text NULL CHECK (description IS NULL OR char_length(description) <= 500),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rooms_name_length CHECK (char_length(trim(name)) >= 3 AND char_length(trim(name)) <= 100),
  CONSTRAINT rooms_building_length CHECK (char_length(trim(building)) >= 2 AND char_length(trim(building)) <= 100),
  CONSTRAINT rooms_floor_length CHECK (char_length(trim(floor)) >= 1 AND char_length(trim(floor)) <= 30),
  CONSTRAINT rooms_code_length CHECK (char_length(trim(code)) >= 2 AND char_length(trim(code)) <= 30)
);

CREATE UNIQUE INDEX IF NOT EXISTS rooms_code_upper_idx ON public.rooms (upper(trim(code)));

DROP TRIGGER IF EXISTS set_rooms_updated_at ON public.rooms;
CREATE TRIGGER set_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Table: bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  request_key uuid NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  purpose text NOT NULL,
  participant_count integer NOT NULL CHECK (participant_count >= 1),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz NULL,
  review_note text NULL,
  cancelled_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancelled_at timestamptz NULL,
  cancellation_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_end_after_start CHECK (end_at > start_at),
  CONSTRAINT bookings_user_request_key_key UNIQUE (user_id, request_key),
  CONSTRAINT bookings_purpose_length CHECK (char_length(trim(purpose)) >= 10 AND char_length(trim(purpose)) <= 200)
);

DROP TRIGGER IF EXISTS set_bookings_updated_at ON public.bookings;
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Exclusion constraint for approved bookings (prevents double booking)
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_approved_overlap;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_approved_overlap
  EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (status = 'approved');

-- 6. Indexes for query performance
CREATE INDEX IF NOT EXISTS bookings_user_id_created_at_idx ON public.bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_status_created_at_idx ON public.bookings (status, created_at ASC);
CREATE INDEX IF NOT EXISTS bookings_room_id_start_at_idx ON public.bookings (room_id, start_at);
