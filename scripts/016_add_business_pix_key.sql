-- Add PIX key configuration to homepage_settings
ALTER TABLE homepage_settings 
ADD COLUMN IF NOT EXISTS business_pix_key TEXT;

-- Add comment
COMMENT ON COLUMN homepage_settings.business_pix_key IS 'Chave PIX do estabelecimento (email, telefone, CPF/CNPJ ou chave aleatória)';
