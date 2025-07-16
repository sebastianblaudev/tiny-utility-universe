-- Fix duplicate sale_payment_methods records
-- First, let's identify and remove duplicate payment records that are equal to the total sale amount

-- Delete duplicate payment records where the amount equals the total sale amount 
-- and there are other payment records for the same sale (indicating it's a mixed payment)
DELETE FROM sale_payment_methods spm1
WHERE EXISTS (
    -- Check if there's a corresponding sale
    SELECT 1 FROM sales s 
    WHERE s.id = spm1.sale_id 
    AND s.total = spm1.amount
    AND s.payment_method = 'mixed'
)
AND EXISTS (
    -- Check if there are other payment method records for this sale
    SELECT 1 FROM sale_payment_methods spm2 
    WHERE spm2.sale_id = spm1.sale_id 
    AND spm2.id != spm1.id
);

-- Update the database function to handle this edge case better
DROP FUNCTION IF EXISTS public.get_sales_by_payment_method(text, timestamp with time zone, timestamp with time zone);

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
        -- Exclude any payment record that equals the total sale amount (duplicates)
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
        -- Exclude payment records that equal the total (these are duplicates)
        AND spm.amount != s.total
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