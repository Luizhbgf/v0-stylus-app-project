-- Add show_employees field to homepage_settings
ALTER TABLE homepage_settings 
ADD COLUMN IF NOT EXISTS show_employees boolean DEFAULT true;

-- Update existing row to show employees by default
UPDATE homepage_settings 
SET show_employees = true 
WHERE id = '00000000-0000-0000-0000-000000000001';
