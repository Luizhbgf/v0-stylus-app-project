-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage services" ON public.services;
DROP POLICY IF EXISTS "Admin can manage staff services" ON public.staff_services;

-- Allow staff to create and manage services
CREATE POLICY "Staff can create services" ON public.services
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level >= 20
  )
);

CREATE POLICY "Staff can update own services" ON public.services
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.staff_services
    WHERE staff_services.service_id = services.id
    AND staff_services.staff_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level >= 30
  )
);

CREATE POLICY "Staff can delete own services" ON public.services
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.staff_services
    WHERE staff_services.service_id = services.id
    AND staff_services.staff_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level >= 30
  )
);

-- Allow staff to manage their own staff_services entries
CREATE POLICY "Staff can manage own staff services" ON public.staff_services
FOR ALL
USING (
  staff_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_level >= 30
  )
);
