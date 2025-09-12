-- Create complete database schema from scratch for VentaPOS system

-- First, create necessary enums
CREATE TYPE public.sale_status AS ENUM ('draft', 'completed', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'mixto');
CREATE TYPE public.turno_estado AS ENUM ('abierto', 'cerrado');
CREATE TYPE public.transaccion_tipo AS ENUM ('ingreso', 'egreso', 'venta');
CREATE TYPE public.mesa_estado AS ENUM ('libre', 'ocupada', 'reservada');
CREATE TYPE public.pedido_estado AS ENUM ('pendiente', 'preparando', 'listo', 'entregado', 'cancelado');

-- Create core function for tenant management
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id_safe()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (current_setting('app.current_tenant_id', true))::uuid,
    (auth.jwt() ->> 'tenant_id')::uuid,
    auth.uid()
  );
$$;

-- Create businesses table (tenant management)
CREATE TABLE public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  logo_url text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Businesses policies
CREATE POLICY "Users can view their own business" ON public.businesses
  FOR SELECT USING (owner_id = auth.uid());
  
CREATE POLICY "Users can create their own business" ON public.businesses
  FOR INSERT WITH CHECK (owner_id = auth.uid());
  
CREATE POLICY "Users can update their own business" ON public.businesses
  FOR UPDATE USING (owner_id = auth.uid());

-- Create customers table
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "Users can view customers in their tenant" ON public.customers
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create customers in their tenant" ON public.customers
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update customers in their tenant" ON public.customers
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can delete customers in their tenant" ON public.customers
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create product_colors table
CREATE TABLE public.product_colors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  hex_code text NOT NULL,
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for product_colors
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;

-- Product colors policies
CREATE POLICY "Users can view colors in their tenant" ON public.product_colors
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create colors in their tenant" ON public.product_colors
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update colors in their tenant" ON public.product_colors
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can delete colors in their tenant" ON public.product_colors
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  cost numeric(10,2) DEFAULT 0,
  stock integer DEFAULT 0,
  category text,
  barcode text,
  image_url text,
  color text,
  is_by_weight boolean DEFAULT false,
  unit text DEFAULT 'unidad',
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users can view products in their tenant" ON public.products
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create products in their tenant" ON public.products
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update products in their tenant" ON public.products
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can delete products in their tenant" ON public.products
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create turnos table
CREATE TABLE public.turnos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha_apertura timestamptz NOT NULL DEFAULT now(),
  fecha_cierre timestamptz,
  monto_inicial numeric(10,2) NOT NULL DEFAULT 0,
  monto_final numeric(10,2),
  estado turno_estado NOT NULL DEFAULT 'abierto',
  cajero_id uuid REFERENCES auth.users(id),
  cajero_nombre text NOT NULL,
  observaciones text,
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for turnos
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;

-- Turnos policies
CREATE POLICY "Users can view turnos in their tenant" ON public.turnos
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create turnos in their tenant" ON public.turnos
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update turnos in their tenant" ON public.turnos
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create sales table
CREATE TABLE public.sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date timestamptz NOT NULL DEFAULT now(),
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'efectivo',
  status sale_status NOT NULL DEFAULT 'completed',
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  sale_type text DEFAULT 'normal',
  caja_id text,
  cashier_name text,
  turno_id uuid REFERENCES public.turnos(id) ON DELETE SET NULL,
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Sales policies
CREATE POLICY "Users can view sales in their tenant" ON public.sales
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create sales in their tenant" ON public.sales
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update sales in their tenant" ON public.sales
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can delete sales in their tenant" ON public.sales
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create sale_items table
CREATE TABLE public.sale_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric(10,3) NOT NULL DEFAULT 1,
  price numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for sale_items
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Sale items policies
CREATE POLICY "Users can view sale_items in their tenant" ON public.sale_items
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create sale_items in their tenant" ON public.sale_items
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update sale_items in their tenant" ON public.sale_items
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can delete sale_items in their tenant" ON public.sale_items
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create turno_transacciones table
CREATE TABLE public.turno_transacciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turno_id uuid NOT NULL REFERENCES public.turnos(id) ON DELETE CASCADE,
  tipo transaccion_tipo NOT NULL,
  monto numeric(10,2) NOT NULL DEFAULT 0,
  metodo_pago payment_method NOT NULL DEFAULT 'efectivo',
  descripcion text,
  fecha timestamptz NOT NULL DEFAULT now(),
  venta_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for turno_transacciones
ALTER TABLE public.turno_transacciones ENABLE ROW LEVEL SECURITY;

-- Turno transacciones policies
CREATE POLICY "Users can view turno_transacciones in their tenant" ON public.turno_transacciones
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create turno_transacciones in their tenant" ON public.turno_transacciones
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update turno_transacciones in their tenant" ON public.turno_transacciones
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create mesas table (for restaurant mode)
CREATE TABLE public.mesas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero integer NOT NULL,
  nombre text,
  capacidad integer DEFAULT 4,
  estado mesa_estado NOT NULL DEFAULT 'libre',
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for mesas
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;

