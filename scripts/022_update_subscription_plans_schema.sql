-- Adicionando campos para periodicidade do plano e quantidade de cortes
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS billing_frequency text CHECK (billing_frequency IN ('weekly', 'biweekly', 'monthly')) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS service_frequency text CHECK (service_frequency IN ('weekly', 'biweekly', 'monthly')),
ADD COLUMN IF NOT EXISTS services_per_period integer DEFAULT 1,
ALTER COLUMN frequency_per_week DROP NOT NULL,
ALTER COLUMN frequency_per_week SET DEFAULT 0;

-- Atualizar registros existentes
UPDATE subscription_plans
SET frequency_per_week = 0
WHERE frequency_per_week IS NULL;

COMMENT ON COLUMN subscription_plans.billing_frequency IS 'Frequência de cobrança do plano: semanal, quinzenal ou mensal';
COMMENT ON COLUMN subscription_plans.service_frequency IS 'Frequência de serviços incluídos: semanal, quinzenal ou mensal';
COMMENT ON COLUMN subscription_plans.services_per_period IS 'Quantidade de cortes/serviços incluídos por período';
