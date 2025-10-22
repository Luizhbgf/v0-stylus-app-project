-- Reescrevendo script para usar staff_id consistentemente
-- Add new columns to appointments table for enhanced functionality
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'registered', -- registered, sporadic
ADD COLUMN IF NOT EXISTS sporadic_client_name TEXT,
ADD COLUMN IF NOT EXISTS sporadic_client_phone TEXT,
ADD COLUMN IF NOT EXISTS event_title TEXT,
ADD COLUMN IF NOT EXISTS is_client_request BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS request_status TEXT DEFAULT 'approved'; -- pending, approved, rejected

-- Add payment status tracking
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'; -- pending, paid, overdue

-- Create appointment requests table for client requests
CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  requested_date TIMESTAMP WITH TIME ZONE NOT NULL,
  alternative_dates JSONB, -- Array of alternative dates
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, modified
  notes TEXT,
  staff_notes TEXT, -- Notes from staff when modifying
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- Appointment requests policies
CREATE POLICY "Users can view own appointment requests" ON public.appointment_requests
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = staff_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 20
    )
  );

CREATE POLICY "Clients can create appointment requests" ON public.appointment_requests
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Staff can manage appointment requests" ON public.appointment_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 20
    )
  );

-- Update appointments policies to allow staff to create appointments
DROP POLICY IF EXISTS "Clients can create appointments" ON public.appointments;

CREATE POLICY "Users can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    auth.uid() = client_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 20
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_client_type ON public.appointments(client_type);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON public.appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_staff ON public.appointment_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_client ON public.appointment_requests(client_id);
