
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Drop the default that depends on pgcrypto so we can move the extension.
ALTER TABLE public.trips ALTER COLUMN share_token DROP DEFAULT;

-- Move pgcrypto into the dedicated extensions schema.
ALTER EXTENSION pgcrypto SET SCHEMA extensions;

-- Re-attach the default using the fully-qualified function path.
ALTER TABLE public.trips
  ALTER COLUMN share_token SET DEFAULT encode(extensions.gen_random_bytes(18), 'hex');
