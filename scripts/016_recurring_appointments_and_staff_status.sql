-- Add recurring appointment fields to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'biweekly', 'twice_weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[], -- Days of week (0=Sunday, 6=Saturday)
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS parent_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Add staff status and working hours to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS staff_status TEXT DEFAULT 'active' CHECK (staff_status IN ('active', 'vacation', 'inactive')),
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "18:00", "enabled": true}, "tuesday": {"start": "09:00", "end": "18:00", "enabled": true}, "wednesday": {"start": "09:00", "end": "18:00", "enabled": true}, "thursday": {"start": "09:00", "end": "18:00", "enabled": true}, "friday": {"start": "09:00", "end": "18:00", "enabled": true}, "saturday": {"start": "09:00", "end": "14:00", "enabled": true}, "sunday": {"start": "09:00", "end": "14:00", "enabled": false}}'::jsonb;

-- Create index for recurring appointments
CREATE INDEX IF NOT EXISTS idx_appointments_recurring ON public.appointments(is_recurring, parent_appointment_id);
CREATE INDEX IF NOT EXISTS idx_profiles_staff_status ON public.profiles(staff_status) WHERE user_level >= 20;

-- Removendo políticas antigas antes de criar novas (PostgreSQL não suporta IF NOT EXISTS em CREATE POLICY)
DROP POLICY IF EXISTS "Staff can update own status" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update staff status" ON public.profiles;

-- Update RLS policies to allow staff to manage their own status
CREATE POLICY "Staff can update own status"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id AND user_level >= 20)
WITH CHECK (auth.uid() = id AND user_level >= 20);

-- Allow admin to update any staff status
CREATE POLICY "Admin can update staff status"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_level >= 30
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_level >= 30
  )
);
