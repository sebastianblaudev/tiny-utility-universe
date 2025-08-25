-- Crear tabla de mesas
CREATE TABLE public.mesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL,
  nombre TEXT,
  capacidad INTEGER DEFAULT 4,
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'ocupada', 'reservada', 'fuera_servicio')),
  ubicacion TEXT,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(numero, tenant_id)
);

-- Crear tabla de pedidos de mesa
CREATE TABLE public.pedidos_mesa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mesa_id UUID NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  numero_pedido INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'enviado_cocina', 'completado', 'cancelado')),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  mesero_nombre TEXT,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de items de pedidos de mesa
CREATE TABLE public.pedido_mesa_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_mesa_id UUID NOT NULL REFERENCES public.pedidos_mesa(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  cantidad NUMERIC NOT NULL DEFAULT 1,
  precio_unitario NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado_cocina', 'preparando', 'listo', 'servido')),
  enviado_cocina_at TIMESTAMP WITH TIME ZONE,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_mesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_mesa_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para mesas
CREATE POLICY "Mesas: Tenant isolation" ON public.mesas
  FOR ALL USING (tenant_id = get_current_user_tenant_id_safe())
  WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Políticas RLS para pedidos_mesa
CREATE POLICY "Pedidos mesa: Tenant isolation" ON public.pedidos_mesa
  FOR ALL USING (tenant_id = get_current_user_tenant_id_safe())
  WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Políticas RLS para pedido_mesa_items
CREATE POLICY "Pedido mesa items: Tenant isolation" ON public.pedido_mesa_items
  FOR ALL USING (tenant_id = get_current_user_tenant_id_safe())
  WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Triggers para auto-asignar tenant_id
CREATE OR REPLACE FUNCTION auto_assign_mesas_tenant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_current_user_tenant_id_safe();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auto_assign_pedidos_mesa_tenant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_current_user_tenant_id_safe();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auto_assign_pedido_mesa_items_tenant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_current_user_tenant_id_safe();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear triggers para tenant_id
CREATE TRIGGER set_mesas_tenant_id
  BEFORE INSERT ON public.mesas
  FOR EACH ROW EXECUTE FUNCTION auto_assign_mesas_tenant();

CREATE TRIGGER set_pedidos_mesa_tenant_id
  BEFORE INSERT ON public.pedidos_mesa
  FOR EACH ROW EXECUTE FUNCTION auto_assign_pedidos_mesa_tenant();

CREATE TRIGGER set_pedido_mesa_items_tenant_id
  BEFORE INSERT ON public.pedido_mesa_items
  FOR EACH ROW EXECUTE FUNCTION auto_assign_pedido_mesa_items_tenant();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_mesas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_mesas_updated_at_trigger
  BEFORE UPDATE ON public.mesas
  FOR EACH ROW EXECUTE FUNCTION update_mesas_updated_at();

CREATE TRIGGER update_pedidos_mesa_updated_at_trigger
  BEFORE UPDATE ON public.pedidos_mesa
  FOR EACH ROW EXECUTE FUNCTION update_mesas_updated_at();

CREATE TRIGGER update_pedido_mesa_items_updated_at_trigger
  BEFORE UPDATE ON public.pedido_mesa_items
  FOR EACH ROW EXECUTE FUNCTION update_mesas_updated_at();

-- Índices para mejor rendimiento
CREATE INDEX idx_mesas_tenant_numero ON public.mesas(tenant_id, numero);
CREATE INDEX idx_mesas_estado ON public.mesas(estado) WHERE estado != 'disponible';
CREATE INDEX idx_pedidos_mesa_tenant_mesa ON public.pedidos_mesa(tenant_id, mesa_id);
CREATE INDEX idx_pedidos_mesa_estado ON public.pedidos_mesa(estado) WHERE estado = 'activo';
CREATE INDEX idx_pedido_mesa_items_pedido ON public.pedido_mesa_items(pedido_mesa_id);
CREATE INDEX idx_pedido_mesa_items_estado ON public.pedido_mesa_items(estado) WHERE estado != 'servido';

-- Función para obtener mesa con pedido activo
CREATE OR REPLACE FUNCTION get_mesa_with_active_order(mesa_id_param UUID, tenant_id_param TEXT)
RETURNS TABLE(
  mesa_numero INTEGER,
  mesa_nombre TEXT,
  pedido_id UUID,
  pedido_estado TEXT,
  items_count BIGINT,
  total_pedido NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
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
$$;