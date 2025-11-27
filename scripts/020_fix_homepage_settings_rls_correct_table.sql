-- Remove todas as políticas de INSERT existentes para homepage_settings
DROP POLICY IF EXISTS "Apenas admins podem inserir configurações" ON homepage_settings;

-- Cria política correta de INSERT para homepage_settings
-- Permitir apenas admins (user_level = 30) e super admins (user_level = 40)
CREATE POLICY "Apenas admins podem inserir configurações"
ON homepage_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.user_level IN (30, 40)
  )
);

-- Também atualizar a política de UPDATE para usar a mesma lógica
DROP POLICY IF EXISTS "Apenas admins podem atualizar configurações" ON homepage_settings;

CREATE POLICY "Apenas admins podem atualizar configurações"
ON homepage_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.user_level IN (30, 40)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.user_level IN (30, 40)
  )
);
