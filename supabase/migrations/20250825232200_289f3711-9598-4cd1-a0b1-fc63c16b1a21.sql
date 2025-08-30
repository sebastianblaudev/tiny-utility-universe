-- Create plugin_configurations table for storing plugin settings per tenant
CREATE TABLE public.plugin_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  plugin_key TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, plugin_key)
);

-- Enable RLS
ALTER TABLE public.plugin_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Plugin configurations: Tenant isolation" ON public.plugin_configurations
FOR ALL USING (tenant_id = get_current_user_tenant_id_safe())
WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Create plugin_transaction_logs table for tracking all payment operations
CREATE TABLE public.plugin_transaction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  plugin_key TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'sale', 'refund', 'sync', 'webhook'
  external_transaction_id TEXT,
  internal_sale_id UUID,
  amount NUMERIC,
  status TEXT NOT NULL, -- 'pending', 'success', 'failed', 'cancelled'
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plugin_transaction_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Plugin transaction logs: Tenant isolation" ON public.plugin_transaction_logs
FOR ALL USING (tenant_id = get_current_user_tenant_id_safe())
WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Insert Mercado Pago plugin definition
INSERT INTO public.plugin_definitions (
  plugin_key,
  name,
  description,
  version,
  is_active,
  price_monthly,
  features
) VALUES (
  'mercado_pago_pos',
  'Mercado Pago POS',
  'Integración completa con terminales POS de Mercado Pago para ventas automáticas y sincronización',
  '1.0.0',
  true,
  29.99,
  '[
    "Envío automático de ventas a terminal POS",
    "Sincronización bidireccional de transacciones", 
    "Soporte para efectivo, tarjeta y transferencia",
    "Webhooks en tiempo real",
    "Logs detallados de operaciones",
    "Reconciliación automática"
  ]'::jsonb
) ON CONFLICT (plugin_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_plugin_configurations_tenant_plugin ON public.plugin_configurations(tenant_id, plugin_key);
CREATE INDEX idx_plugin_transaction_logs_tenant_plugin ON public.plugin_transaction_logs(tenant_id, plugin_key);
CREATE INDEX idx_plugin_transaction_logs_sale_id ON public.plugin_transaction_logs(internal_sale_id);
CREATE INDEX idx_plugin_transaction_logs_external_id ON public.plugin_transaction_logs(external_transaction_id);