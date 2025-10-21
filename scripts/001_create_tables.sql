-- Create profiles table with user levels
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  user_level integer not null default 10,
  -- 10: cliente, 20: staff, 30: admin, 40: super admin
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create services table
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration integer not null,
  -- duration in minutes
  price decimal(10, 2) not null,
  category text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create staff_services table (many-to-many relationship)
create table if not exists public.staff_services (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(staff_id, service_id)
);

-- Create appointments table
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade,
  staff_id uuid references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  appointment_date timestamp with time zone not null,
  status text not null default 'pending',
  -- pending, confirmed, completed, cancelled
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

alter table public.services enable row level security;

alter table public.staff_services enable row level security;

alter table public.appointments enable row level security;

-- Profiles policies
create policy "Users can view all profiles" on public.profiles for
select
  using (true);

create policy "Users can update own profile" on public.profiles for
update
  using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles for insert
with
  check (auth.uid() = id);

-- Services policies
create policy "Anyone can view active services" on public.services for
select
  using (is_active = true);

create policy "Admin can manage services" on public.services for all using (
  exists (
    select
      1
    from
      public.profiles
    where
      profiles.id = auth.uid()
      and profiles.user_level >= 30
  )
);

-- Staff services policies
create policy "Anyone can view staff services" on public.staff_services for
select
  using (true);

create policy "Admin can manage staff services" on public.staff_services for all using (
  exists (
    select
      1
    from
      public.profiles
    where
      profiles.id = auth.uid()
      and profiles.user_level >= 30
  )
);

-- Appointments policies
create policy "Users can view own appointments" on public.appointments for
select
  using (
    auth.uid() = client_id
    or auth.uid() = staff_id
    or exists (
      select
        1
      from
        public.profiles
      where
        profiles.id = auth.uid()
        and profiles.user_level >= 20
    )
  );

create policy "Clients can create appointments" on public.appointments for insert
with
  check (auth.uid() = client_id);

create policy "Users can update own appointments" on public.appointments for
update
  using (
    auth.uid() = client_id
    or auth.uid() = staff_id
    or exists (
      select
        1
      from
        public.profiles
      where
        profiles.id = auth.uid()
        and profiles.user_level >= 20
    )
  );

create policy "Staff can delete appointments" on public.appointments for delete using (
  exists (
    select
      1
    from
      public.profiles
    where
      profiles.id = auth.uid()
      and profiles.user_level >= 20
  )
);
