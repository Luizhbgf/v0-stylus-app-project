-- Create feedback table for client reviews
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  service_quality INTEGER CHECK (service_quality >= 1 AND service_quality <= 5),
  punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5),
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
  would_recommend BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(appointment_id)
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "Clients can create feedback for own appointments" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Everyone can view feedback" ON public.feedback
  FOR SELECT USING (true);

CREATE POLICY "Staff and admin can view all feedback" ON public.feedback
  FOR SELECT USING (
    auth.uid() = staff_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 20
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_staff_id ON public.feedback(staff_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
-- Fixed column name from payment_date to paid_at to match payments table schema
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_staff_earnings_date ON public.staff_earnings(payment_date);
