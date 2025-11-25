-- Criar tabela de configurações da homepage
CREATE TABLE IF NOT EXISTS homepage_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title TEXT DEFAULT 'Sua Beleza, Nossa Paixão',
  hero_subtitle TEXT DEFAULT 'Agende seus serviços de estética e beleza de forma rápida e prática',
  featured_services TEXT[] DEFAULT ARRAY[]::TEXT[],
  featured_testimonials JSONB DEFAULT '[]'::JSONB,
  featured_courses TEXT[] DEFAULT ARRAY[]::TEXT[],
  featured_plans TEXT[] DEFAULT ARRAY[]::TEXT[],
  cta_title TEXT DEFAULT 'Pronta Para Se Sentir Incrível?',
  cta_subtitle TEXT DEFAULT 'Entre em contato com nossos profissionais',
  business_name TEXT DEFAULT 'Styllus Estética e Beleza',
  business_phone TEXT DEFAULT '(11) 9999-9999',
  business_email TEXT DEFAULT 'contato@styllus.com.br',
  business_hours TEXT DEFAULT 'Seg - Sex: 9h às 19h, Sáb: 9h às 17h',
  show_testimonials BOOLEAN DEFAULT true,
  show_services BOOLEAN DEFAULT true,
  show_courses BOOLEAN DEFAULT false,
  show_plans BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);

-- Inserir configuração padrão
INSERT INTO homepage_settings (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar configurações da homepage"
ON homepage_settings FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Apenas admins podem atualizar configurações"
ON homepage_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level >= 30
  )
);
