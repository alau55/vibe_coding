-- Vacation Rental System Database Schema
-- This file contains all table definitions and Row Level Security policies

-- ============================================
-- USER PROFILES TABLE
-- ============================================
-- Extends the auth.users table with additional profile information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- PROPERTIES TABLE
-- ============================================
-- Stores vacation rental property information
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  price_per_night NUMERIC(10, 2) NOT NULL CHECK (price_per_night > 0),
  amenities JSONB DEFAULT '[]'::JSONB,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  max_guests INTEGER NOT NULL CHECK (max_guests > 0),
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
  bathrooms NUMERIC(3, 1) NOT NULL CHECK (bathrooms >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
-- Anyone (including anonymous users) can view properties
CREATE POLICY "Properties are viewable by everyone"
  ON public.properties
  FOR SELECT
  USING (true);

-- Only authenticated users can insert properties (for admin/owner functionality)
CREATE POLICY "Authenticated users can insert properties"
  ON public.properties
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- RESERVATIONS TABLE
-- ============================================
-- Stores booking/reservation information
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure check-out is after check-in
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON public.reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

-- Enable Row Level Security
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reservations
-- Users can only view their own reservations
CREATE POLICY "Users can view own reservations"
  ON public.reservations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only authenticated users can create reservations
CREATE POLICY "Authenticated users can create reservations"
  ON public.reservations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Users can only update their own reservations
CREATE POLICY "Users can update own reservations"
  ON public.reservations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own reservations
CREATE POLICY "Users can delete own reservations"
  ON public.reservations
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTION: Check Property Availability
-- ============================================
-- Function to check if a property is available for given dates
-- Returns TRUE if the property is available, FALSE if there's a conflict
CREATE OR REPLACE FUNCTION check_property_availability(
  p_property_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for overlapping reservations (excluding cancelled ones)
  SELECT COUNT(*) INTO conflict_count
  FROM public.reservations
  WHERE property_id = p_property_id
    AND status != 'cancelled'
    AND (id != p_reservation_id OR p_reservation_id IS NULL)
    AND (
      -- New reservation overlaps with existing reservation
      (check_in_date <= p_check_in AND check_out_date > p_check_in) OR
      (check_in_date < p_check_out AND check_out_date >= p_check_out) OR
      (check_in_date >= p_check_in AND check_out_date <= p_check_out)
    );

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Get Property Booked Dates
-- ============================================
-- Returns all booked date ranges for a property
CREATE OR REPLACE FUNCTION get_property_booked_dates(p_property_id UUID)
RETURNS TABLE (
  reservation_id UUID,
  check_in DATE,
  check_out DATE,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    check_in_date,
    check_out_date,
    reservations.status
  FROM public.reservations
  WHERE property_id = p_property_id
    AND status != 'cancelled'
    AND check_out_date >= CURRENT_DATE
  ORDER BY check_in_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STORAGE BUCKET FOR PROPERTY IMAGES
-- ============================================
-- Note: This needs to be run in Supabase Dashboard or via SQL Editor
-- Create a public bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can view property images
CREATE POLICY "Property images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

-- Storage policy: Authenticated users can upload property images
CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- TRIGGER: Auto-create user profile on signup
-- ============================================
-- Automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information linked to auth.users';
COMMENT ON TABLE public.properties IS 'Vacation rental properties available for booking';
COMMENT ON TABLE public.reservations IS 'Booking reservations made by users';
COMMENT ON FUNCTION check_property_availability IS 'Checks if a property is available for booking during specified dates';
COMMENT ON FUNCTION get_property_booked_dates IS 'Returns all non-cancelled bookings for a property';
