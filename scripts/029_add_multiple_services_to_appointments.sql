-- Add support for multiple services in appointments

-- Add a new column to store multiple service IDs
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS service_ids uuid[] DEFAULT ARRAY[]::uuid[];

-- Add a column to store individual service prices
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS service_prices jsonb DEFAULT '[]'::jsonb;

-- Update existing appointments to use the new array format
UPDATE public.appointments
SET service_ids = CASE 
  WHEN service_id IS NOT NULL THEN ARRAY[service_id]
  ELSE ARRAY[]::uuid[]
END,
service_prices = CASE 
  WHEN service_id IS NOT NULL THEN 
    jsonb_build_array(
      jsonb_build_object(
        'service_id', service_id,
        'price', COALESCE(custom_price, original_price, 0)
      )
    )
  ELSE '[]'::jsonb
END
WHERE service_ids IS NULL OR array_length(service_ids, 1) IS NULL;

-- Add comment to explain the structure
COMMENT ON COLUMN public.appointments.service_ids IS 'Array of service UUIDs for this appointment';
COMMENT ON COLUMN public.appointments.service_prices IS 'Array of objects: [{"service_id": "uuid", "price": 123.45}]';
