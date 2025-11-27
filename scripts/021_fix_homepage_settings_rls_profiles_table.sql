-- Remove política com tabela incorreta
DROP POLICY IF EXISTS "Apenas admins podem inserir configurações" ON homepage_settings;

-- Cria política correta de INSERT para homepage_settings
-- Permitir apenas admins (user_level 30) e super admins (user_level 40) inserirem configurações
CREATE POLICY "Apenas admins podem inserir configurações"
ON homepage_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_level IN (30, 40)
  )
);
