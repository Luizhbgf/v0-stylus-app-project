-- Enable Realtime for appointments table
-- This allows real-time updates when appointments are created, updated, or deleted

-- First, drop if already exists to avoid conflicts
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS appointments;

-- Add appointments table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Note: For Realtime to work properly with RLS, make sure:
-- 1. RLS is enabled on the appointments table (already done)
-- 2. Users have appropriate SELECT policies (already configured)
-- 3. The Supabase client is authenticated with a valid user
