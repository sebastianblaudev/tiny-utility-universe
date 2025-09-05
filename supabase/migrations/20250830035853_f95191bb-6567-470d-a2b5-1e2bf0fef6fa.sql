-- Create indexes for Simple DTE plugin optimization
CREATE INDEX IF NOT EXISTS idx_plugin_transaction_logs_tenant_plugin_sale 
ON plugin_transaction_logs (tenant_id, plugin_key, internal_sale_id);

CREATE INDEX IF NOT EXISTS idx_plugin_transaction_logs_external_id 
ON plugin_transaction_logs (external_transaction_id);

CREATE INDEX IF NOT EXISTS idx_plugin_configurations_tenant_plugin 
ON plugin_configurations (tenant_id, plugin_key);

-- Create function to get next DTE folio number
CREATE OR REPLACE FUNCTION public.get_next_dte_folio(tenant_id_param text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_folio integer;
BEGIN
    -- For now, use a simple random number
    -- In production, this should be replaced with proper folio sequence management
    -- that respects CAF (Código de Autorización de Folios) ranges
    next_folio := floor(random() * 9000 + 1000)::integer;
    
    -- TODO: Implement proper folio sequence with CAF validation
    -- This should:
    -- 1. Check available CAF files for the tenant
    -- 2. Get the next sequential folio from the authorized range
    -- 3. Mark the folio as used
    -- 4. Handle folio exhaustion and CAF renewal
    
    RETURN next_folio;
END;
$$;

-- Create view for DTE transaction summary
CREATE OR REPLACE VIEW public.dte_transaction_summary AS
SELECT 
    tenant_id,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_transactions,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_transactions,
    SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_amount_processed,
    MAX(created_at) as last_transaction_date
FROM plugin_transaction_logs 
WHERE plugin_key = 'simple_dte_chile'
GROUP BY tenant_id;