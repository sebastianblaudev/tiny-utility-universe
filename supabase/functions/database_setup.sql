
-- This is the SQL to be executed by the Edge Function
CREATE OR REPLACE FUNCTION public.setup_bucket_policies(bucket_id text DEFAULT 'bkpid')
RETURNS void AS $$
BEGIN
  -- Create a policy that allows anyone to read objects in the specified bucket
  EXECUTE format('
    CREATE POLICY IF NOT EXISTS "Anyone can read from %I bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id = %L)
  ', bucket_id, bucket_id);

  -- Create a policy that allows anyone to upload objects to the specified bucket
  EXECUTE format('
    CREATE POLICY IF NOT EXISTS "Anyone can upload to %I bucket"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = %L)
  ', bucket_id, bucket_id);

  -- Create a policy that allows anyone to update objects in the specified bucket
  EXECUTE format('
    CREATE POLICY IF NOT EXISTS "Anyone can update objects in %I bucket"
    ON storage.objects FOR UPDATE
    USING (bucket_id = %L)
  ', bucket_id, bucket_id);

  -- Create a policy that allows anyone to delete objects from the specified bucket
  EXECUTE format('
    CREATE POLICY IF NOT EXISTS "Anyone can delete from %I bucket"
    ON storage.objects FOR DELETE
    USING (bucket_id = %L)
  ', bucket_id, bucket_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
