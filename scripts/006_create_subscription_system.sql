-- Create subscription plans table (plans created by staff/admin)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL, -- 'haircut', 'haircut_beard'
  frequency_per_week INTEGER NOT NULL, -- 1 or 2
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create payment methods table (credit cards)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_holder_name TEXT NOT NULL,
  card_last_four TEXT NOT NULL,
  card_brand TEXT NOT NULL, -- visa, mastercard, elo, etc
  expiry_month INTEGER NOT NULL,
  expiry_year INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update subscriptions table to link with plans and payment methods
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Enable Row Level Security
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can create own plans" ON public.subscription_plans
  FOR INSERT WITH CHECK (
    auth.uid() = staff_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 20
    )
  );

CREATE POLICY "Staff can update own plans" ON public.subscription_plans
  FOR UPDATE USING (
    auth.uid() = staff_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 20
    )
  );

CREATE POLICY "Admin can manage all plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 30
    )
  );

-- Payment methods policies
CREATE POLICY "Users can view own payment methods" ON public.payment_methods
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can create own payment methods" ON public.payment_methods
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own payment methods" ON public.payment_methods
  FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Users can delete own payment methods" ON public.payment_methods
  FOR DELETE USING (auth.uid() = client_id);

CREATE POLICY "Admin can view all payment methods" ON public.payment_methods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 30
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_staff ON public.subscription_plans(staff_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_client ON public.payment_methods(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_staff ON public.subscriptions(staff_id);
