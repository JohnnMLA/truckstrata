-- 1. Document kind enum
CREATE TYPE public.trip_document_kind AS ENUM (
  'bol',
  'pod',
  'invoice',
  'photo',
  'other'
);

-- 2. trip_documents table
CREATE TABLE public.trip_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  uploaded_by UUID,
  kind public.trip_document_kind NOT NULL DEFAULT 'other',
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  content_type TEXT,
  size_bytes BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_documents_trip_id ON public.trip_documents(trip_id);
CREATE INDEX idx_trip_documents_org_id ON public.trip_documents(organization_id);

ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE TRIGGER trip_documents_set_updated_at
BEFORE UPDATE ON public.trip_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS Policies
CREATE POLICY "Org members can view trip documents"
ON public.trip_documents
FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_org(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Drivers can view docs for assigned trips"
ON public.trip_documents
FOR SELECT
TO authenticated
USING (
  trip_id IN (
    SELECT id FROM public.trips
    WHERE driver_id = public.get_current_driver_id(auth.uid())
  )
);

CREATE POLICY "Owners/dispatchers manage trip documents"
ON public.trip_documents
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

CREATE POLICY "Drivers can insert docs for their trips"
ON public.trip_documents
FOR INSERT
TO authenticated
WITH CHECK (
  trip_id IN (
    SELECT id FROM public.trips
    WHERE driver_id = public.get_current_driver_id(auth.uid())
  )
);

CREATE POLICY "Drivers can delete their own uploaded docs"
ON public.trip_documents
FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid()
  AND trip_id IN (
    SELECT id FROM public.trips
    WHERE driver_id = public.get_current_driver_id(auth.uid())
  )
);

-- 3. Storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('trip-documents', 'trip-documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: path is "{org_id}/{trip_id}/{filename}"
CREATE POLICY "Org members can view trip document files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'trip-documents'
  AND (storage.foldername(name))[1]::uuid = public.get_user_org(auth.uid())
);

CREATE POLICY "Owners/dispatchers can upload trip document files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-documents'
  AND (storage.foldername(name))[1]::uuid = public.get_user_org(auth.uid())
  AND public.is_org_dispatcher_or_owner(auth.uid())
);

CREATE POLICY "Owners/dispatchers can update trip document files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trip-documents'
  AND (storage.foldername(name))[1]::uuid = public.get_user_org(auth.uid())
  AND public.is_org_dispatcher_or_owner(auth.uid())
);

CREATE POLICY "Owners/dispatchers can delete trip document files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'trip-documents'
  AND (storage.foldername(name))[1]::uuid = public.get_user_org(auth.uid())
  AND public.is_org_dispatcher_or_owner(auth.uid())
);

CREATE POLICY "Drivers can view files for assigned trips"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'trip-documents'
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT id FROM public.trips
    WHERE driver_id = public.get_current_driver_id(auth.uid())
  )
);

CREATE POLICY "Drivers can upload files for assigned trips"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-documents'
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT id FROM public.trips
    WHERE driver_id = public.get_current_driver_id(auth.uid())
  )
);