-- FASE 1 y 2: PLAN CONSERVADOR DE CORRECCIÓN DE TENANCY
-- Backup y corrección de arquitectura preservando TODOS los datos

BEGIN;

-- Paso 1: Crear tablas de backup para preservar datos originales
CREATE TABLE IF NOT EXISTS sales_backup AS SELECT * FROM sales;
CREATE TABLE IF NOT EXISTS sale_items_backup AS SELECT * FROM sale_items;
CREATE TABLE IF NOT EXISTS products_backup AS SELECT * FROM products;

-- Paso 2: Análisis y mapeo de tenant-usuario para corrección
-- Crear tabla temporal para mapear usuarios a tenants correctos
CREATE TEMP TABLE user_tenant_mapping AS
WITH user_sales_analysis AS (
  -- Analizar qué usuario creó más ventas con cada producto
  SELECT 
    p.user_id as product_owner,
    s.tenant_id as sale_tenant,
    COUNT(*) as usage_count
  FROM products p
  JOIN sale_items si ON p.id = si.product_id
  JOIN sales s ON si.sale_id = s.id
  WHERE s.tenant_id IS NOT NULL AND p.user_id IS NOT NULL
  GROUP BY p.user_id, s.tenant_id
),
dominant_tenant_per_user AS (
  -- Para cada usuario de producto, encontrar el tenant más usado
  SELECT 
    product_owner,
    sale_tenant as correct_tenant_id,
    usage_count,
    ROW_NUMBER() OVER (PARTITION BY product_owner ORDER BY usage_count DESC) as rn
  FROM user_sales_analysis
)
SELECT 
  product_owner as user_id,
  correct_tenant_id as tenant_id
FROM dominant_tenant_per_user 
WHERE rn = 1;

-- Paso 3: Agregar tenant_id a products manteniendo user_id por compatibilidad
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- Paso 4: Migrar tenant_id a products basado en el análisis
UPDATE products 
SET tenant_id = COALESCE(
  (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = products.user_id),
  products.user_id::text -- Fallback: convertir user_id a texto si no hay mapeo
)
WHERE tenant_id IS NULL;

-- Paso 5: Corregir sale_items para que tengan tenant_id consistente con sus ventas
UPDATE sale_items 
SET tenant_id = (
  SELECT s.tenant_id 
  FROM sales s 
  WHERE s.id = sale_items.sale_id
)
WHERE tenant_id IS NULL OR tenant_id != (
  SELECT s.tenant_id 
  FROM sales s 
  WHERE s.id = sale_items.sale_id
);

-- Paso 6: Crear función de validación mejorada con tipos compatibles
CREATE OR REPLACE FUNCTION validate_tenant_consistency()
RETURNS TRIGGER AS $$
DECLARE
    sale_tenant_id TEXT;
    product_tenant_id TEXT;
BEGIN
    IF TG_TABLE_NAME = 'sale_items' THEN
        -- Obtener tenant_id de la venta
        SELECT tenant_id INTO sale_tenant_id 
        FROM sales 
        WHERE id = NEW.sale_id;
        
        -- Obtener tenant_id del producto
        SELECT tenant_id INTO product_tenant_id 
        FROM products 
        WHERE id = NEW.product_id;
        
        -- Validar consistencia
        IF sale_tenant_id IS NULL OR product_tenant_id IS NULL THEN
            RAISE EXCEPTION 'TENANT_SECURITY_ERROR: Missing tenant information: sale_tenant=%, product_tenant=%', 
                sale_tenant_id, product_tenant_id;
        END IF;
        
        IF sale_tenant_id != product_tenant_id THEN
            RAISE EXCEPTION 'TENANT_SECURITY_ERROR: Cannot sell product from tenant % in sale from tenant %', 
                product_tenant_id, sale_tenant_id;
        END IF;
        
        -- Asegurar que sale_item tenga el tenant_id correcto
        NEW.tenant_id := sale_tenant_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 7: Crear trigger de validación
DROP TRIGGER IF EXISTS validate_sale_items_tenant_consistency ON sale_items;
CREATE TRIGGER validate_sale_items_tenant_consistency
    BEFORE INSERT OR UPDATE ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION validate_tenant_consistency();

-- Paso 8: Crear función de logging para monitoreo
CREATE OR REPLACE FUNCTION log_tenant_security_event(
    event_type TEXT,
    table_name TEXT,
    tenant_id_current TEXT,
    tenant_id_attempted TEXT,
    additional_info JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    -- Por ahora solo log a PostgreSQL, más tarde se puede extender
    RAISE WARNING 'TENANT_SECURITY_EVENT: % on % - Current: %, Attempted: %, Info: %', 
        event_type, table_name, tenant_id_current, tenant_id_attempted, additional_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 9: Crear vista para auditoría de datos corregidos
CREATE OR REPLACE VIEW tenant_data_audit AS
SELECT 
    'sales' as table_name,
    tenant_id,
    COUNT(*) as record_count
FROM sales 
WHERE tenant_id IS NOT NULL
GROUP BY tenant_id
UNION ALL
SELECT 
    'sale_items' as table_name,
    tenant_id,
    COUNT(*) as record_count
FROM sale_items 
WHERE tenant_id IS NOT NULL
GROUP BY tenant_id
UNION ALL
SELECT 
    'products' as table_name,
    tenant_id,
    COUNT(*) as record_count
FROM products 
WHERE tenant_id IS NOT NULL
GROUP BY tenant_id;

COMMIT;