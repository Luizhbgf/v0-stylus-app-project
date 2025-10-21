-- Create courses table for staff training
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT,
  duration INTEGER, -- duration in hours
  price DECIMAL(10, 2),
  category TEXT,
  level TEXT, -- beginner, intermediate, advanced
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create staff_courses table (enrollment)
CREATE TABLE IF NOT EXISTS public.staff_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0, -- 0-100
  UNIQUE(staff_id, course_id)
);

-- Create staff_earnings table for financial tracking
CREATE TABLE IF NOT EXISTS public.staff_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2), -- percentage
  payment_date DATE NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'pending', -- pending, paid, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create staff_clients table for client management
CREATE TABLE IF NOT EXISTS public.staff_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_visit DATE,
  last_visit DATE,
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(staff_id, client_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_clients ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Anyone can view active courses" ON public.courses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage courses" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 30
    )
  );

-- Staff courses policies
CREATE POLICY "Staff can view own enrollments" ON public.staff_courses
  FOR SELECT USING (auth.uid() = staff_id);

CREATE POLICY "Staff can enroll in courses" ON public.staff_courses
  FOR INSERT WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Staff can update own enrollments" ON public.staff_courses
  FOR UPDATE USING (auth.uid() = staff_id);

-- Staff earnings policies
CREATE POLICY "Staff can view own earnings" ON public.staff_earnings
  FOR SELECT USING (
    auth.uid() = staff_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 30
    )
  );

CREATE POLICY "Admin can manage earnings" ON public.staff_earnings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 30
    )
  );

-- Staff clients policies
CREATE POLICY "Staff can view own clients" ON public.staff_clients
  FOR SELECT USING (auth.uid() = staff_id);

CREATE POLICY "Staff can manage own clients" ON public.staff_clients
  FOR ALL USING (auth.uid() = staff_id);

-- Function to update staff_clients automatically
CREATE OR REPLACE FUNCTION update_staff_clients()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO public.staff_clients (staff_id, client_id, first_visit, last_visit, total_visits, total_spent)
    VALUES (
      NEW.staff_id,
      NEW.client_id,
      NEW.appointment_date::DATE,
      NEW.appointment_date::DATE,
      1,
      (SELECT price FROM public.services WHERE id = NEW.service_id)
    )
    ON CONFLICT (staff_id, client_id)
    DO UPDATE SET
      last_visit = NEW.appointment_date::DATE,
      total_visits = staff_clients.total_visits + 1,
      total_spent = staff_clients.total_spent + (SELECT price FROM public.services WHERE id = NEW.service_id),
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update staff_clients
CREATE TRIGGER update_staff_clients_trigger
AFTER UPDATE ON public.appointments
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION update_staff_clients();
