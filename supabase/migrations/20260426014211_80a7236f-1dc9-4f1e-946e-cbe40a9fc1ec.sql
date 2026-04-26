-- 1. Fix get_user_org determinism (use earliest membership consistently)
CREATE OR REPLACE FUNCTION public.get_user_org(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
  ORDER BY created_at ASC, id ASC
  LIMIT 1
$$;

-- 2. Drop the over-permissive anon SELECT policies on trips and vehicles
DROP POLICY IF EXISTS "Public can view trips by share token" ON public.trips;
DROP POLICY IF EXISTS "Public can view vehicles linked to shared trips" ON public.vehicles;

-- 3. Replace with SECURITY DEFINER RPCs that require the exact token
CREATE OR REPLACE FUNCTION public.get_trip_by_share_token(_token text)
RETURNS TABLE (
  id uuid,
  reference text,
  origin_label text,
  destination_label text,
  origin_lat numeric,
  origin_lng numeric,
  destination_lat numeric,
  destination_lng numeric,
  status trip_status,
  scheduled_pickup_at timestamptz,
  scheduled_delivery_at timestamptz,
  actual_pickup_at timestamptz,
  actual_delivery_at timestamptz,
  distance_miles numeric,
  vehicle_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    t.id, t.reference, t.origin_label, t.destination_label,
    t.origin_lat, t.origin_lng, t.destination_lat, t.destination_lng,
    t.status, t.scheduled_pickup_at, t.scheduled_delivery_at,
    t.actual_pickup_at, t.actual_delivery_at, t.distance_miles, t.vehicle_id
  FROM public.trips t
  WHERE t.share_token IS NOT NULL
    AND _token IS NOT NULL
    AND length(_token) >= 16
    AND t.share_token = _token
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_vehicle_by_share_token(_token text)
RETURNS TABLE (
  truck_number text,
  make text,
  model text,
  current_lat numeric,
  current_lng numeric,
  current_location_label text,
  last_ping_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    v.truck_number, v.make, v.model,
    v.current_lat, v.current_lng, v.current_location_label, v.last_ping_at
  FROM public.vehicles v
  JOIN public.trips t ON t.vehicle_id = v.id
  WHERE t.share_token IS NOT NULL
    AND _token IS NOT NULL
    AND length(_token) >= 16
    AND t.share_token = _token
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_trip_by_share_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_vehicle_by_share_token(text) TO anon, authenticated;

-- 4. Profiles: restrict cross-org reads
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view profiles in their org"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR id IN (
      SELECT user_id
      FROM public.organization_members
      WHERE organization_id = public.get_user_org(auth.uid())
    )
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 5. organization_members: prevent dispatcher privilege escalation
CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id
      AND role IN ('fleet_owner', 'super_admin')
  )
$$;

DROP POLICY IF EXISTS "Owners can manage org members" ON public.organization_members;

CREATE POLICY "Owners can manage org members"
  ON public.organization_members
  FOR ALL
  TO authenticated
  USING (
    organization_id = public.get_user_org(auth.uid())
    AND public.is_org_owner(auth.uid())
  )
  WITH CHECK (
    organization_id = public.get_user_org(auth.uid())
    AND public.is_org_owner(auth.uid())
  );