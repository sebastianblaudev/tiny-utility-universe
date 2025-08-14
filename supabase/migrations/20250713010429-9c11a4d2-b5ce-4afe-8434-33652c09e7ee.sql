
-- Drop the existing function if it exists and recreate it with proper mixed payment distribution
DROP FUNCTION IF EXISTS public.get_sales_by_payment_method(text, timestamp with time zone, timestamp with time zone);

-- Create an improved function that properly distributes mixed payments
CREATE OR REPLACE FUNCTION public.get_sales_by_payment_method(
    tenant_id_param text, 
    start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, 
    end_date timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS TABLE(payment_method text, total numeric, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH regular_sales AS (
        -- Get sales that use a single payment method (not mixed)
        SELECT 
            COALESCE(s.payment_method, 'cash') AS payment_method,
            s.total,
            1::bigint AS count
        FROM sales s
        WHERE s.tenant_id = tenant_id_param
        AND s.status = 'completed'
        AND s.payment_method IS NOT NULL 
        AND s.payment_method != 'mixed'
        AND (start_date IS NULL OR s.date >= start_date)
        AND (end_date IS NULL OR s.date <= end_date)
    ), mixed_payment_breakdown AS (
        -- Get individual payment methods from mixed payment sales
        SELECT 
            spm.payment_method,
            spm.amount AS total,
            1::bigint AS count
        FROM sale_payment_methods spm
        JOIN sales s ON spm.sale_id = s.id
        WHERE spm.tenant_id = tenant_id_param
        AND s.tenant_id = tenant_id_param
        AND s.status = 'completed'
        AND s.payment_method = 'mixed'
        AND (start_date IS NULL OR s.date >= start_date)
        AND (end_date IS NULL OR s.date <= end_date)
    ), combined AS (
        SELECT * FROM regular_sales
        UNION ALL
        SELECT * FROM mixed_payment_breakdown
    )
    SELECT 
        c.payment_method,
        SUM(c.total) AS total,
        SUM(c.count) AS count
    FROM combined c
    GROUP BY c.payment_method
    ORDER BY c.payment_method;
END;
$$;

-- Also create a function specifically for turno-based payment method distribution
CREATE OR REPLACE FUNCTION public.get_turno_sales_by_payment_method_detailed(turno_id_param uuid)
RETURNS TABLE(payment_method text, total numeric, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH regular_sales AS (
        -- Single payment method sales for this turno
        SELECT 
            COALESCE(s.payment_method, 'cash') AS payment_method,
            s.total,
            1::bigint AS count
        FROM sales s
        WHERE s.turno_id = turno_id_param
        AND s.status = 'completed'
        AND s.payment_method IS NOT NULL 
        AND s.payment_method != 'mixed'
    ), mixed_payment_breakdown AS (
        -- Get individual payment methods from mixed payment sales for this turno
        SELECT 
            spm.payment_method,
            spm.amount AS total,
            1::bigint AS count
        FROM sale_payment_methods spm
        JOIN sales s ON spm.sale_id = s.id
        WHERE s.turno_id = turno_id_param
        AND s.status = 'completed'
        AND s.payment_method = 'mixed'
    ), combined AS (
        SELECT * FROM regular_sales
        UNION ALL
        SELECT * FROM mixed_payment_breakdown
    )
    SELECT 
        c.payment_method,
        SUM(c.total) AS total,
        SUM(c.count) AS count
    FROM combined c
    GROUP BY c.payment_method
    ORDER BY c.payment_method;
END;
$$;
