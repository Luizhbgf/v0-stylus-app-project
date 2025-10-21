-- Allow appointments without a client (for walk-ins, blocked time, events)
ALTER TABLE public.appointments 
ALTER COLUMN client_id DROP NOT NULL;

-- Add event_title column for appointments without clients
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS event_title text;

-- Update RLS policy for staff to create appointments without clients
DROP POLICY IF EXISTS "Staff can create appointments" ON public.appointments;

CREATE POLICY "Staff can create appointments" ON public.appointments
FOR INSERT
WITH CHECK (
  auth.uid() = staff_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_level >= 20
  )
);

-- Update the client insert policy to handle null client_id
DROP POLICY IF EXISTS "Clients can create appointments" ON public.appointments;

CREATE POLICY "Clients can create appointments" ON public.appointments
FOR INSERT
WITH CHECK (
  auth.uid() = client_id 
  OR (client_id IS NULL AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_level >= 20
  ))
);
