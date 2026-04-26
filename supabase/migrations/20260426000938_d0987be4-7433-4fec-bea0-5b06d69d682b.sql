-- Notifications table
CREATE TYPE public.notification_type AS ENUM ('trip_assignment', 'trip_reminder', 'info');

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_user_id UUID,
  recipient_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  type public.notification_type NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_org_created ON public.notifications(organization_id, created_at DESC);
CREATE INDEX idx_notifications_recipient_user ON public.notifications(recipient_user_id) WHERE recipient_user_id IS NOT NULL;
CREATE INDEX idx_notifications_pending ON public.notifications(scheduled_for) WHERE sent_at IS NULL AND scheduled_for IS NOT NULL;

CREATE TRIGGER notifications_set_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Members can view notifications in their org
CREATE POLICY "Org members can view notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_org(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Dispatchers/owners can create
CREATE POLICY "Dispatchers can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.get_user_org(auth.uid())
  AND public.is_org_dispatcher_or_owner(auth.uid())
);

-- Dispatchers/owners can update or delete any in their org;
-- recipients can mark their own as read
CREATE POLICY "Dispatchers can update notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (
  organization_id = public.get_user_org(auth.uid())
  AND public.is_org_dispatcher_or_owner(auth.uid())
);

CREATE POLICY "Recipients can mark own notifications read"
ON public.notifications FOR UPDATE
TO authenticated
USING (recipient_user_id = auth.uid())
WITH CHECK (recipient_user_id = auth.uid());

CREATE POLICY "Dispatchers can delete notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_org(auth.uid())
  AND public.is_org_dispatcher_or_owner(auth.uid())
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Mark immediate notifications (no schedule) as already sent on insert
CREATE OR REPLACE FUNCTION public.notifications_set_sent_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.scheduled_for IS NULL AND NEW.sent_at IS NULL THEN
    NEW.sent_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notifications_set_sent_at_trg
BEFORE INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.notifications_set_sent_at();