-- Enum for maintenance categories
DO $$ BEGIN
  CREATE TYPE public.maintenance_kind AS ENUM (
    'oil_change',
    'tire_rotation',
    'brake_inspection',
    'dot_inspection',
    'annual_inspection',
    'transmission_service',
    'coolant_flush',
    'air_filter',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Recurring schedules per vehicle
CREATE TABLE public.maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  kind public.maintenance_kind NOT NULL DEFAULT 'other',
  label TEXT,
  interval_miles INTEGER,
  interval_days INTEGER,
  last_service_at TIMESTAMPTZ,
  last_service_miles INTEGER,
  next_due_at TIMESTAMPTZ,
  next_due_miles INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service log
CREATE TABLE public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.maintenance_schedules(id) ON DELETE SET NULL,
  kind public.maintenance_kind NOT NULL DEFAULT 'other',
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  odometer_miles INTEGER,
  cost_cents INTEGER,
  vendor TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_maint_schedules_org ON public.maintenance_schedules(organization_id);
CREATE INDEX idx_maint_schedules_vehicle ON public.maintenance_schedules(vehicle_id);
CREATE INDEX idx_maint_schedules_due ON public.maintenance_schedules(next_due_at);
CREATE INDEX idx_maint_records_org ON public.maintenance_records(organization_id);
CREATE INDEX idx_maint_records_vehicle ON public.maintenance_records(vehicle_id);
CREATE INDEX idx_maint_records_performed ON public.maintenance_records(performed_at DESC);

-- updated_at triggers
CREATE TRIGGER trg_maint_schedules_updated
  BEFORE UPDATE ON public.maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_maint_records_updated
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- Schedules policies
CREATE POLICY "Org members can view maintenance schedules"
  ON public.maintenance_schedules FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_org(auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Drivers can view schedules for assigned vehicle"
  ON public.maintenance_schedules FOR SELECT TO authenticated
  USING (
    vehicle_id IN (
      SELECT current_vehicle_id FROM public.drivers
      WHERE user_id = auth.uid() AND current_vehicle_id IS NOT NULL
    )
  );

CREATE POLICY "Owners/dispatchers manage maintenance schedules"
  ON public.maintenance_schedules FOR ALL TO authenticated
  USING (
    organization_id = public.get_user_org(auth.uid())
    AND public.is_org_dispatcher_or_owner(auth.uid())
  )
  WITH CHECK (
    organization_id = public.get_user_org(auth.uid())
    AND public.is_org_dispatcher_or_owner(auth.uid())
  );

-- Records policies
CREATE POLICY "Org members can view maintenance records"
  ON public.maintenance_records FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_org(auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Drivers can view records for assigned vehicle"
  ON public.maintenance_records FOR SELECT TO authenticated
  USING (
    vehicle_id IN (
      SELECT current_vehicle_id FROM public.drivers
      WHERE user_id = auth.uid() AND current_vehicle_id IS NOT NULL
    )
  );

CREATE POLICY "Owners/dispatchers manage maintenance records"
  ON public.maintenance_records FOR ALL TO authenticated
  USING (
    organization_id = public.get_user_org(auth.uid())
    AND public.is_org_dispatcher_or_owner(auth.uid())
  )
  WITH CHECK (
    organization_id = public.get_user_org(auth.uid())
    AND public.is_org_dispatcher_or_owner(auth.uid())
  );