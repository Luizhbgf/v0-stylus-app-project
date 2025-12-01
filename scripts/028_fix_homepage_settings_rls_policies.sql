-- Fix RLS policies for homepage_settings table
-- Remove all existing policies and recreate them with correct logic

-- Drop existing policies
DROP POLICY IF EXISTS "Todos podem visualizar configurações da homepage" ON homepage_settings;
DROP POLICY IF EXISTS "Apenas admins podem atualizar configurações" ON homepage_settings;
DROP POLICY IF EXISTS "Apenas admins podem inserir configurações" ON homepage_settings;

-- Create correct SELECT policy (anyone can view)
CREATE POLICY "Todos podem visualizar configurações da homepage"
ON homepage_settings
FOR SELECT
TO public
USING (true);

-- Create correct UPDATE policy (admins and super admins can update)
-- IMPORTANT: Both USING and WITH CHECK must allow admins
CREATE POLICY "Apenas admins podem atualizar configurações"
ON homepage_settings
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is admin (level 30) or super admin (level 40)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level >= 30
  )
)
WITH CHECK (
  -- Same check for the new values
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level >= 30
  )
);

-- Create correct INSERT policy (admins and super admins can insert)
CREATE POLICY "Apenas admins podem inserir configurações"
ON homepage_settings
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is admin (level 30) or super admin (level 40)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level >= 30
  )
);

-- Ensure RLS is enabled
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;
