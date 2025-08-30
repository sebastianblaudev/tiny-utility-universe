
-- 1) Normalizar triggers en sales y sale_payment_methods
-- Nota: Si los triggers no existen, estos DROP son no-op (seguros).

DROP TRIGGER IF EXISTS trg_link_sale_to_active_turno ON public.sales;
DROP TRIGGER IF EXISTS link_sale_to_active_turno_trigger ON public.sales;
DROP TRIGGER IF EXISTS link_sale_to_active_turno_enhanced_trigger ON public.sales;

-- Crear un único trigger que use la versión mejorada
CREATE TRIGGER link_sale_to_active_turno_enhanced_trigger
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.link_sale_to_active_turno_enhanced();

-- Asegurar trigger para pagos mixtos
DROP TRIGGER IF EXISTS link_sale_payment_methods_to_active_turno_trg ON public.sale_payment_methods;

CREATE TRIGGER link_sale_payment_methods_to_active_turno_trg
AFTER INSERT ON public.sale_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.link_sale_payment_methods_to_active_turno();


-- 2) Depurar duplicados en turno_transacciones (tipo = 'venta')
-- Opcional: respaldar duplicados antes de borrarlos
CREATE TABLE IF NOT EXISTS public.turno_transacciones_dups_backup (LIKE public.turno_transacciones INCLUDING ALL);

WITH dups AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, venta_id, metodo_pago
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.turno_transacciones
  WHERE tipo = 'venta'
    AND venta_id IS NOT NULL
)
INSERT INTO public.turno_transacciones_dups_backup
SELECT t.*
FROM public.turno_transacciones t
JOIN dups d ON d.id = t.id
WHERE d.rn > 1;

DELETE FROM public.turno_transacciones t
USING dups d
WHERE t.id = d.id
  AND d.rn > 1;


-- 3) Prevenir duplicaciones futuras con índice único parcial
-- Permite múltiples métodos por venta (mixto) pero uno por método.
CREATE UNIQUE INDEX IF NOT EXISTS ux_turno_transacciones_sale_method
ON public.turno_transacciones (tenant_id, venta_id, metodo_pago)
WHERE venta_id IS NOT NULL AND tipo = 'venta';


-- 4) Endurecer funciones para evitar doble inserción

-- 4.1) Ventas con un solo método (no mixto)
CREATE OR REPLACE FUNCTION public.link_sale_to_active_turno_enhanced()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    active_turno_id UUID;
    has_payment_methods BOOLEAN;
    target_method TEXT;
BEGIN
    -- Buscar turno activo
    SELECT id INTO active_turno_id
    FROM turnos
    WHERE tenant_id = NEW.tenant_id
      AND estado = 'abierto'
    ORDER BY fecha_apertura DESC
    LIMIT 1;

    IF active_turno_id IS NOT NULL THEN
        NEW.turno_id := active_turno_id;

        -- ¿Tiene pagos mixtos?
        SELECT EXISTS(SELECT 1 FROM sale_payment_methods WHERE sale_id = NEW.id)
        INTO has_payment_methods;

        target_method := COALESCE(NEW.payment_method, 'efectivo');

        -- Solo insertar si no es mixto y no existe ya el registro
        IF NOT has_payment_methods AND target_method != 'mixed' THEN
            INSERT INTO turno_transacciones (
                turno_id, tipo, monto, metodo_pago, descripcion, venta_id, tenant_id
            )
            VALUES (
                active_turno_id,
                'venta',
                NEW.total,
                target_method,
                'Venta registrada automáticamente',
                NEW.id,
                NEW.tenant_id
            )
            ON CONFLICT (tenant_id, venta_id, metodo_pago)
            DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- 4.2) Ventas con pagos mixtos: insertar 1 transacción por método
CREATE OR REPLACE FUNCTION public.link_sale_payment_methods_to_active_turno()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    active_turno_id UUID;
BEGIN
    -- Buscar turno activo
    SELECT id INTO active_turno_id
    FROM turnos
    WHERE tenant_id = NEW.tenant_id
      AND estado = 'abierto'
    ORDER BY fecha_apertura DESC
    LIMIT 1;

    IF active_turno_id IS NOT NULL THEN
        INSERT INTO turno_transacciones (
            turno_id, tipo, monto, metodo_pago, descripcion, venta_id, tenant_id
        )
        VALUES (
            active_turno_id,
            'venta',
            NEW.amount,
            NEW.payment_method,
            'Venta con pago mixto',
            NEW.sale_id,
            NEW.tenant_id
        )
        ON CONFLICT (tenant_id, venta_id, metodo_pago)
        DO NOTHING;
    END IF;

    RETURN NEW;
END;
$function$;
