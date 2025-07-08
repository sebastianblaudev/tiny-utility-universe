-- CORRECCIÓN FINAL: Eliminar ventas con problemas de aislamiento cross-tenant
BEGIN;

-- Primero crear una tabla de backup de los datos problemáticos
CREATE TABLE IF NOT EXISTS cross_tenant_sales_backup AS
SELECT 
    si.*,
    s.tenant_id as sale_tenant_id,
    p.tenant_id as product_tenant_id
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
WHERE si.tenant_id != p.tenant_id;

-- Eliminar sale_items que violan el aislamiento de tenants
DELETE FROM sale_items 
WHERE id IN (
    SELECT si.id
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.tenant_id != p.tenant_id
);

-- Verificar que no haya más problemas
CREATE OR REPLACE VIEW tenant_security_status AS
SELECT 
    'SYSTEM_STATUS'::TEXT as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SECURE'
        ELSE 'COMPROMISED'
    END as status,
    COUNT(*) as violation_count
FROM (
    SELECT si.id
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.tenant_id != p.tenant_id
) violations;

COMMIT;