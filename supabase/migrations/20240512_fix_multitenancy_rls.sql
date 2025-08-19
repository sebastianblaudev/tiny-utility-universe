

-- Este script soluciona los problemas de multitenant asegurando que cada tenant
-- solo tenga acceso a sus propios datos

BEGIN;

-- Habilitar RLS en todas las tablas principales que aún no lo tengan
ALTER TABLE IF EXISTS public.cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cashier_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transacciones_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_colors ENABLE ROW LEVEL SECURITY;

-- Política para la tabla cajas
DROP POLICY IF EXISTS "Cajas: Tenant access" ON public.cajas;
CREATE POLICY "Cajas: Tenant access" ON public.cajas
  USING (tenant_id::text = auth.jwt() -> 'user_metadata' ->> 'tenant_id')
  WITH CHECK (tenant_id::text = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Política para la tabla customers
DROP POLICY IF EXISTS "Customers: Tenant access" ON public.customers;
CREATE POLICY "Customers: Tenant access" ON public.customers
  USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id')
  WITH CHECK (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Política para la tabla cashier_pins
DROP POLICY IF EXISTS "Cashier pins: Tenant access" ON public.cashier_pins;
CREATE POLICY "Cashier pins: Tenant access" ON public.cashier_pins
  USING (tenant_id::text = auth.jwt() -> 'user_metadata' ->> 'tenant_id')
  WITH CHECK (tenant_id::text = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Política para la tabla transacciones_caja
DROP POLICY IF EXISTS "Transacciones caja: Tenant access" ON public.transacciones_caja;
CREATE POLICY "Transacciones caja: Tenant access" ON public.transacciones_caja
  USING (tenant_id::text = auth.jwt() -> 'user_metadata' ->> 'tenant_id')
  WITH CHECK (tenant_id::text = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Aseguramos que las políticas existentes para sales y sale_items estén correctas
DROP POLICY IF EXISTS "Allow authenticated users to view their own sales" ON public.sales;
CREATE POLICY "Allow authenticated users to view their own sales" ON public.sales
  FOR SELECT TO authenticated
  USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

DROP POLICY IF EXISTS "Allow authenticated users to insert their own sales" ON public.sales;
CREATE POLICY "Allow authenticated users to insert their own sales" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

DROP POLICY IF EXISTS "Allow authenticated users to update their own sales" ON public.sales;
CREATE POLICY "Allow authenticated users to update their own sales" ON public.sales
  FOR UPDATE TO authenticated
  USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id')
  WITH CHECK (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

DROP POLICY IF EXISTS "Allow authenticated users to view their own sale items" ON public.sale_items;
CREATE POLICY "Allow authenticated users to view their own sale items" ON public.sale_items
  FOR SELECT TO authenticated
  USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

DROP POLICY IF EXISTS "Allow authenticated users to insert their own sale items" ON public.sale_items;
CREATE POLICY "Allow authenticated users to insert their own sale items" ON public.sale_items
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Políticas para products
DROP POLICY IF EXISTS "Products: Tenant access" ON public.products;
CREATE POLICY "Products: Tenant access" ON public.products
  USING (user_id = auth.uid() OR user_id IN (
    SELECT id FROM auth.users 
    WHERE (auth.jwt() -> 'user_metadata' ->> 'tenant_id') = 
          (SELECT auth.jwt() -> 'user_metadata' ->> 'tenant_id' FROM auth.users WHERE id = auth.uid())
  ))
  WITH CHECK (user_id = auth.uid());

-- Habilitar el acceso público anónimo al canal de pantalla cliente usando un parámetro de URL
DROP POLICY IF EXISTS "Allow public access to customer display channels" ON realtime.subscription;
CREATE POLICY "Allow public access to customer display channels" ON realtime.subscription
  FOR INSERT TO anon
  WITH CHECK (channel LIKE 'customer-display-%');

-- Crear tabla de tenant_settings si no existe
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en tenant_settings
ALTER TABLE IF EXISTS public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- Política para tenant_settings
DROP POLICY IF EXISTS "Tenant settings: Owner access" ON public.tenant_settings;
CREATE POLICY "Tenant settings: Owner access" ON public.tenant_settings
  USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id')
  WITH CHECK (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');

-- Crear índices para mejorar el rendimiento de las consultas por tenant_id
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_id ON sale_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cajas_tenant_id ON cajas(tenant_id);

COMMIT;

