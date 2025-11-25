-- Adiciona coluna custom_price para armazenar preços específicos por agendamento
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS custom_price NUMERIC;

-- Comentário explicativo
COMMENT ON COLUMN appointments.custom_price IS 'Preço customizado para este agendamento específico. Se NULL, usa o preço do serviço.';
