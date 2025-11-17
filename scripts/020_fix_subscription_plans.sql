-- Make service_type nullable in subscription_plans
ALTER TABLE subscription_plans 
ALTER COLUMN service_type DROP NOT NULL;

-- Add default value for better UX
ALTER TABLE subscription_plans 
ALTER COLUMN service_type SET DEFAULT 'general';
