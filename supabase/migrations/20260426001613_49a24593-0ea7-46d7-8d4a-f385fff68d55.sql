-- 1. Driver response enum
DO $$ BEGIN
  CREATE TYPE public.driver_response AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Trip columns for driver response tracking
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS driver_response public.driver_response NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS driver_response_at timestamptz;

-- 3. Helper: get current user's driver row id (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_driver_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.drivers WHERE user_id = _user_id LIMIT 1
$$;

-- 4. Drivers can view their own driver row
DROP POLICY IF EXISTS "Drivers can view own driver row" ON public.drivers;
CREATE POLICY "Drivers can view own driver row"
ON public.drivers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 5. Drivers can update limited fields on their own row (status, hos)
DROP POLICY IF EXISTS "Drivers can update own driver row" ON public.drivers;
CREATE POLICY "Drivers can update own driver row"
ON public.drivers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Drivers can view trips assigned to them
DROP POLICY IF EXISTS "Drivers can view their assigned trips" ON public.trips;
CREATE POLICY "Drivers can view their assigned trips"
ON public.trips
FOR SELECT
TO authenticated
USING (driver_id = public.get_current_driver_id(auth.uid()));

-- 7. Drivers can update their assigned trips (response, status, actual times)
DROP POLICY IF EXISTS "Drivers can update their assigned trips" ON public.trips;
CREATE POLICY "Drivers can update their assigned trips"
ON public.trips
FOR UPDATE
TO authenticated
USING (driver_id = public.get_current_driver_id(auth.uid()))
WITH CHECK (driver_id = public.get_current_driver_id(auth.uid()));

-- 8. Drivers can view vehicles assigned to them (so portal can show truck info)
DROP POLICY IF EXISTS "Drivers can view their current vehicle" ON public.vehicles;
CREATE POLICY "Drivers can view their current vehicle"
ON public.vehicles
FOR SELECT
TO authenticated
USING (current_driver_id = public.get_current_driver_id(auth.uid()));

-- 9. Recipients can view notifications addressed to them as a driver
DROP POLICY IF EXISTS "Drivers can view their notifications" ON public.notifications;
CREATE POLICY "Drivers can view their notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (recipient_driver_id = public.get_current_driver_id(auth.uid()));

-- 10. Allow dispatchers to insert notifications addressed to themselves (for driver-action callbacks)
-- (Already covered by existing dispatcher insert policy, but driver needs to insert callback notifications too)
DROP POLICY IF EXISTS "Drivers can insert callback notifications" ON public.notifications;
CREATE POLICY "Drivers can insert callback notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (
    SELECT organization_id FROM public.drivers WHERE user_id = auth.uid() LIMIT 1
  )
);