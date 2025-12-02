-- Disable email confirmation requirement for new signups
-- This allows users to sign in immediately after registration without verifying their email

-- Update auth configuration to disable email confirmation
-- Note: This requires Supabase dashboard access or can be done via SQL
-- For development, you can also set this in your Supabase project settings

-- Alternatively, update the trigger to mark emails as verified automatically
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with user data from metadata
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone,
    user_level,
    email_verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'user_level')::integer, 10),
    true  -- Mark email as verified automatically
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    email_verified = true;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update existing users to have verified emails (optional)
UPDATE public.profiles 
SET email_verified = true 
WHERE email_verified IS NULL OR email_verified = false;
