-- Fix the customers RLS policy to use the correct tenant_id path
DROP POLICY IF EXISTS "Tenant isolation for customers" ON public.customers;

-- Create the correct RLS policy for customers
CREATE POLICY "Tenant isolation for customers" 
ON public.customers 
FOR ALL 
USING (tenant_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'tenant_id'::text))
WITH CHECK (tenant_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'tenant_id'::text));