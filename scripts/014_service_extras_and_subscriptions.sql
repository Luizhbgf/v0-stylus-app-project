-- Create service extras table
CREATE TABLE IF NOT EXISTS public.service_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add terms and observations to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Add email and phone verification fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pending_email TEXT,
ADD COLUMN IF NOT EXISTS pending_phone TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Enable RLS
ALTER TABLE public.service_extras ENABLE ROW LEVEL SECURITY;

-- Service extras policies
CREATE POLICY "Anyone can view active service extras" 
ON public.service_extras FOR SELECT
USING (is_active = true);

CREATE POLICY "Staff can manage their service extras" 
ON public.service_extras FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.staff_services ss
    WHERE ss.service_id = service_extras.service_id
    AND ss.staff_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level >= 30
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_extras_service ON public.service_extras(service_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_staff ON public.subscription_plans(staff_id);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);

-- Update subscription_plans RLS to make them staff-specific
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;

CREATE POLICY "Anyone can view active subscription plans" 
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Staff can manage their own subscription plans" 
ON public.subscription_plans FOR ALL
USING (
  staff_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level >= 30
  )
);
