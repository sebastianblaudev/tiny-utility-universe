-- Insert Delight plugin definition
INSERT INTO public.plugin_definitions (
  plugin_key,
  name,
  description,
  version,
  price_monthly,
  features,
  is_active
) VALUES (
  'delight_mesas',
  'Delight - Sistema de Mesas',
  'Sistema completo de gestión de mesas para restaurantes con comandas automáticas',
  '1.0.0',
  0,
  '[
    "Gestión de 7 mesas simultáneas",
    "Comandas automáticas para cocina",
    "Seguimiento de pedidos por mesa",
    "Impresión de cuentas parciales",
    "Checkout por mesa",
    "Control de productos enviados a cocina"
  ]'::jsonb,
  true
) ON CONFLICT (plugin_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  updated_at = now();

-- Create mesas table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL,
  nombre TEXT,
  capacidad INTEGER DEFAULT 4,
  estado TEXT NOT NULL DEFAULT 'disponible',
  ubicacion TEXT,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, numero)
);

-- Create pedidos_mesa table if it doesn't exist  
CREATE TABLE IF NOT EXISTS public.pedidos_mesa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mesa_id UUID NOT NULL,
  numero_pedido INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activo',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  mesero_nombre TEXT,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pedido_mesa_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pedido_mesa_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_mesa_id UUID NOT NULL,
  product_id UUID NOT NULL,
  cantidad NUMERIC NOT NULL DEFAULT 1,
  precio_unitario NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  enviado_cocina_at TIMESTAMP WITH TIME ZONE,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_mesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_mesa_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for mesas
DROP POLICY IF EXISTS "Mesas: Tenant isolation" ON public.mesas;
CREATE POLICY "Mesas: Tenant isolation" ON public.mesas
  FOR ALL USING (tenant_id = get_current_user_tenant_id_safe())
  WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- RLS policies for pedidos_mesa
DROP POLICY IF EXISTS "Pedidos mesa: Tenant isolation" ON public.pedidos_mesa;
CREATE POLICY "Pedidos mesa: Tenant isolation" ON public.pedidos_mesa
  FOR ALL USING (tenant_id = get_current_user_tenant_id_safe())
  WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- RLS policies for pedido_mesa_items  
DROP POLICY IF EXISTS "Pedido mesa items: Tenant isolation" ON public.pedido_mesa_items;
CREATE POLICY "Pedido mesa items: Tenant isolation" ON public.pedido_mesa_items
  FOR ALL USING (tenant_id = get_current_user_tenant_id_safe())
  WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Auto-assign tenant triggers
DROP TRIGGER IF EXISTS auto_assign_mesas_tenant_trigger ON public.mesas;
CREATE TRIGGER auto_assign_mesas_tenant_trigger
  BEFORE INSERT ON public.mesas
  FOR EACH ROW EXECUTE FUNCTION auto_assign_mesas_tenant();

DROP TRIGGER IF EXISTS auto_assign_pedidos_mesa_tenant_trigger ON public.pedidos_mesa;
CREATE TRIGGER auto_assign_pedidos_mesa_tenant_trigger
  BEFORE INSERT ON public.pedidos_mesa
  FOR EACH ROW EXECUTE FUNCTION auto_assign_pedidos_mesa_tenant();

DROP TRIGGER IF EXISTS auto_assign_pedido_mesa_items_tenant_trigger ON public.pedido_mesa_items;
CREATE TRIGGER auto_assign_pedido_mesa_items_tenant_trigger
  BEFORE INSERT ON public.pedido_mesa_items
  FOR EACH ROW EXECUTE FUNCTION auto_assign_pedido_mesa_items_tenant();

-- Update timestamps triggers
DROP TRIGGER IF EXISTS update_mesas_updated_at_trigger ON public.mesas;
CREATE TRIGGER update_mesas_updated_at_trigger
  BEFORE UPDATE ON public.mesas
  FOR EACH ROW EXECUTE FUNCTION update_mesas_updated_at();

-- Insert default 7 mesas for existing tenants that have the plugin active
INSERT INTO public.mesas (numero, nombre, tenant_id)
SELECT 
  generate_series(1, 7) as numero,
  'Mesa ' || generate_series(1, 7) as nombre,
  pc.tenant_id
FROM public.plugin_configurations pc
WHERE pc.plugin_key = 'delight_mesas' 
  AND pc.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.mesas m 
    WHERE m.tenant_id = pc.tenant_id
  )
ON CONFLICT (tenant_id, numero) DO NOTHING;

-- Function to get mesa with active order
CREATE OR REPLACE FUNCTION public.get_mesa_with_active_order(
  mesa_id_param UUID,
  tenant_id_param TEXT
) RETURNS TABLE(
  mesa_numero INTEGER,
  mesa_nombre TEXT,
  pedido_id UUID,
  pedido_estado TEXT,
  items_count BIGINT,
  total_pedido NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    m.numero,
    m.nombre,
    pm.id,
    pm.estado,
    COUNT(pmi.id),
    pm.total
  FROM public.mesas m
  LEFT JOIN public.pedidos_mesa pm ON m.id = pm.mesa_id AND pm.estado = 'activo'
  LEFT JOIN public.pedido_mesa_items pmi ON pm.id = pmi.pedido_mesa_id
  WHERE m.id = mesa_id_param 
    AND m.tenant_id = tenant_id_param
  GROUP BY m.numero, m.nombre, pm.id, pm.estado, pm.total;
END;
$function$;