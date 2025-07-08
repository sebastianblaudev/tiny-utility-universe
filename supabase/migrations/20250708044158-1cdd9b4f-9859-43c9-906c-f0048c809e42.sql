-- CORRECCIÓN COMPLETA DE AISLAMIENTO DE TENANTS
-- Esta migración corrige todos los problemas de tenant isolation

BEGIN;

-- 1. AGREGAR tenant_id a la tabla products si no existe
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- 2. CREAR FUNCIÓN PARA OBTENER tenant_id DEL USUARIO ACTUAL MEJORADA
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id_safe()
RETURNS TEXT AS $$
DECLARE
    tenant_id_value TEXT;
BEGIN
    -- Intentar obtener del JWT primero
    SELECT COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'tenant_id',
        current_setting('app.current_tenant_id', true)
    ) INTO tenant_id_value;
    
    -- Si no hay tenant_id, logear el problema
    IF tenant_id_value IS NULL THEN
        RAISE WARNING 'TENANT_SECURITY_CRITICAL: User % has no tenant_id', auth.uid();
    END IF;
    
    RETURN tenant_id_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. CORREGIR DATOS EXISTENTES: Asignar tenant_id a products basado en user_id
UPDATE products 
SET tenant_id = (
    SELECT auth.uid()::text 
    WHERE products.user_id = auth.uid()
)
WHERE tenant_id IS NULL AND user_id IS NOT NULL;

-- Para productos sin user_id, usar un tenant_id por defecto temporal
UPDATE products 
SET tenant_id = COALESCE(user_id::text, 'legacy-data-' || id::text)
WHERE tenant_id IS NULL;

-- 4. CORREGIR sale_items sin tenant_id basándose en la venta padre
UPDATE sale_items 
SET tenant_id = s.tenant_id
FROM sales s
WHERE sale_items.sale_id = s.id 
AND sale_items.tenant_id IS NULL 
AND s.tenant_id IS NOT NULL;

-- 5. ELIMINAR datos huérfanos sin tenant_id válido
DELETE FROM sale_items WHERE tenant_id IS NULL;
DELETE FROM sales WHERE tenant_id IS NULL;
DELETE FROM sale_payment_methods WHERE tenant_id IS NULL;
DELETE FROM sale_item_notes WHERE tenant_id IS NULL;

-- 6. FUNCIÓN DE VALIDACIÓN MEJORADA PARA OPERACIONES CROSS-TENANT
CREATE OR REPLACE FUNCTION public.validate_tenant_isolation_strict()
RETURNS TRIGGER AS $$
DECLARE
    current_tenant_id TEXT;
    operation_table TEXT;
BEGIN
    current_tenant_id := public.get_current_user_tenant_id_safe();
    operation_table := TG_TABLE_NAME;
    
    -- Si no hay tenant_id, bloquear operación
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'TENANT_SECURITY_ERROR: No tenant context available for % operation on %', 
            TG_OP, operation_table;
    END IF;
    
    -- Validar operaciones INSERT
    IF TG_OP = 'INSERT' THEN
        -- Asegurar que el nuevo registro tenga el tenant_id correcto
        IF operation_table = 'products' THEN
            NEW.tenant_id := current_tenant_id;
            NEW.user_id := auth.uid();
        ELSIF operation_table = 'sales' THEN
            NEW.tenant_id := current_tenant_id;
        ELSIF operation_table = 'sale_items' THEN
            NEW.tenant_id := current_tenant_id;
        ELSIF operation_table = 'sale_payment_methods' THEN
            NEW.tenant_id := current_tenant_id;
        ELSIF operation_table = 'sale_item_notes' THEN
            NEW.tenant_id := current_tenant_id;
        ELSIF operation_table = 'customers' THEN
            NEW.tenant_id := current_tenant_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Validar operaciones UPDATE/DELETE
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        IF OLD.tenant_id IS NULL OR OLD.tenant_id != current_tenant_id THEN
            RAISE EXCEPTION 'TENANT_SECURITY_ERROR: Cross-tenant % operation blocked on % - Current: %, Target: %',
                TG_OP, operation_table, current_tenant_id, OLD.tenant_id;
        END IF;
        
        -- Para UPDATE, mantener el tenant_id
        IF TG_OP = 'UPDATE' THEN
            NEW.tenant_id := OLD.tenant_id;
            RETURN NEW;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. APLICAR TRIGGERS DE SEGURIDAD A TODAS LAS TABLAS CRÍTICAS
DROP TRIGGER IF EXISTS tenant_isolation_products ON products;
CREATE TRIGGER tenant_isolation_products
    BEFORE INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION validate_tenant_isolation_strict();

DROP TRIGGER IF EXISTS tenant_isolation_sales ON sales;
CREATE TRIGGER tenant_isolation_sales
    BEFORE INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION validate_tenant_isolation_strict();

DROP TRIGGER IF EXISTS tenant_isolation_sale_items ON sale_items;
CREATE TRIGGER tenant_isolation_sale_items
    BEFORE INSERT OR UPDATE OR DELETE ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION validate_tenant_isolation_strict();

