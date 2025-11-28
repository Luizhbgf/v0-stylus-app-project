-- Criar tabela para bloqueios de agenda (viagem, almoço, etc.)
CREATE TABLE IF NOT EXISTS agenda_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  block_type TEXT NOT NULL, -- 'lunch', 'travel', 'vacation', 'personal', 'other'
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  recurrence_type TEXT, -- 'daily', 'weekly', 'none'
  recurrence_days INTEGER[], -- [0-6] domingo a sabado
  recurrence_end_date TIMESTAMP WITH TIME ZONE,
  color TEXT DEFAULT '#EF4444', -- cor para exibição no calendário
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_agenda_blocks_staff_id ON agenda_blocks(staff_id);
CREATE INDEX IF NOT EXISTS idx_agenda_blocks_dates ON agenda_blocks(start_time, end_time);

-- RLS Policies
ALTER TABLE agenda_blocks ENABLE ROW LEVEL SECURITY;

-- Staff pode ver seus próprios bloqueios
CREATE POLICY "Staff can view own agenda blocks"
ON agenda_blocks
FOR SELECT
TO authenticated
USING (
  auth.uid() = staff_id OR
  auth.uid() IN (
    SELECT id FROM profiles WHERE user_level >= 30
  )
);

-- Staff pode criar seus próprios bloqueios
CREATE POLICY "Staff can create own agenda blocks"
ON agenda_blocks
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = staff_id OR
  auth.uid() IN (
    SELECT id FROM profiles WHERE user_level >= 30
  )
);

-- Staff pode atualizar seus próprios bloqueios
CREATE POLICY "Staff can update own agenda blocks"
ON agenda_blocks
FOR UPDATE
TO authenticated
USING (
  auth.uid() = staff_id OR
  auth.uid() IN (
    SELECT id FROM profiles WHERE user_level >= 30
  )
);

-- Staff pode deletar seus próprios bloqueios
CREATE POLICY "Staff can delete own agenda blocks"
ON agenda_blocks
FOR DELETE
TO authenticated
USING (
  auth.uid() = staff_id OR
  auth.uid() IN (
    SELECT id FROM profiles WHERE user_level >= 30
  )
);
