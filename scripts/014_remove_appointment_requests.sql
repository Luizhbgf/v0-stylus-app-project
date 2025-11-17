-- Remove appointment_requests table and all references

-- Drop policies
DROP POLICY IF EXISTS "Staff can view their appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Staff can update their appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Clients can view their appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Clients can create appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Admin can view all appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Admin can update all appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Users can view own appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Clients can create requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Clients can create appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Staff can update requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Staff can manage appointment requests" ON public.appointment_requests;

-- Drop indexes
DROP INDEX IF EXISTS idx_appointment_requests_status;
DROP INDEX IF EXISTS idx_appointment_requests_staff;
DROP INDEX IF EXISTS idx_appointment_requests_client;

-- Drop table
DROP TABLE IF EXISTS public.appointment_requests CASCADE;
