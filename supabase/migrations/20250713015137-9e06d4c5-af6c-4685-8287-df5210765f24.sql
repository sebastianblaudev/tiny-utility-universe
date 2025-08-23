
-- Primero, crear un trigger que asegure que todas las ventas con pago mixto tengan distribución de métodos de pago
CREATE OR REPLACE FUNCTION public.ensure_mixed_payment_distribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Si esta es una venta con pago mixto y la acabamos de insertar
    IF NEW.payment_method = 'mixed' AND TG_OP = 'INSERT' THEN
        -- Verificar si ya existen métodos de pago para esta venta
        IF NOT EXISTS (SELECT 1 FROM sale_payment_methods WHERE sale_id = NEW.id) THEN
            -- Insertar un pago en efectivo por el monto total como fallback
            INSERT INTO sale_payment_methods (sale_id, payment_method, amount, tenant_id)
            VALUES (NEW.id, 'cash', NEW.total, NEW.tenant_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Aplicar el trigger para asegurar que los pagos mixtos tengan distribución
DROP TRIGGER IF EXISTS ensure_mixed_payment_distribution_trigger ON sales;
CREATE TRIGGER ensure_mixed_payment_distribution_trigger
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION ensure_mixed_payment_distribution();

-- Arreglar las ventas existentes con pago mixto que no tienen distribución de métodos de pago
INSERT INTO sale_payment_methods (sale_id, payment_method, amount, tenant_id)
SELECT DISTINCT
    s.id,
    'cash',
    s.total,
    s.tenant_id
FROM sales s
WHERE s.payment_method = 'mixed'
AND NOT EXISTS (
    SELECT 1 FROM sale_payment_methods spm 
    WHERE spm.sale_id = s.id
)
AND s.tenant_id IS NOT NULL;
