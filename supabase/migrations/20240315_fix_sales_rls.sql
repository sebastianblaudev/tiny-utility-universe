
-- Fix RLS policies for sales and sale_items tables
BEGIN;

-- First, let's drop existing policies to clean up
DROP POLICY IF EXISTS "Allow authenticated users to insert their own sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to view their own sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to update their own sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own sales" ON sales;
DROP POLICY IF EXISTS "Allow admins full access to sales" ON sales;

DROP POLICY IF EXISTS "Allow authenticated users to insert their own sale items" ON sale_items;
DROP POLICY IF EXISTS "Allow authenticated users to view their own sale items" ON sale_items;
DROP POLICY IF EXISTS "Allow authenticated users to update their own sale items" ON sale_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own sale items" ON sale_items;
DROP POLICY IF EXISTS "Allow admins full access to sale_items" ON sale_items;

-- Now create improved policies for the sales table
-- Policy for insert - using simpler condition
CREATE POLICY "sales_insert_policy" ON sales
FOR INSERT TO authenticated
WITH CHECK (true);

-- Policy for select
CREATE POLICY "sales_select_policy" ON sales
FOR SELECT TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id' OR 
       auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Policy for update
CREATE POLICY "sales_update_policy" ON sales
FOR UPDATE TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id' OR 
       auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Policy for delete
CREATE POLICY "sales_delete_policy" ON sales
FOR DELETE TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id' OR 
       auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Create improved policies for the sale_items table
-- Policy for insert - using simpler condition
CREATE POLICY "sale_items_insert_policy" ON sale_items
FOR INSERT TO authenticated
WITH CHECK (true);

-- Policy for select
CREATE POLICY "sale_items_select_policy" ON sale_items
FOR SELECT TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id' OR 
       auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Policy for update
CREATE POLICY "sale_items_update_policy" ON sale_items
FOR UPDATE TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id' OR 
       auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Policy for delete
CREATE POLICY "sale_items_delete_policy" ON sale_items
FOR DELETE TO authenticated
USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id' OR 
       auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

COMMIT;
