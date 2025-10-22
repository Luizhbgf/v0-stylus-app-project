-- Adicionar staff_id à tabela appointment_requests
ALTER TABLE public.appointment_requests 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Adicionar colunas para gerenciamento avançado de agendamentos
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'standard' CHECK (client_type IN ('standard', 'subscription', 'sporadic'));

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue'));

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS sporadic_client_name TEXT;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS sporadic_client_phone TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointment_requests_staff ON public.appointment_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_client ON public.appointment_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON public.appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_appointments_client_type ON public.appointments(client_type);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);

-- Atualizar políticas RLS para appointment_requests
DROP POLICY IF EXISTS "Staff can view their appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Staff can update their appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Clients can view their appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Clients can create appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Admin can view all appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Admin can update all appointment requests" ON public.appointment_requests;

CREATE POLICY "Staff can view their appointment requests"
ON public.appointment_requests FOR SELECT
TO authenticated
USING (
  staff_id = auth.uid() OR
  (SELECT user_level FROM public.profiles WHERE id = auth.uid()) >= 20
);

CREATE POLICY "Staff can update their appointment requests"
ON public.appointment_requests FOR UPDATE
TO authenticated
USING (
  staff_id = auth.uid() OR
  (SELECT user_level FROM public.profiles WHERE id = auth.uid()) >= 30
);

CREATE POLICY "Clients can view their appointment requests"
ON public.appointment_requests FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Clients can create appointment requests"
ON public.appointment_requests FOR INSERT
TO authenticated
WITH CHECK (
  client_id = auth.uid() AND
  (SELECT user_level FROM public.profiles WHERE id = auth.uid()) = 10
);

CREATE POLICY "Admin can view all appointment requests"
ON public.appointment_requests FOR SELECT
TO authenticated
USING ((SELECT user_level FROM public.profiles WHERE id = auth.uid()) >= 30);

CREATE POLICY "Admin can update all appointment requests"
ON public.appointment_requests FOR ALL
TO authenticated
USING ((SELECT user_level FROM public.profiles WHERE id = auth.uid()) >= 30);

-- Atualizar políticas RLS para appointments (permitir clientes esporádicos)
DROP POLICY IF EXISTS "Staff can manage their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin can manage all appointments" ON public.appointments;

CREATE POLICY "Staff can manage their appointments"
ON public.appointments FOR ALL
TO authenticated
USING (
  staff_id = auth.uid() OR
  (SELECT user_level FROM public.profiles WHERE id = auth.uid()) >= 20
);

CREATE POLICY "Admin can manage all appointments"
ON public.appointments FOR ALL
TO authenticated
USING ((SELECT user_level FROM public.profiles WHERE id = auth.uid()) >= 30);
