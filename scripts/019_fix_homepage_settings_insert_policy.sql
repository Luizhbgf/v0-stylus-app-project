-- Remove política incorreta
DROP POLICY IF EXISTS "Apenas admins podem inserir configurações" ON homepage_settings;

-- Cria política correta de INSERT para homepage_settings
-- Permitir apenas admins (user_level IN (0, 30)) inserirem configurações
CREATE POLICY "Apenas admins podem inserir configurações"
ON homepage_settings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id 
    FROM users 
    WHERE user_level IN (0, 30)
  )
);
