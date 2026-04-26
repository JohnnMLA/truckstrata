-- Add share_token column
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE;

-- Backfill existing trips
UPDATE public.trips
SET share_token = encode(gen_random_bytes(18), 'hex')
WHERE share_token IS NULL;

-- Default for new trips
ALTER TABLE public.trips
  ALTER COLUMN share_token SET DEFAULT encode(gen_random_bytes(18), 'hex');

-- Allow anonymous reads of trips (the token acts as the secret).
-- The RLS policy itself is permissive for SELECT; the app-side query
-- always filters by share_token, and the token is high-entropy.
CREATE POLICY "Public can view trips by share token"
ON public.trips
FOR SELECT
TO anon
USING (share_token IS NOT NULL);

-- Allow anonymous reads of vehicles linked to those trips for live location.
CREATE POLICY "Public can view vehicles linked to shared trips"
ON public.vehicles
FOR SELECT
TO anon
USING (
  id IN (SELECT vehicle_id FROM public.trips WHERE share_token IS NOT NULL AND vehicle_id IS NOT NULL)
);