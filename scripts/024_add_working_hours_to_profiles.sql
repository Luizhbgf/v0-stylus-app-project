-- Add working_hours column to profiles table for detailed schedule management
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS working_hours jsonb DEFAULT '{
  "monday": {"enabled": true, "start": "09:00", "end": "18:00"},
  "tuesday": {"enabled": true, "start": "09:00", "end": "18:00"},
  "wednesday": {"enabled": true, "start": "09:00", "end": "18:00"},
  "thursday": {"enabled": true, "start": "09:00", "end": "18:00"},
  "friday": {"enabled": true, "start": "09:00", "end": "18:00"},
  "saturday": {"enabled": true, "start": "09:00", "end": "14:00"},
  "sunday": {"enabled": false, "start": "09:00", "end": "18:00"}
}'::jsonb;
