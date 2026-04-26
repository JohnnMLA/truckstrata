-- 1. Enums for incident kinds and severity (severity reuses existing alert_severity)
DO $$ BEGIN
  CREATE TYPE public.incident_kind AS ENUM (
    'breakdown',
    'accident',
    'traffic_delay',
    'mechanical',
    'cargo_issue',
    'weather',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  reported_by UUID,
  kind public.incident_kind NOT NULL DEFAULT 'other',
  severity public.alert_severity NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  notes TEXT,
  location_label TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  photo_storage_path TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_org ON public.incidents(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_trip ON public.incidents(trip_id);
CREATE INDEX IF NOT EXISTS idx_incidents_driver ON public.incidents(driver_id);
CREATE INDEX IF NOT EXISTS idx_incidents_unresolved
  ON public.incidents(organization_id, created_at DESC)
  WHERE resolved = false;

-- 3. Updated_at trigger
DROP TRIGGER IF EXISTS trg_incidents_updated_at ON public.incidents;
CREATE TRIGGER trg_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Enable RLS and policies
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Org-wide read for members
DROP POLICY IF EXISTS "Org members can view incidents" ON public.incidents;
CREATE POLICY "Org members can view incidents"
  ON public.incidents
  FOR SELECT
  TO authenticated
  USING (
    (organization_id = public.get_user_org(auth.uid()))
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Drivers can view their own incidents (covers the case where their org_id lookup is slow)
DROP POLICY IF EXISTS "Drivers can view their own incidents" ON public.incidents;
CREATE POLICY "Drivers can view their own incidents"
  ON public.incidents
  FOR SELECT
  TO authenticated
  USING (driver_id = public.get_current_driver_id(auth.uid()));

-- Drivers can insert incidents only for their assigned trips
DROP POLICY IF EXISTS "Drivers can insert incidents for their trips" ON public.incidents;
CREATE POLICY "Drivers can insert incidents for their trips"
  ON public.incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_id = public.get_current_driver_id(auth.uid())
    AND organization_id = (
      SELECT d.organization_id FROM public.drivers d WHERE d.user_id = auth.uid() LIMIT 1
    )
  );

-- Dispatchers / owners manage everything in their org
DROP POLICY IF EXISTS "Owners/dispatchers manage incidents" ON public.incidents;
CREATE POLICY "Owners/dispatchers manage incidents"
  ON public.incidents
  FOR ALL
  TO authenticated
  USING (
    organization_id = public.get_user_org(auth.uid())
    AND public.is_org_dispatcher_or_owner(auth.uid())
  )
  WITH CHECK (
    organization_id = public.get_user_org(auth.uid())
    AND public.is_org_dispatcher_or_owner(auth.uid())
  );

-- 5. Auto-create an alert when an incident is reported so dispatch sees it
CREATE OR REPLACE FUNCTION public.incidents_create_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_type_val public.alert_type;
BEGIN
  -- Map incident kind to an existing alert_type
  alert_type_val := CASE NEW.kind
    WHEN 'breakdown' THEN 'maintenance_due'::public.alert_type
    WHEN 'mechanical' THEN 'maintenance_due'::public.alert_type
    WHEN 'accident' THEN 'other'::public.alert_type
    WHEN 'traffic_delay' THEN 'eta_delay'::public.alert_type
    WHEN 'cargo_issue' THEN 'other'::public.alert_type
    WHEN 'weather' THEN 'eta_delay'::public.alert_type
    ELSE 'other'::public.alert_type
  END;

  INSERT INTO public.alerts (
    organization_id, type, severity, title, message,
    vehicle_id, driver_id, trip_id
  ) VALUES (
    NEW.organization_id,
    alert_type_val,
    NEW.severity,
    'Driver reported: ' || NEW.title,
    COALESCE(NEW.notes, NEW.location_label),
    NEW.vehicle_id,
    NEW.driver_id,
    NEW.trip_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_incidents_create_alert ON public.incidents;
CREATE TRIGGER trg_incidents_create_alert
AFTER INSERT ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.incidents_create_alert();