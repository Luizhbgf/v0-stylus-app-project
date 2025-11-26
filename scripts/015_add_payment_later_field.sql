-- Add field to track if appointment is marked as "pay later"
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS pay_later boolean DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS original_price numeric;

-- Update RLS policies if needed
-- Payments table already exists, just ensure it's properly configured
