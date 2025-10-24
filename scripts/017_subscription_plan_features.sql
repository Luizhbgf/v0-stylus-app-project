-- Add features system to subscription plans
-- Features can be included (✓) or not included (❌) in each plan

-- Create table for plan features
CREATE TABLE IF NOT EXISTS public.subscription_plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE CASCADE NOT NULL,
  feature_text TEXT NOT NULL,
  is_included BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscription_plan_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plan_features
DROP POLICY IF EXISTS "Anyone can view plan features" ON public.subscription_plan_features;
CREATE POLICY "Anyone can view plan features"
  ON public.subscription_plan_features FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff can manage own plan features" ON public.subscription_plan_features;
CREATE POLICY "Staff can manage own plan features"
  ON public.subscription_plan_features FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.subscription_plans sp
      WHERE sp.id = subscription_plan_features.plan_id
      AND sp.staff_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin can manage all plan features" ON public.subscription_plan_features;
CREATE POLICY "Admin can manage all plan features"
  ON public.subscription_plan_features FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_level >= 30
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON public.subscription_plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_order ON public.subscription_plan_features(plan_id, display_order);
