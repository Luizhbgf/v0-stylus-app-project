-- Fix the check constraint to allow all client types correctly
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_client_type_check;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_client_type_check 
CHECK (
  (client_type = 'registered' AND client_id IS NOT NULL) OR
  (client_type = 'sporadic' AND sporadic_client_name IS NOT NULL AND sporadic_client_phone IS NOT NULL) OR
  (client_type = 'event' AND event_title IS NOT NULL)
);
