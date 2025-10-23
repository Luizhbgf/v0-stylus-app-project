-- Add staff working hours and status
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '18:00:00',
ADD COLUMN IF NOT EXISTS work_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 0=Sunday, 6=Saturday
ADD COLUMN IF NOT EXISTS staff_status TEXT DEFAULT 'active' CHECK (staff_status IN ('active', 'vacation', 'inactive'));

-- Add recurring appointments support
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'biweekly', 'twice_weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[], -- Days of week for twice_weekly
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE;

-- Create index for recurring appointments
CREATE INDEX IF NOT EXISTS idx_appointments_recurring ON public.appointments(is_recurring, recurrence_end_date) WHERE is_recurring = TRUE;

-- Create index for staff status
CREATE INDEX IF NOT EXISTS idx_profiles_staff_status ON public.profiles(staff_status) WHERE user_level >= 20;
