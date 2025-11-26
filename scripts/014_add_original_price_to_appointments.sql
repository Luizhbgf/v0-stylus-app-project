-- Add original_price field to track price changes in appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- Update existing records to set original_price from service price
UPDATE appointments a
SET original_price = s.price
FROM services s
WHERE a.service_id = s.id
AND a.original_price IS NULL;
