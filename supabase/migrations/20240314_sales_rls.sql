
-- Create Row Level Security policies for the sales table
BEGIN;

-- Enable RLS on the sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policy for insertion
CREATE POLICY "Allow authenticated users to insert their own sales" ON sales
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Create policy for selection
CREATE POLICY "Allow authenticated users to view their own sales" ON sales
FOR SELECT TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Create policy for update
CREATE POLICY "Allow authenticated users to update their own sales" ON sales
FOR UPDATE TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Create policy for deletion
CREATE POLICY "Allow authenticated users to delete their own sales" ON sales
FOR DELETE TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

COMMIT;
