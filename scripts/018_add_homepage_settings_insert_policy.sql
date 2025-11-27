-- Add INSERT policy for homepage_settings table
-- This allows admins to insert new configuration records

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Apenas admins podem inserir configurações" ON homepage_settings;
DROP POLICY IF EXISTS "Apenas admins podem atualizar configurações" ON homepage_settings;

-- Create INSERT policy for admins
CREATE POLICY "Apenas admins podem inserir configurações"
ON homepage_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level = 0
  )
);

-- Recreate UPDATE policy for admins
CREATE POLICY "Apenas admins podem atualizar configurações"
ON homepage_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level = 0
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level = 0
  )
);
