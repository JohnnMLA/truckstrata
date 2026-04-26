
DROP POLICY IF EXISTS "Org members can view drivers" ON public.drivers;

CREATE POLICY "Dispatchers and owners can view drivers"
ON public.drivers
FOR SELECT
TO authenticated
USING (
  (organization_id = public.get_user_org(auth.uid()) AND public.is_org_dispatcher_or_owner(auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

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
  AND role <> 'super_admin'::public.app_role
);

CREATE POLICY "Super admins manage org members"
ON public.organization_members
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));