DROP TRIGGER IF EXISTS tenant_isolation_sale_payment_methods ON sale_payment_methods;
CREATE TRIGGER tenant_isolation_sale_payment_methods
    BEFORE INSERT OR UPDATE OR DELETE ON sale_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION validate_tenant_isolation_strict();

DROP TRIGGER IF EXISTS tenant_isolation_sale_item_notes ON sale_item_notes;
CREATE TRIGGER tenant_isolation_sale_item_notes
    BEFORE INSERT OR UPDATE OR DELETE ON sale_item_notes
    FOR EACH ROW
    EXECUTE FUNCTION validate_tenant_isolation_strict();

DROP TRIGGER IF EXISTS tenant_isolation_customers ON customers;
CREATE TRIGGER tenant_isolation_customers
    BEFORE INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION validate_tenant_isolation_strict();

-- 8. RECREAR POLÍTICAS RLS SIMPLIFICADAS Y ESTRICTAS
-- Products
DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

CREATE POLICY "STRICT: Products tenant isolation" ON products
    FOR ALL TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id_safe())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());

-- Sales
DROP POLICY IF EXISTS "Users can view their tenant's sales" ON sales;
DROP POLICY IF EXISTS "Users can insert their tenant's sales" ON sales;
DROP POLICY IF EXISTS "Users can update their tenant's sales" ON sales;
DROP POLICY IF EXISTS "Users can delete their tenant's sales" ON sales;

CREATE POLICY "STRICT: Sales tenant isolation" ON sales
    FOR ALL TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id_safe())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());

-- Sale Items
DROP POLICY IF EXISTS "Users can view their tenant's sale items" ON sale_items;
DROP POLICY IF EXISTS "Users can insert their tenant's sale items" ON sale_items;
DROP POLICY IF EXISTS "Users can update their tenant's sale items" ON sale_items;
DROP POLICY IF EXISTS "Users can delete their tenant's sale items" ON sale_items;

CREATE POLICY "STRICT: Sale items tenant isolation" ON sale_items
    FOR ALL TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id_safe())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());

-- Sale Payment Methods
DROP POLICY IF EXISTS "Users can view their own tenant's sale payment methods" ON sale_payment_methods;

CREATE POLICY "STRICT: Sale payment methods tenant isolation" ON sale_payment_methods
    FOR ALL TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id_safe())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());

-- Sale Item Notes
DROP POLICY IF EXISTS "Users can view their tenant's sale item notes" ON sale_item_notes;
DROP POLICY IF EXISTS "Users can insert their tenant's sale item notes" ON sale_item_notes;
DROP POLICY IF EXISTS "Users can update their tenant's sale item notes" ON sale_item_notes;
DROP POLICY IF EXISTS "Users can delete their tenant's sale item notes" ON sale_item_notes;

CREATE POLICY "STRICT: Sale item notes tenant isolation" ON sale_item_notes
    FOR ALL TO authenticated
    USING (tenant_id = public.get_current_user_tenant_id_safe())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());

-- 9. CREAR FUNCIÓN DE VALIDACIÓN DE CONSISTENCIA
CREATE OR REPLACE FUNCTION public.validate_tenant_data_consistency()
RETURNS TABLE(
    table_name TEXT,
    issue_type TEXT,
    record_count BIGINT,
    details TEXT
) AS $$
BEGIN
    -- Productos sin tenant_id
    RETURN QUERY
    SELECT 
        'products'::TEXT,
        'MISSING_TENANT_ID'::TEXT,
        COUNT(*)::BIGINT,
        'Products without tenant_id'::TEXT
    FROM products 
    WHERE tenant_id IS NULL;
    
    -- Ventas sin tenant_id
    RETURN QUERY
    SELECT 
        'sales'::TEXT,
        'MISSING_TENANT_ID'::TEXT,
        COUNT(*)::BIGINT,
        'Sales without tenant_id'::TEXT
    FROM sales 
    WHERE tenant_id IS NULL;
    
    -- Sale items con tenant_id inconsistente
    RETURN QUERY
    SELECT 
        'sale_items'::TEXT,
        'INCONSISTENT_TENANT_ID'::TEXT,
        COUNT(*)::BIGINT,
        'Sale items with different tenant_id than parent sale'::TEXT
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE si.tenant_id != s.tenant_id;
    
    -- Productos vendidos entre tenants diferentes
    RETURN QUERY
    SELECT 
        'cross_tenant_sales'::TEXT,
        'SECURITY_VIOLATION'::TEXT,
        COUNT(*)::BIGINT,
        'Products sold across different tenants'::TEXT
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.tenant_id != p.tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CREAR VISTA DE MONITOREO
CREATE OR REPLACE VIEW tenant_security_monitor AS
SELECT 
    'products' as table_name,
    tenant_id,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(updated_at) as newest_record
FROM products 
WHERE tenant_id IS NOT NULL
GROUP BY tenant_id
UNION ALL
SELECT 
    'sales' as table_name,
    tenant_id,
    COUNT(*) as record_count,
    MIN(date) as oldest_record,
    MAX(date) as newest_record
FROM sales 
WHERE tenant_id IS NOT NULL
GROUP BY tenant_id
ORDER BY table_name, tenant_id;

COMMIT;