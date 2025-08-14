
-- Migration to add turno_id column to sales table
BEGIN;

-- Add turno_id column to the sales table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sales'
        AND column_name = 'turno_id'
    ) THEN
        ALTER TABLE sales ADD COLUMN turno_id UUID NULL;
    END IF;
END $$;

-- Create an index for faster querying of sales by turno_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'sales'
        AND indexname = 'sales_turno_id_idx'
    ) THEN
        CREATE INDEX sales_turno_id_idx ON sales(turno_id);
    END IF;
END $$;

-- Ensure RLS policies cover the new column
DROP POLICY IF EXISTS "Allow admins full access to sales" ON sales;

CREATE POLICY "Allow admins full access to sales" ON sales
FOR ALL TO authenticated
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Add a policy for users to view and update sales related to their tenant
DROP POLICY IF EXISTS "Users can view sales related to their tenant" ON sales;

CREATE POLICY "Users can view sales related to their tenant" ON sales
FOR SELECT TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth.uid() = id) OR
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
);

CREATE POLICY IF NOT EXISTS "Users can update sales for their tenant" ON sales
FOR UPDATE TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth.uid() = id) OR
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
)
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth.uid() = id) OR
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
);

COMMIT;
