
-- Create Row Level Security policies for the sale_items table
BEGIN;

-- Enable RLS on the sale_items table
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Create policy for insertion
CREATE POLICY "Allow authenticated users to insert their own sale items" ON sale_items
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Create policy for selection
CREATE POLICY "Allow authenticated users to view their own sale items" ON sale_items
FOR SELECT TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Create policy for update
CREATE POLICY "Allow authenticated users to update their own sale items" ON sale_items
FOR UPDATE TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Create policy for deletion
CREATE POLICY "Allow authenticated users to delete their own sale items" ON sale_items
FOR DELETE TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

COMMIT;
