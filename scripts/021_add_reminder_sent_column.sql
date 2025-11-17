-- Adicionar coluna para rastrear se o lembrete foi enviado
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Criar índice para melhorar performance das queries de lembretes
CREATE INDEX IF NOT EXISTS idx_appointments_reminder 
ON appointments(appointment_date, status, reminder_sent) 
WHERE reminder_sent = FALSE AND status IN ('confirmed', 'pending');
