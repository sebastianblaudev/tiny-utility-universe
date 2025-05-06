
-- This is the SQL to be executed by the Edge Function
CREATE OR REPLACE FUNCTION public.setup_bucket_policies()
RETURNS void AS $$
BEGIN
  -- Create a policy that allows anyone to read objects in the bkpid bucket
  CREATE POLICY IF NOT EXISTS "Anyone can read from bkpid bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bkpid');

  -- Create a policy that allows anyone to upload objects to the bkpid bucket
  CREATE POLICY IF NOT EXISTS "Anyone can upload to bkpid bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bkpid');

  -- Create a policy that allows anyone to update objects in the bkpid bucket
  CREATE POLICY IF NOT EXISTS "Anyone can update objects in bkpid bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'bkpid');

  -- Create a policy that allows anyone to delete objects from the bkpid bucket
  CREATE POLICY IF NOT EXISTS "Anyone can delete from bkpid bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'bkpid');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
