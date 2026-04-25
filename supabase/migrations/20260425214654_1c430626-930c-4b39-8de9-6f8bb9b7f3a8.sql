
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.vehicle_status AS ENUM ('active', 'idle', 'maintenance', 'out_of_service');
CREATE TYPE public.driver_status AS ENUM ('on_duty', 'off_duty', 'driving', 'sleeper', 'unavailable');
CREATE TYPE public.trip_status AS ENUM ('planned', 'assigned', 'in_transit', 'delivered', 'cancelled', 'delayed');
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE public.alert_type AS ENUM ('hos_violation', 'maintenance_due', 'fuel_low', 'route_deviation', 'speeding', 'idle_excessive', 'eta_delay', 'document_expiring', 'other');
CREATE TYPE public.org_plan AS ENUM ('trial', 'starter', 'pro', 'enterprise');

-- ============================================================
-- ORGANIZATIONS (fleets)
-- ============================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan public.org_plan NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'driver',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);

-- ============================================================
-- SECURITY DEFINER HELPERS (avoid RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_org(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_org_dispatcher_or_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id
      AND role IN ('fleet_owner', 'dispatcher', 'super_admin')
  )
$$;

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  truck_number TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INT,
  vin TEXT,
  license_plate TEXT,
  status public.vehicle_status NOT NULL DEFAULT 'idle',
  current_driver_id UUID,
  current_lat NUMERIC(9,6),
  current_lng NUMERIC(9,6),
  current_location_label TEXT,
  fuel_level_pct NUMERIC(5,2),
  odometer_miles INT,
  last_ping_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, truck_number)
);
CREATE INDEX idx_vehicles_org ON public.vehicles(organization_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);

-- ============================================================
-- DRIVERS
-- ============================================================
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  license_state TEXT,
  license_expiry DATE,
  hos_remaining_minutes INT,
  status public.driver_status NOT NULL DEFAULT 'off_duty',
  current_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_drivers_org ON public.drivers(organization_id);
CREATE INDEX idx_drivers_user ON public.drivers(user_id);

-- Add the FK from vehicles.current_driver_id -> drivers.id (after drivers exists)
ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_current_driver_fkey
  FOREIGN KEY (current_driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;

-- ============================================================
-- TRIPS
-- ============================================================
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reference TEXT,
  origin_label TEXT NOT NULL,
  origin_lat NUMERIC(9,6),
  origin_lng NUMERIC(9,6),
  destination_label TEXT NOT NULL,
  destination_lat NUMERIC(9,6),
  destination_lng NUMERIC(9,6),
  scheduled_pickup_at TIMESTAMPTZ,
  scheduled_delivery_at TIMESTAMPTZ,
  actual_pickup_at TIMESTAMPTZ,
  actual_delivery_at TIMESTAMPTZ,
  status public.trip_status NOT NULL DEFAULT 'planned',
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  distance_miles NUMERIC(8,2),
  revenue_cents INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trips_org ON public.trips(organization_id);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX idx_trips_driver ON public.trips(driver_id);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type public.alert_type NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alerts_org ON public.alerts(organization_id);
CREATE INDEX idx_alerts_resolved ON public.alerts(resolved);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);

-- ============================================================
-- updated_at TRIGGERS
-- ============================================================
CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_drivers_updated BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_trips_updated BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_alerts_updated BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — ORGANIZATIONS
-- ============================================================
CREATE POLICY "Members can view their org"
  ON public.organizations FOR SELECT TO authenticated
  USING (id = public.get_user_org(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Owners can update their org"
  ON public.organizations FOR UPDATE TO authenticated
  USING (id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()));

CREATE POLICY "Super admins can manage orgs"
  ON public.organizations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- ============================================================
-- RLS POLICIES — ORGANIZATION MEMBERS
-- ============================================================
CREATE POLICY "Members can view their org members"
  ON public.organization_members FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Owners can manage org members"
  ON public.organization_members FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()))
  WITH CHECK (organization_id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()));

-- ============================================================
-- RLS POLICIES — VEHICLES, DRIVERS, TRIPS, ALERTS
-- (Same pattern: members read, owner/dispatcher write)
-- ============================================================
CREATE POLICY "Org members can view vehicles"
  ON public.vehicles FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Owners/dispatchers manage vehicles"
  ON public.vehicles FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()))
  WITH CHECK (organization_id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()));

CREATE POLICY "Org members can view drivers"
  ON public.drivers FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Owners/dispatchers manage drivers"
  ON public.drivers FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()))
  WITH CHECK (organization_id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()));

CREATE POLICY "Org members can view trips"
  ON public.trips FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Owners/dispatchers manage trips"
  ON public.trips FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()))
  WITH CHECK (organization_id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()));

CREATE POLICY "Org members can view alerts"
  ON public.alerts FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Owners/dispatchers manage alerts"
  ON public.alerts FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()))
  WITH CHECK (organization_id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()));

-- ============================================================
-- AUTO-PROVISION ORG ON SIGNUP
-- Replace handle_new_user to also create a personal org + membership + role.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
  base_slug TEXT;
  final_slug TEXT;
  suffix INT := 0;
BEGIN
  -- Profile
  INSERT INTO public.profiles (id, full_name, company_name, phone, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  -- Org
  org_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'company_name', ''),
    split_part(NEW.email, '@', 1) || '''s Fleet'
  );
  base_slug := regexp_replace(lower(org_name), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'fleet'; END IF;
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix::text;
  END LOOP;

  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, final_slug)
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'fleet_owner');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'fleet_owner')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Make sure the trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
