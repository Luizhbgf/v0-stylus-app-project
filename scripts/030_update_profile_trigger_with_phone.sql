-- Update the trigger function to include phone and disable email verification
create or replace function public.handle_new_user() 
returns trigger 
language plpgsql 
security definer 
set search_path = public 
as $$
begin
  insert into public.profiles (id, email, full_name, phone, user_level, email_verified, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce((new.raw_user_meta_data->>'user_level')::integer, 10),
    true,  -- Automatically mark email as verified
    true   -- User is active by default
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Recreate the trigger to ensure it's active
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user();
