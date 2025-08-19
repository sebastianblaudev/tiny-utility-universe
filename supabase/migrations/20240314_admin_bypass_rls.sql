
-- Create bypass policies for admin users
BEGIN;

-- Create an admin bypass policy for the sales table
CREATE POLICY "Allow admins full access to sales" ON sales
FOR ALL TO authenticated
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Create an admin bypass policy for the sale_items table
CREATE POLICY "Allow admins full access to sale_items" ON sale_items
FOR ALL TO authenticated
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

COMMIT;
