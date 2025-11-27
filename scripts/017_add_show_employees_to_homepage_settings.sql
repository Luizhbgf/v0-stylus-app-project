-- Add show_employees column to homepage_settings table if it doesn't exist
ALTER TABLE homepage_settings 
ADD COLUMN IF NOT EXISTS show_employees boolean DEFAULT true;
