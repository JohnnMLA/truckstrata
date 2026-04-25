-- Ensure full row data is sent on UPDATE events (so we get all columns, not just changed ones)
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;

-- Add vehicles table to the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vehicles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
  END IF;
END $$;