-- Enable Realtime for appointments table
-- This allows real-time updates when appointments are created, updated, or deleted

-- Add appointments table to the realtime publication
-- Using DO block to handle if table is already in publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, ignore error
      NULL;
  END;
END $$;

-- Note: For Realtime to work properly with RLS, make sure:
-- 1. RLS is enabled on the appointments table (already done)
-- 2. Users have appropriate SELECT policies (already configured)
-- 3. The Supabase client is authenticated with a valid user
