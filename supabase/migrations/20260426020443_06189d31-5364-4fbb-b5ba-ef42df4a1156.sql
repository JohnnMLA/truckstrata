
-- Tighten driver notification inserts: must be self-addressed callbacks only.
DROP POLICY IF EXISTS "Drivers can insert callback notifications" ON public.notifications;

CREATE POLICY "Drivers can insert callback notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  recipient_driver_id = public.get_current_driver_id(auth.uid())
  AND organization_id = (
    SELECT d.organization_id FROM public.drivers d
    WHERE d.user_id = auth.uid() LIMIT 1
  )
  AND created_by = auth.uid()
);

-- Defense-in-depth: explicitly deny non-super-admin writes to user_roles.
-- (The "Super admins can manage roles" policy already restricts ALL ops, but a
-- restrictive policy guarantees no future permissive policy can widen access.)
CREATE POLICY "Deny non-super-admin role writes"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));