-- Mesas policies
CREATE POLICY "Users can view mesas in their tenant" ON public.mesas
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create mesas in their tenant" ON public.mesas
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update mesas in their tenant" ON public.mesas
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can delete mesas in their tenant" ON public.mesas
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create pedidos_mesa table
CREATE TABLE public.pedidos_mesa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mesa_id uuid NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  numero_pedido integer NOT NULL,
  estado pedido_estado NOT NULL DEFAULT 'pendiente',
  total numeric(10,2) NOT NULL DEFAULT 0,
  observaciones text,
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for pedidos_mesa
ALTER TABLE public.pedidos_mesa ENABLE ROW LEVEL SECURITY;

-- Pedidos mesa policies
CREATE POLICY "Users can view pedidos_mesa in their tenant" ON public.pedidos_mesa
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create pedidos_mesa in their tenant" ON public.pedidos_mesa
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update pedidos_mesa in their tenant" ON public.pedidos_mesa
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can delete pedidos_mesa in their tenant" ON public.pedidos_mesa
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create pedido_mesa_items table
CREATE TABLE public.pedido_mesa_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id uuid NOT NULL REFERENCES public.pedidos_mesa(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  producto_nombre text NOT NULL,
  cantidad numeric(10,3) NOT NULL DEFAULT 1,
  precio numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  observaciones text,
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for pedido_mesa_items
ALTER TABLE public.pedido_mesa_items ENABLE ROW LEVEL SECURITY;

-- Pedido mesa items policies
CREATE POLICY "Users can view pedido_mesa_items in their tenant" ON public.pedido_mesa_items
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create pedido_mesa_items in their tenant" ON public.pedido_mesa_items
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update pedido_mesa_items in their tenant" ON public.pedido_mesa_items
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can delete pedido_mesa_items in their tenant" ON public.pedido_mesa_items
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create plugin_definitions table
CREATE TABLE public.plugin_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  version text NOT NULL DEFAULT '1.0.0',
  description text,
  author text,
  is_system boolean NOT NULL DEFAULT false,
  config_schema jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for plugin_definitions
ALTER TABLE public.plugin_definitions ENABLE ROW LEVEL SECURITY;

-- Plugin definitions policies (system-wide, no tenant isolation needed)
CREATE POLICY "All users can view plugin definitions" ON public.plugin_definitions
  FOR SELECT USING (true);

-- Create plugin_configurations table
CREATE TABLE public.plugin_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plugin_id uuid NOT NULL REFERENCES public.plugin_definitions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  is_enabled boolean NOT NULL DEFAULT false,
  config_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plugin_id, tenant_id)
);

-- Enable RLS for plugin_configurations
ALTER TABLE public.plugin_configurations ENABLE ROW LEVEL SECURITY;

-- Plugin configurations policies
CREATE POLICY "Users can view plugin_configurations in their tenant" ON public.plugin_configurations
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create plugin_configurations in their tenant" ON public.plugin_configurations
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update plugin_configurations in their tenant" ON public.plugin_configurations
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can delete plugin_configurations in their tenant" ON public.plugin_configurations
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create sale_payment_methods table for mixed payments
CREATE TABLE public.sale_payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  payment_method payment_method NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  tenant_id uuid NOT NULL DEFAULT public.get_current_user_tenant_id_safe(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for sale_payment_methods
ALTER TABLE public.sale_payment_methods ENABLE ROW LEVEL SECURITY;

-- Sale payment methods policies
CREATE POLICY "Users can view sale_payment_methods in their tenant" ON public.sale_payment_methods
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can create sale_payment_methods in their tenant" ON public.sale_payment_methods
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can update sale_payment_methods in their tenant" ON public.sale_payment_methods
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id_safe());
  
CREATE POLICY "Users can delete sale_payment_methods in their tenant" ON public.sale_payment_methods
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id_safe());

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mesas_updated_at
  BEFORE UPDATE ON public.mesas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pedidos_mesa_updated_at
  BEFORE UPDATE ON public.pedidos_mesa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plugin_definitions_updated_at
  BEFORE UPDATE ON public.plugin_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plugin_configurations_updated_at
  BEFORE UPDATE ON public.plugin_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX idx_sales_tenant_id ON public.sales(tenant_id);
CREATE INDEX idx_sales_date ON public.sales(date);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX idx_turnos_tenant_id ON public.turnos(tenant_id);
CREATE INDEX idx_turno_transacciones_turno_id ON public.turno_transacciones(turno_id);
CREATE INDEX idx_mesas_tenant_id ON public.mesas(tenant_id);
CREATE INDEX idx_pedidos_mesa_mesa_id ON public.pedidos_mesa(mesa_id);
CREATE INDEX idx_plugin_configurations_tenant_id ON public.plugin_configurations(tenant_id);

-- Insert default plugin definitions
INSERT INTO public.plugin_definitions (name, version, description, author, is_system) VALUES
('FastPOS', '1.0.0', 'Plugin para modo POS rápido', 'VentaPOS', true),
('DelightMesas', '1.0.0', 'Plugin para gestión de mesas de restaurante', 'VentaPOS', true),
('OfflineSync', '1.0.0', 'Plugin para sincronización offline', 'VentaPOS', true);