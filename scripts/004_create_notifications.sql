-- Create appointment_requests table for pending requests
create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  preferred_date date not null,
  preferred_time time,
  notes text,
  status text not null default 'pending', -- pending, approved, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null, -- appointment_confirmed, appointment_reminder, appointment_cancelled
  related_appointment_id uuid references public.appointments(id) on delete cascade,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.appointment_requests enable row level security;
alter table public.notifications enable row level security;

-- Appointment requests policies
create policy "Users can view own requests" on public.appointment_requests for select
  using (
    auth.uid() = client_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.user_level >= 20
    )
  );

create policy "Clients can create requests" on public.appointment_requests for insert
  with check (auth.uid() = client_id);

create policy "Staff can update requests" on public.appointment_requests for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.user_level >= 20
    )
  );

-- Notifications policies
create policy "Users can view own notifications" on public.notifications for select
  using (auth.uid() = user_id);

create policy "System can create notifications" on public.notifications for insert
  with check (true);

create policy "Users can update own notifications" on public.notifications for update
  using (auth.uid() = user_id);

-- Function to create notification
create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_appointment_id uuid default null
) returns uuid
language plpgsql
security definer
as $$
declare
  v_notification_id uuid;
begin
  insert into public.notifications (user_id, title, message, type, related_appointment_id)
  values (p_user_id, p_title, p_message, p_type, p_appointment_id)
  returning id into v_notification_id;
  
  return v_notification_id;
end;
$$;

-- Function to send appointment confirmation notification
create or replace function public.notify_appointment_confirmed()
returns trigger
language plpgsql
security definer
as $$
declare
  v_service_name text;
  v_appointment_date text;
begin
  -- Get service name
  select name into v_service_name from public.services where id = new.service_id;
  
  -- Format appointment date
  v_appointment_date := to_char(new.appointment_date, 'DD/MM/YYYY às HH24:MI');
  
  -- Create notification for client
  perform public.create_notification(
    new.client_id,
    'Agendamento Confirmado! ✓',
    'Seu agendamento de ' || v_service_name || ' foi confirmado para ' || v_appointment_date,
    'appointment_confirmed',
    new.id
  );
  
  return new;
end;
$$;

-- Trigger for appointment confirmation
drop trigger if exists on_appointment_confirmed on public.appointments;
create trigger on_appointment_confirmed
  after update of status on public.appointments
  for each row
  when (old.status = 'pending' and new.status = 'confirmed')
  execute function public.notify_appointment_confirmed();

-- Function to check and send reminders (to be called by a cron job or scheduled task)
create or replace function public.send_appointment_reminders()
returns void
language plpgsql
security definer
as $$
declare
  v_appointment record;
  v_service_name text;
  v_time_until interval;
begin
  -- Loop through confirmed appointments
  for v_appointment in
    select a.*, s.name as service_name
    from public.appointments a
    join public.services s on s.id = a.service_id
    where a.status = 'confirmed'
    and a.appointment_date > now()
    and a.appointment_date < now() + interval '25 hours'
  loop
    v_time_until := v_appointment.appointment_date - now();
    
    -- Send 1 day reminder (if between 23-25 hours away)
    if v_time_until >= interval '23 hours' and v_time_until <= interval '25 hours' then
      -- Check if reminder already sent
      if not exists (
        select 1 from public.notifications
        where user_id = v_appointment.client_id
        and related_appointment_id = v_appointment.id
        and type = 'appointment_reminder_1day'
      ) then
        perform public.create_notification(
          v_appointment.client_id,
          'Lembrete: Agendamento Amanhã 📅',
          'Você tem um agendamento de ' || v_appointment.service_name || ' amanhã às ' || 
          to_char(v_appointment.appointment_date, 'HH24:MI'),
          'appointment_reminder_1day',
          v_appointment.id
        );
      end if;
    end if;
    
    -- Send 1 hour reminder (if between 50-70 minutes away)
    if v_time_until >= interval '50 minutes' and v_time_until <= interval '70 minutes' then
      -- Check if reminder already sent
      if not exists (
        select 1 from public.notifications
        where user_id = v_appointment.client_id
        and related_appointment_id = v_appointment.id
        and type = 'appointment_reminder_1hour'
      ) then
        perform public.create_notification(
          v_appointment.client_id,
          'Lembrete: Agendamento em 1 Hora ⏰',
          'Seu agendamento de ' || v_appointment.service_name || ' é em 1 hora! Não se esqueça.',
          'appointment_reminder_1hour',
          v_appointment.id
        );
      end if;
    end if;
  end loop;
end;
$$;
