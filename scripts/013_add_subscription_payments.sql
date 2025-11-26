-- Create subscription_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT DEFAULT 'pix',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  pix_copy_paste TEXT,
  pix_txid TEXT,
  pix_key TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own subscription payments"
  ON subscription_payments
  FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE client_id = auth.uid()
    )
  );

-- Staff can manage payments for their subscriptions
CREATE POLICY "Staff can manage subscription payments"
  ON subscription_payments
  FOR ALL
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE staff_id = auth.uid()
    )
  );

-- Admin can manage all payments
CREATE POLICY "Admin can manage all subscription payments"
  ON subscription_payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_level >= 100
    )
  );

-- Add staff PIX key to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pix_key TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(payment_status);
