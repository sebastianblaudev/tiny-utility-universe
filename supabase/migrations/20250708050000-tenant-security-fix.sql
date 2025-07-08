-- CRÍTICO: Fix de seguridad para prevenir mezcla de datos entre tenants
-- Esta migración fortalece las políticas RLS para asegurar aislamiento total

BEGIN;

-- 1. Fortalecer políticas de sales con validación estricta
DROP POLICY IF EXISTS "Allow authenticated users to view their own sales" ON public.sales;
CREATE POLICY "STRICT: Tenant isolated sales view" ON public.sales
  FOR SELECT TO authenticated
  USING (
    tenant_id = COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'tenant_id',
      current_setting('request.jwt.claims', true)::json -> 'user_metadata' ->> 'tenant_id'
    )
    AND tenant_id IS NOT NULL
  );

DROP POLICY IF EXISTS "Allow authenticated users to insert their own sales" ON public.sales;
CREATE POLICY "STRICT: Tenant isolated sales insert" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'tenant_id',
      current_setting('request.jwt.claims', true)::json -> 'user_metadata' ->> 'tenant_id'
    )
    AND tenant_id IS NOT NULL
  );

DROP POLICY IF EXISTS "Allow authenticated users to update their own sales" ON public.sales;
CREATE POLICY "STRICT: Tenant isolated sales update" ON public.sales
  FOR UPDATE TO authenticated
  USING (
    tenant_id = COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'tenant_id',
      current_setting('request.jwt.claims', true)::json -> 'user_metadata' ->> 'tenant_id'
    )
    AND tenant_id IS NOT NULL
  )
  WITH CHECK (
    tenant_id = COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'tenant_id',
      current_setting('request.jwt.claims', true)::json -> 'user_metadata' ->> 'tenant_id'
    )
    AND tenant_id IS NOT NULL
  );

-- Política estricta de DELETE con logging
DROP POLICY IF EXISTS "STRICT: Tenant isolated sales delete" ON public.sales;
CREATE POLICY "STRICT: Tenant isolated sales delete" ON public.sales
  FOR DELETE TO authenticated
  USING (
    tenant_id = COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'tenant_id',
      current_setting('request.jwt.claims', true)::json -> 'user_metadata' ->> 'tenant_id'
    )
    AND tenant_id IS NOT NULL
  );

-- 2. Fortalecer políticas de sale_items
DROP POLICY IF EXISTS "Allow authenticated users to view their own sale items" ON public.sale_items;
CREATE POLICY "STRICT: Tenant isolated sale_items view" ON public.sale_items
  FOR SELECT TO authenticated
  USING (
    tenant_id = COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'tenant_id',
      current_setting('request.jwt.claims', true)::json -> 'user_metadata' ->> 'tenant_id'
    )
    AND tenant_id IS NOT NULL
  );

DROP POLICY IF EXISTS "Allow authenticated users to insert their own sale items" ON public.sale_items;
CREATE POLICY "STRICT: Tenant isolated sale_items insert" ON public.sale_items
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'tenant_id',
      current_setting('request.jwt.claims', true)::json -> 'user_metadata' ->> 'tenant_id'
    )
    AND tenant_id IS NOT NULL
  );

-- Política estricta de DELETE para sale_items
DROP POLICY IF EXISTS "STRICT: Tenant isolated sale_items delete" ON public.sale_items;
CREATE POLICY "STRICT: Tenant isolated sale_items delete" ON public.sale_items
  FOR DELETE TO authenticated
  USING (
    tenant_id = COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'tenant_id',
      current_setting('request.jwt.claims', true)::json -> 'user_metadata' ->> 'tenant_id'
    )
    AND tenant_id IS NOT NULL
  );

-- 3. Crear función de monitoreo de acceso cross-tenant
CREATE OR REPLACE FUNCTION log_cross_tenant_attempt()
RETURNS TRIGGER AS $$
DECLARE
  current_tenant_id TEXT;
BEGIN
  -- Obtener tenant_id del usuario actual
  current_tenant_id := COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    current_setting('request.jwt.claims', true)::json -> 'user_metadata' ->> 'tenant_id'
  );
  
  -- Si se intenta acceder a datos de otro tenant, loguear y bloquear
  IF (TG_OP = 'SELECT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND 
     OLD.tenant_id != current_tenant_id THEN
    RAISE WARNING 'TENANT_SECURITY_VIOLATION: User % attempted to access % data from tenant % (current tenant: %)',
      auth.uid(), TG_TABLE_NAME, OLD.tenant_id, current_tenant_id;
    RETURN NULL; -- Bloquear operación
  END IF;
  
  IF TG_OP = 'INSERT' AND NEW.tenant_id != current_tenant_id THEN
    RAISE WARNING 'TENANT_SECURITY_VIOLATION: User % attempted to insert % data for tenant % (current tenant: %)',
      auth.uid(), TG_TABLE_NAME, NEW.tenant_id, current_tenant_id;
    RETURN NULL; -- Bloquear operación
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Aplicar triggers de monitoreo
DROP TRIGGER IF EXISTS sales_tenant_security_monitor ON public.sales;
CREATE TRIGGER sales_tenant_security_monitor
  BEFORE SELECT OR INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION log_cross_tenant_attempt();

DROP TRIGGER IF EXISTS sale_items_tenant_security_monitor ON public.sale_items;
CREATE TRIGGER sale_items_tenant_security_monitor
  BEFORE SELECT OR INSERT OR UPDATE OR DELETE ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION log_cross_tenant_attempt();

-- 5. Crear vista de auditoría para detectar datos mezclados
CREATE OR REPLACE VIEW tenant_isolation_audit AS
SELECT 
  'sales' as table_name,
  tenant_id,
  COUNT(*) as record_count,
  array_agg(DISTINCT auth.uid()) as accessing_users
FROM sales 
GROUP BY tenant_id
UNION ALL
SELECT 
  'sale_items' as table_name,
  tenant_id,
  COUNT(*) as record_count,
  array_agg(DISTINCT auth.uid()) as accessing_users
FROM sale_items 
GROUP BY tenant_id;

-- 6. Función para validar consistencia de tenant en aplicación
CREATE OR REPLACE FUNCTION validate_application_tenant_isolation()
RETURNS TABLE(
  issue_type TEXT,
  table_name TEXT,
  record_id TEXT,
  expected_tenant TEXT,
  actual_tenant TEXT
) AS $$
BEGIN
  -- Buscar sales sin tenant_id
  RETURN QUERY
  SELECT 
    'MISSING_TENANT_ID'::TEXT,
    'sales'::TEXT,
    s.id::TEXT,
    'REQUIRED'::TEXT,
    COALESCE(s.tenant_id, 'NULL')::TEXT
  FROM sales s
  WHERE s.tenant_id IS NULL;
  
  -- Buscar sale_items sin tenant_id
  RETURN QUERY
  SELECT 
    'MISSING_TENANT_ID'::TEXT,
    'sale_items'::TEXT,
    si.id::TEXT,
    'REQUIRED'::TEXT,
    COALESCE(si.tenant_id, 'NULL')::TEXT
  FROM sale_items si
  WHERE si.tenant_id IS NULL;
  
  -- Buscar sale_items con tenant_id diferente a su sale
  RETURN QUERY
  SELECT 
    'INCONSISTENT_TENANT_ID'::TEXT,
    'sale_items'::TEXT,
    si.id::TEXT,
    s.tenant_id::TEXT,
    si.tenant_id::TEXT
  FROM sale_items si
  JOIN sales s ON si.sale_id = s.id
  WHERE si.tenant_id != s.tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;