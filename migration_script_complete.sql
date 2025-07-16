-- =====================================================
-- MIGRACIÓN COMPLETA A NUEVO PROYECTO SUPABASE
-- =====================================================
-- Este script debe ejecutarse en el nuevo proyecto Supabase
-- IMPORTANTE: Solo migra la estructura, no los datos

-- =====================================================
-- 1. EXTENSIONES NECESARIAS
-- =====================================================

-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- =====================================================
-- 2. TIPOS PERSONALIZADOS
-- =====================================================

-- Tipo para roles de aplicación (si se necesita en el futuro)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
END$$;

-- =====================================================
-- 3. TABLAS PRINCIPALES
-- =====================================================

-- Tabla: cajas
CREATE TABLE IF NOT EXISTS public.cajas (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT now(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    hora_apertura TEXT,
    hora_cierre TEXT,
    monto_inicial NUMERIC NOT NULL DEFAULT 0,
    monto_final NUMERIC,
    estado TEXT NOT NULL DEFAULT 'cerrada',
    nombre_cajero TEXT,
    observaciones TEXT,
    tenant_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: cashier_pins
CREATE TABLE IF NOT EXISTS public.cashier_pins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    tenant_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: cashiers
CREATE TABLE IF NOT EXISTS public.cashiers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT,
    tenant_id TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    tenant_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: ingredients
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    stock NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'g',
    reorder_level NUMERIC DEFAULT 500,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: ingredient_transactions
CREATE TABLE IF NOT EXISTS public.ingredient_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ingredient_id UUID NOT NULL,
    transaction_type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    notes TEXT,
    sale_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: preparations
CREATE TABLE IF NOT EXISTS public.preparations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    preparation_time INTEGER,
    notes TEXT,
    user_id UUID,
    sale_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla: products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    price NUMERIC NOT NULL,
    cost_price NUMERIC NOT NULL,
    stock NUMERIC NOT NULL DEFAULT 0,
    category TEXT,
    image_url TEXT,
    color TEXT,
    unit TEXT DEFAULT 'kg',
    is_weight_based BOOLEAN DEFAULT false,
    is_by_weight BOOLEAN DEFAULT false,
    tenant_id TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: product_colors
CREATE TABLE IF NOT EXISTS public.product_colors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    color_code TEXT NOT NULL,
    color_name TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: product_ingredients
CREATE TABLE IF NOT EXISTS public.product_ingredients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    ingredient_id UUID NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: sales
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    total NUMERIC NOT NULL,
    payment_method TEXT,
    sale_type TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    customer_id UUID,
    cashier_name TEXT,
    turno_id UUID,
    tenant_id TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: sale_items
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    unit TEXT,
    weight NUMERIC,
    is_by_weight BOOLEAN DEFAULT false,
    tenant_id TEXT
);

-- Tabla: sale_item_notes
CREATE TABLE IF NOT EXISTS public.sale_item_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL,
    product_id UUID NOT NULL,
    note TEXT NOT NULL,
    tenant_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: sale_payment_methods
CREATE TABLE IF NOT EXISTS public.sale_payment_methods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL,
    payment_method TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    tenant_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: turnos
CREATE TABLE IF NOT EXISTS public.turnos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cajero_nombre TEXT NOT NULL,
    cajero_id TEXT,
    fecha_apertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    monto_inicial NUMERIC NOT NULL DEFAULT 0,
    monto_final NUMERIC,
    estado TEXT NOT NULL DEFAULT 'abierto',
    observaciones TEXT,
    tenant_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: turno_transacciones
CREATE TABLE IF NOT EXISTS public.turno_transacciones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    turno_id UUID NOT NULL,
    tipo TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
    descripcion TEXT,
    venta_id UUID,
    tenant_id TEXT NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: transacciones_caja
CREATE TABLE IF NOT EXISTS public.transacciones_caja (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    caja_id UUID NOT NULL,
    tipo TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    metodo_pago TEXT NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT now(),
    hora TEXT,
    tenant_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 4. FOREIGN KEYS
-- =====================================================

-- Foreign keys para ingredient_transactions
ALTER TABLE public.ingredient_transactions 
    ADD CONSTRAINT ingredient_transactions_ingredient_id_fkey 
    FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id);

ALTER TABLE public.ingredient_transactions 
    ADD CONSTRAINT ingredient_transactions_sale_id_fkey 
    FOREIGN KEY (sale_id) REFERENCES public.sales(id);

-- Foreign keys para product_colors
ALTER TABLE public.product_colors 
    ADD CONSTRAINT product_colors_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id);

-- Foreign keys para product_ingredients
ALTER TABLE public.product_ingredients 
    ADD CONSTRAINT product_ingredients_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE public.product_ingredients 
    ADD CONSTRAINT product_ingredients_ingredient_id_fkey 
    FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id);

-- Foreign keys para sale_items
ALTER TABLE public.sale_items 
    ADD CONSTRAINT sale_items_sale_id_fkey 
    FOREIGN KEY (sale_id) REFERENCES public.sales(id);

ALTER TABLE public.sale_items 
    ADD CONSTRAINT sale_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id);

-- Foreign keys para sale_item_notes
ALTER TABLE public.sale_item_notes 
    ADD CONSTRAINT fk_sale_item_notes_sale_id 
    FOREIGN KEY (sale_id) REFERENCES public.sales(id);

ALTER TABLE public.sale_item_notes 
    ADD CONSTRAINT fk_sale_item_notes_product_id 
    FOREIGN KEY (product_id) REFERENCES public.products(id);

-- Foreign keys para sale_payment_methods
ALTER TABLE public.sale_payment_methods 
    ADD CONSTRAINT sale_payment_methods_sale_id_fkey 
    FOREIGN KEY (sale_id) REFERENCES public.sales(id);

-- Foreign keys para sales
ALTER TABLE public.sales 
    ADD CONSTRAINT sales_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- Foreign keys para turno_transacciones
ALTER TABLE public.turno_transacciones 
    ADD CONSTRAINT turno_transacciones_turno_id_fkey 
    FOREIGN KEY (turno_id) REFERENCES public.turnos(id);

-- Foreign keys para transacciones_caja
ALTER TABLE public.transacciones_caja 
    ADD CONSTRAINT transacciones_caja_caja_id_fkey 
    FOREIGN KEY (caja_id) REFERENCES public.cajas(id);

-- =====================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para sales
CREATE INDEX IF NOT EXISTS sales_turno_id_idx ON public.sales(turno_id);
CREATE INDEX IF NOT EXISTS sales_cashier_name_idx ON public.sales(cashier_name);

-- =====================================================
-- 6. STORAGE BUCKETS
-- =====================================================

-- Crear bucket para productos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. FUNCIONES DE LA BASE DE DATOS
-- =====================================================

-- Función para obtener tenant_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(auth.jwt() ->> 'tenant_id', NULL);
$$;

-- Función segura para obtener tenant_id
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id_safe()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    tenant_id_value TEXT;
BEGIN
    SELECT COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'tenant_id',
        current_setting('app.current_tenant_id', true)
    ) INTO tenant_id_value;
    
    IF tenant_id_value IS NULL THEN
        RAISE WARNING 'TENANT_SECURITY_CRITICAL: User % has no tenant_id', auth.uid();
    END IF;
    
    RETURN tenant_id_value;
END;
$$;

-- Función para obtener tenant_id desde auth
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    (SELECT current_setting('app.tenant_id', TRUE))
  );
$$;

-- Función para obtener tenant_id desde auth
CREATE OR REPLACE FUNCTION public.get_tenant_id_from_auth()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT public.get_current_user_tenant_id();
$$;

-- Función para asegurar tenant_id
CREATE OR REPLACE FUNCTION public.ensure_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_auth_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Función para verificar acceso entre tenants
CREATE OR REPLACE FUNCTION public.check_tenant_id_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := auth.jwt() -> 'user_metadata' ->> 'tenant_id';
  ELSIF NEW.tenant_id <> auth.jwt() -> 'user_metadata' ->> 'tenant_id' THEN
    RAISE EXCEPTION 'Cannot assign data to a different tenant than your own';
  END IF;
  RETURN NEW;
END;
$$;

-- Función para actualizar stock después de venta
CREATE OR REPLACE FUNCTION public.update_product_stock_after_sale()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products 
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$;

-- Función para asegurar un solo color por defecto
CREATE OR REPLACE FUNCTION public.ensure_single_default_color()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.product_colors
    SET is_default = false
    WHERE product_id = NEW.product_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Funciones de establecimiento de tenant_id
CREATE OR REPLACE FUNCTION public.set_tenant_id_for_sales()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.tenant_id := public.get_current_user_tenant_id();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_tenant_id_for_sale_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.tenant_id := public.get_current_user_tenant_id();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_tenant_id_for_sale_item_notes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.tenant_id := public.get_current_user_tenant_id();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_tenant_id_for_sale_payment_methods()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := auth.jwt() -> 'user_metadata' ->> 'tenant_id';
  END IF;
  RETURN NEW;
END;
$$;

-- Función de validación estricta de tenant
CREATE OR REPLACE FUNCTION public.validate_tenant_isolation_strict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id TEXT;
    operation_table TEXT;
BEGIN
    current_tenant_id := public.get_current_user_tenant_id_safe();
    operation_table := TG_TABLE_NAME;
    
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'TENANT_SECURITY_ERROR: No tenant context available for % operation on %', 
            TG_OP, operation_table;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        IF operation_table = 'products' THEN
            NEW.tenant_id := current_tenant_id;
            NEW.user_id := auth.uid();
        ELSIF operation_table = 'sales' THEN
            NEW.tenant_id := current_tenant_id;
        ELSIF operation_table = 'sale_items' THEN
            NEW.tenant_id := current_tenant_id;
        ELSIF operation_table = 'sale_payment_methods' THEN
            NEW.tenant_id := current_tenant_id;
        ELSIF operation_table = 'sale_item_notes' THEN
            NEW.tenant_id := current_tenant_id;
        ELSIF operation_table = 'customers' THEN
            NEW.tenant_id := current_tenant_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        IF OLD.tenant_id IS NULL OR OLD.tenant_id != current_tenant_id THEN
            RAISE EXCEPTION 'TENANT_SECURITY_ERROR: Cross-tenant % operation blocked on % - Current: %, Target: %',
                TG_OP, operation_table, current_tenant_id, OLD.tenant_id;
        END IF;
        
        IF TG_OP = 'UPDATE' THEN
            NEW.tenant_id := OLD.tenant_id;
            RETURN NEW;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Función para verificar acceso de métodos de pago
CREATE OR REPLACE FUNCTION public.check_tenant_access_for_sale_payment_methods()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sale_tenant_id TEXT;
BEGIN
  SELECT tenant_id INTO sale_tenant_id
  FROM public.sales
  WHERE id = NEW.sale_id;
  
  IF sale_tenant_id IS NOT NULL AND 
     NEW.tenant_id IS NOT NULL AND 
     sale_tenant_id <> NEW.tenant_id THEN
    RAISE EXCEPTION 'Cannot create payment record for sale from another tenant';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Función para validar consistencia de tenant
CREATE OR REPLACE FUNCTION public.validate_tenant_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sale_tenant_id TEXT;
    product_tenant_id TEXT;
BEGIN
    IF TG_TABLE_NAME = 'sale_items' THEN
        SELECT tenant_id INTO sale_tenant_id 
        FROM sales 
        WHERE id = NEW.sale_id;
        
        SELECT tenant_id INTO product_tenant_id 
        FROM products 
        WHERE id = NEW.product_id;
        
        IF sale_tenant_id IS NULL OR product_tenant_id IS NULL THEN
            RAISE EXCEPTION 'TENANT_SECURITY_ERROR: Missing tenant information: sale_tenant=%, product_tenant=%', 
                sale_tenant_id, product_tenant_id;
        END IF;
        
        IF sale_tenant_id != product_tenant_id THEN
            RAISE EXCEPTION 'TENANT_SECURITY_ERROR: Cannot sell product from tenant % in sale from tenant %', 
                product_tenant_id, sale_tenant_id;
        END IF;
        
        NEW.tenant_id := sale_tenant_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Función para linkear venta a turno activo
CREATE OR REPLACE FUNCTION public.link_sale_to_active_turno()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    active_turno_id UUID;
    has_payment_methods BOOLEAN;
BEGIN
    SELECT id INTO active_turno_id
    FROM turnos
    WHERE tenant_id = NEW.tenant_id
    AND estado = 'abierto'
    ORDER BY fecha_apertura DESC
    LIMIT 1;
    
    IF active_turno_id IS NOT NULL THEN
        NEW.turno_id := active_turno_id;
        
        SELECT EXISTS(
            SELECT 1 FROM sale_payment_methods WHERE sale_id = NEW.id
        ) INTO has_payment_methods;
        
        IF NOT has_payment_methods THEN
            INSERT INTO turno_transacciones (
                turno_id, 
                tipo, 
                monto, 
                metodo_pago, 
                descripcion, 
                venta_id, 
                tenant_id
            ) VALUES (
                active_turno_id,
                'venta',
                NEW.total,
                COALESCE(NEW.payment_method, 'efectivo'),
                'Venta registrada automáticamente',
                NEW.id,
                NEW.tenant_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Función para linkear métodos de pago a turno activo
CREATE OR REPLACE FUNCTION public.link_sale_payment_methods_to_active_turno()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    active_turno_id UUID;
BEGIN
    SELECT id INTO active_turno_id
    FROM turnos
    WHERE tenant_id = NEW.tenant_id
    AND estado = 'abierto'
    ORDER BY fecha_apertura DESC
    LIMIT 1;
    
    IF active_turno_id IS NOT NULL THEN
        INSERT INTO turno_transacciones (
            turno_id, 
            tipo, 
            monto, 
            metodo_pago, 
            descripcion, 
            venta_id, 
            tenant_id
        ) VALUES (
            active_turno_id,
            'venta',
            NEW.amount,
            NEW.payment_method,
            'Venta con pago mixto',
            NEW.sale_id,
            NEW.tenant_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Función para log de eventos de seguridad
CREATE OR REPLACE FUNCTION public.log_tenant_security_event(event_type text, table_name text, tenant_id_current text, tenant_id_attempted text, additional_info jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RAISE WARNING 'TENANT_SECURITY_EVENT: % on % - Current: %, Attempted: %, Info: %', 
        event_type, table_name, tenant_id_current, tenant_id_attempted, additional_info;
END;
$$;

-- Función para obtener ventas aisladas por tenant
CREATE OR REPLACE FUNCTION public.get_tenant_isolated_sales(tenant_id_param text)
RETURNS TABLE(id uuid, date timestamp with time zone, total numeric, payment_method text, sale_type text, status text, tenant_id text, cashier_name text, customer_name text, customer_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.date,
        s.total,
        s.payment_method,
        s.sale_type,
        s.status,
        s.tenant_id,
        s.cashier_name,
        c.name as customer_name,
        c.id as customer_id
    FROM 
        sales s
    LEFT JOIN 
        customers c ON s.customer_id = c.id AND c.tenant_id = tenant_id_param
    WHERE 
        s.tenant_id = tenant_id_param
    ORDER BY 
        s.date DESC;
END;
$$;

-- Función para contar ventas por tenant
CREATE OR REPLACE FUNCTION public.count_tenant_sales(tenant_id_param text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM sales
    WHERE tenant_id = tenant_id_param;
    
    RETURN total_count;
END;
$$;

-- Función para obtener datos de recibo aislados
CREATE OR REPLACE FUNCTION public.get_isolated_receipt_data(sale_id_param uuid, tenant_id_param text)
RETURNS TABLE(sale_id uuid, date timestamp with time zone, total numeric, payment_method text, sale_type text, customer_name text, cashier_name text, item_id uuid, product_id uuid, product_name text, price numeric, quantity numeric, notes text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sales 
        WHERE id = sale_id_param AND tenant_id = tenant_id_param
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        s.id as sale_id,
        s.date,
        s.total,
        s.payment_method,
        s.sale_type,
        c.name as customer_name,
        s.cashier_name,
        si.id as item_id,
        si.product_id,
        p.name as product_name,
        si.price,
        si.quantity,
        (
            SELECT string_agg(note, ', ')
            FROM sale_item_notes sin
            WHERE sin.sale_id = s.id AND sin.product_id = si.product_id
            AND sin.tenant_id = tenant_id_param
        ) as notes
    FROM 
        sales s
    LEFT JOIN 
        customers c ON s.customer_id = c.id AND c.tenant_id = tenant_id_param
    JOIN
        sale_items si ON s.id = si.sale_id AND si.tenant_id = tenant_id_param
    LEFT JOIN
        products p ON si.product_id = p.id AND p.tenant_id = tenant_id_param
    WHERE 
        s.id = sale_id_param
        AND s.tenant_id = tenant_id_param;
END;
$$;

-- Función para obtener ventas con detalles
CREATE OR REPLACE FUNCTION public.get_sales_with_details(tenant_id_param text, limit_param integer DEFAULT NULL::integer, offset_param integer DEFAULT 0)
RETURNS TABLE(id uuid, date timestamp with time zone, total numeric, payment_method text, sale_type text, status text, tenant_id text, cashier_name text, customer_name text, customer_id uuid, mixed_payment_details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH sales_data AS (
        SELECT 
            s.id,
            s.date,
            s.total,
            s.payment_method,
            s.sale_type,
            s.status,
            s.tenant_id,
            s.cashier_name,
            c.name as customer_name,
            c.id as customer_id
        FROM 
            sales s
        LEFT JOIN 
            customers c ON s.customer_id = c.id AND c.tenant_id = tenant_id_param
        WHERE 
            s.tenant_id = tenant_id_param
        ORDER BY 
            s.date DESC
        LIMIT 
            CASE WHEN limit_param IS NULL THEN NULL ELSE limit_param END
        OFFSET
            offset_param
    )
    SELECT 
        sd.*,
        (
            SELECT 
                COALESCE(jsonb_agg(jsonb_build_object(
                    'payment_method', spm.payment_method,
                    'amount', spm.amount
                )), '[]'::jsonb)
            FROM 
                sale_payment_methods spm
            WHERE 
                spm.sale_id = sd.id
                AND spm.tenant_id = tenant_id_param
        ) as mixed_payment_details
    FROM 
        sales_data sd;
END;
$$;

-- Función para obtener ventas por cajero
CREATE OR REPLACE FUNCTION public.get_sales_by_cashier(cashier_name_param text, tenant_id_param text, start_date_param timestamp with time zone DEFAULT NULL::timestamp with time zone, end_date_param timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS TABLE(id uuid, total numeric, date timestamp with time zone, payment_method text, sale_type text, status text)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.total, s.date, s.payment_method, s.sale_type, s.status
    FROM sales s
    WHERE s.tenant_id = tenant_id_param
    AND s.cashier_name = cashier_name_param
    AND (start_date_param IS NULL OR s.date >= start_date_param)
    AND (end_date_param IS NULL OR s.date <= end_date_param)
    ORDER BY s.date DESC;
END;
$$;

-- Función para resumen de ventas por cajero
CREATE OR REPLACE FUNCTION public.get_cashier_sales_summary(cashier_name_param text, tenant_id_param text, start_date_param timestamp with time zone DEFAULT NULL::timestamp with time zone, end_date_param timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS TABLE(payment_method text, total_amount numeric, sale_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.payment_method, 'efectivo') as payment_method,
        SUM(s.total) as total_amount,
        COUNT(s.id) as sale_count
    FROM sales s
    WHERE s.tenant_id = tenant_id_param
    AND s.cashier_name = cashier_name_param
    AND (start_date_param IS NULL OR s.date >= start_date_param)
    AND (end_date_param IS NULL OR s.date <= end_date_param)
    GROUP BY COALESCE(s.payment_method, 'efectivo')
    ORDER BY total_amount DESC;
END;
$$;

-- Función para obtener ventas por método de pago
CREATE OR REPLACE FUNCTION public.get_sales_by_payment_method(tenant_id_param text, start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, end_date timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS TABLE(payment_method text, total numeric, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH regular_sales AS (
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
        SUM(c.count)::bigint AS count
    FROM combined c
    GROUP BY c.payment_method
    ORDER BY c.payment_method;
END;
$$;

-- Función para obtener ventas de turno por método de pago
CREATE OR REPLACE FUNCTION public.get_turno_sales_by_payment_method(turno_id_param uuid)
RETURNS TABLE(payment_method text, total numeric, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH regular_sales AS (
        SELECT 
            COALESCE(payment_method, 'cash') AS payment_method,
            total,
            1 AS count
        FROM sales
        WHERE turno_id = turno_id_param
        AND (payment_method IS NOT NULL) 
        AND status = 'completed'
        AND NOT EXISTS (
            SELECT 1 FROM sale_payment_methods 
            WHERE sale_payment_methods.sale_id = sales.id
        )
    ), mixed_sales AS (
        SELECT 
            payment_method,
            amount AS total,
            1 AS count
        FROM sale_payment_methods spm
        JOIN sales s ON spm.sale_id = s.id
        WHERE s.turno_id = turno_id_param
        AND s.status = 'completed'
    ), combined AS (
        SELECT * FROM regular_sales
        UNION ALL
        SELECT * FROM mixed_sales
    )
    SELECT 
        payment_method,
        SUM(total) AS total,
        SUM(count) AS count
    FROM combined
    GROUP BY payment_method
    ORDER BY payment_method;
END;
$$;

-- Función detallada para turnos
CREATE OR REPLACE FUNCTION public.get_turno_sales_by_payment_method_detailed(turno_id_param uuid)
RETURNS TABLE(payment_method text, total numeric, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH regular_sales AS (
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

-- Función para validar consistencia de datos
CREATE OR REPLACE FUNCTION public.validate_tenant_data_consistency()
RETURNS TABLE(table_name text, issue_type text, record_count bigint, details text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'products'::TEXT,
        'MISSING_TENANT_ID'::TEXT,
        COUNT(*)::BIGINT,
        'Products without tenant_id'::TEXT
    FROM products 
    WHERE tenant_id IS NULL;
    
    RETURN QUERY
    SELECT 
        'sales'::TEXT,
        'MISSING_TENANT_ID'::TEXT,
        COUNT(*)::BIGINT,
        'Sales without tenant_id'::TEXT
    FROM sales 
    WHERE tenant_id IS NULL;
    
    RETURN QUERY
    SELECT 
        'sale_items'::TEXT,
        'INCONSISTENT_TENANT_ID'::TEXT,
        COUNT(*)::BIGINT,
        'Sale items with different tenant_id than parent sale'::TEXT
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE si.tenant_id != s.tenant_id;
    
    RETURN QUERY
    SELECT 
        'cross_tenant_sales'::TEXT,
        'SECURITY_VIOLATION'::TEXT,
        COUNT(*)::BIGINT,
        'Products sold across different tenants'::TEXT
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.tenant_id != p.tenant_id;
END;
$$;

-- Funciones para categorías de productos
CREATE OR REPLACE FUNCTION public.get_product_categories(tenant_id_param text)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
  categories TEXT[];
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_categories'
  ) THEN
    SELECT ARRAY_AGG(name) INTO categories FROM product_categories 
    WHERE tenant_id = tenant_id_param;
    
    RETURN categories;
  ELSE
    RETURN ARRAY[]::TEXT[];
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_product_category(category_name text, tenant_id_param text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_categories'
  ) THEN
    CREATE TABLE public.product_categories (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
  
  INSERT INTO product_categories (name, tenant_id)
  VALUES (category_name, tenant_id_param);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Función para asegurar distribución de pagos mixtos
CREATE OR REPLACE FUNCTION public.ensure_mixed_payment_distribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.payment_method = 'mixed' AND TG_OP = 'INSERT' THEN
        IF NOT EXISTS (SELECT 1 FROM sale_payment_methods WHERE sale_id = NEW.id) THEN
            INSERT INTO sale_payment_methods (sale_id, payment_method, amount, tenant_id)
            VALUES (NEW.id, 'cash', NEW.total, NEW.tenant_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger para actualizar stock después de venta
DROP TRIGGER IF EXISTS update_product_stock_trigger ON public.sale_items;
CREATE TRIGGER update_product_stock_trigger
    AFTER INSERT ON public.sale_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_stock_after_sale();

-- Trigger para asegurar un solo color por defecto
DROP TRIGGER IF EXISTS ensure_single_default_color_trigger ON public.product_colors;
CREATE TRIGGER ensure_single_default_color_trigger
    BEFORE INSERT OR UPDATE ON public.product_colors
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_default_color();

-- Trigger para linkear venta a turno activo
DROP TRIGGER IF EXISTS link_sale_to_turno_trigger ON public.sales;
CREATE TRIGGER link_sale_to_turno_trigger
    BEFORE INSERT ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.link_sale_to_active_turno();

-- Trigger para linkear métodos de pago a turno activo
DROP TRIGGER IF EXISTS link_payment_methods_to_turno_trigger ON public.sale_payment_methods;
CREATE TRIGGER link_payment_methods_to_turno_trigger
    AFTER INSERT ON public.sale_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.link_sale_payment_methods_to_active_turno();

-- Trigger para asegurar distribución de pagos mixtos
DROP TRIGGER IF EXISTS ensure_mixed_payment_distribution_trigger ON public.sales;
CREATE TRIGGER ensure_mixed_payment_distribution_trigger
    AFTER INSERT ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_mixed_payment_distribution();

-- Triggers de validación estricta de tenant
DROP TRIGGER IF EXISTS validate_tenant_isolation_strict_trigger ON public.products;
CREATE TRIGGER validate_tenant_isolation_strict_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_tenant_isolation_strict();

DROP TRIGGER IF EXISTS validate_tenant_isolation_strict_trigger ON public.sales;
CREATE TRIGGER validate_tenant_isolation_strict_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_tenant_isolation_strict();

DROP TRIGGER IF EXISTS validate_tenant_isolation_strict_trigger ON public.sale_items;
CREATE TRIGGER validate_tenant_isolation_strict_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.sale_items
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_tenant_isolation_strict();

DROP TRIGGER IF EXISTS validate_tenant_isolation_strict_trigger ON public.sale_payment_methods;
CREATE TRIGGER validate_tenant_isolation_strict_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.sale_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_tenant_isolation_strict();

DROP TRIGGER IF EXISTS validate_tenant_isolation_strict_trigger ON public.sale_item_notes;
CREATE TRIGGER validate_tenant_isolation_strict_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.sale_item_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_tenant_isolation_strict();

DROP TRIGGER IF EXISTS validate_tenant_isolation_strict_trigger ON public.customers;
CREATE TRIGGER validate_tenant_isolation_strict_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_tenant_isolation_strict();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashier_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_item_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turno_transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones_caja ENABLE ROW LEVEL SECURITY;

-- Políticas RLS principales (aislamiento por tenant)

-- Products
DROP POLICY IF EXISTS "STRICT: Products tenant isolation" ON public.products;
CREATE POLICY "STRICT: Products tenant isolation" ON public.products
FOR ALL TO authenticated
USING (tenant_id = get_current_user_tenant_id_safe())
WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Sales
DROP POLICY IF EXISTS "STRICT: Sales tenant isolation" ON public.sales;
CREATE POLICY "STRICT: Sales tenant isolation" ON public.sales
FOR ALL TO authenticated
USING (tenant_id = get_current_user_tenant_id_safe())
WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Sale Items
DROP POLICY IF EXISTS "STRICT: Sale items tenant isolation" ON public.sale_items;
CREATE POLICY "STRICT: Sale items tenant isolation" ON public.sale_items
FOR ALL TO authenticated
USING (tenant_id = get_current_user_tenant_id_safe())
WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Sale Item Notes
DROP POLICY IF EXISTS "STRICT: Sale item notes tenant isolation" ON public.sale_item_notes;
CREATE POLICY "STRICT: Sale item notes tenant isolation" ON public.sale_item_notes
FOR ALL TO authenticated
USING (tenant_id = get_current_user_tenant_id_safe())
WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Sale Payment Methods
DROP POLICY IF EXISTS "STRICT: Sale payment methods tenant isolation" ON public.sale_payment_methods;
CREATE POLICY "STRICT: Sale payment methods tenant isolation" ON public.sale_payment_methods
FOR ALL TO authenticated
USING (tenant_id = get_current_user_tenant_id_safe())
WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Customers
DROP POLICY IF EXISTS "Tenant isolation for customers" ON public.customers;
CREATE POLICY "Tenant isolation for customers" ON public.customers
FOR ALL TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id'))
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id'));

-- Cashiers
DROP POLICY IF EXISTS "Cashiers: Tenant access" ON public.cashiers;
CREATE POLICY "Cashiers: Tenant access" ON public.cashiers
FOR ALL TO authenticated
USING (tenant_id = ((auth.jwt() -> 'user_metadata') ->> 'tenant_id'))
WITH CHECK (tenant_id = ((auth.jwt() -> 'user_metadata') ->> 'tenant_id'));

-- Turnos
DROP POLICY IF EXISTS "Turnos: Tenant access" ON public.turnos;
CREATE POLICY "Turnos: Tenant access" ON public.turnos
FOR ALL TO authenticated
USING (tenant_id = ((auth.jwt() -> 'user_metadata') ->> 'tenant_id'))
WITH CHECK (tenant_id = ((auth.jwt() -> 'user_metadata') ->> 'tenant_id'));

-- Turno Transacciones
DROP POLICY IF EXISTS "Turno Transacciones: Tenant access" ON public.turno_transacciones;
CREATE POLICY "Turno Transacciones: Tenant access" ON public.turno_transacciones
FOR ALL TO authenticated
USING (tenant_id = ((auth.jwt() -> 'user_metadata') ->> 'tenant_id'))
WITH CHECK (tenant_id = ((auth.jwt() -> 'user_metadata') ->> 'tenant_id'));

-- Cajas
DROP POLICY IF EXISTS "Cajas: Tenant access" ON public.cajas;
CREATE POLICY "Cajas: Tenant access" ON public.cajas
FOR ALL TO authenticated
USING ((tenant_id = COALESCE(((auth.jwt() -> 'user_metadata') ->> 'tenant_id'), '')) OR (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin'))
WITH CHECK ((tenant_id = COALESCE(((auth.jwt() -> 'user_metadata') ->> 'tenant_id'), '')) OR (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin'));

-- Transacciones Caja
DROP POLICY IF EXISTS "Transacciones caja: Tenant access" ON public.transacciones_caja;
CREATE POLICY "Transacciones caja: Tenant access" ON public.transacciones_caja
FOR ALL TO authenticated
USING ((tenant_id = COALESCE(((auth.jwt() -> 'user_metadata') ->> 'tenant_id'), '')) OR (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin'))
WITH CHECK ((tenant_id = COALESCE(((auth.jwt() -> 'user_metadata') ->> 'tenant_id'), '')) OR (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin'));

-- Cashier Pins
DROP POLICY IF EXISTS "Administradores pueden ver los PINs" ON public.cashier_pins;
CREATE POLICY "Administradores pueden ver los PINs" ON public.cashier_pins
FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Administradores pueden crear PINs" ON public.cashier_pins;
CREATE POLICY "Administradores pueden crear PINs" ON public.cashier_pins
FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Administradores pueden actualizar PINs" ON public.cashier_pins;
CREATE POLICY "Administradores pueden actualizar PINs" ON public.cashier_pins
FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Administradores pueden eliminar PINs" ON public.cashier_pins;
CREATE POLICY "Administradores pueden eliminar PINs" ON public.cashier_pins
FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- Ingredients
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.ingredients;
CREATE POLICY "Enable read for authenticated users" ON public.ingredients
FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.ingredients;
CREATE POLICY "Enable insert for authenticated users" ON public.ingredients
FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.ingredients;
CREATE POLICY "Enable update for authenticated users" ON public.ingredients
FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.ingredients;
CREATE POLICY "Enable delete for authenticated users" ON public.ingredients
FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- Ingredient Transactions
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.ingredient_transactions;
CREATE POLICY "Enable read for authenticated users" ON public.ingredient_transactions
FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.ingredient_transactions;
CREATE POLICY "Enable insert for authenticated users" ON public.ingredient_transactions
FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.ingredient_transactions;
CREATE POLICY "Enable update for authenticated users" ON public.ingredient_transactions
FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.ingredient_transactions;
CREATE POLICY "Enable delete for authenticated users" ON public.ingredient_transactions
FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- Product Ingredients
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.product_ingredients;
CREATE POLICY "Enable read for authenticated users" ON public.product_ingredients
FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.product_ingredients;
CREATE POLICY "Enable insert for authenticated users" ON public.product_ingredients
FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.product_ingredients;
CREATE POLICY "Enable update for authenticated users" ON public.product_ingredients
FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.product_ingredients;
CREATE POLICY "Enable delete for authenticated users" ON public.product_ingredients
FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- Product Colors
DROP POLICY IF EXISTS "Users can manage their own product colors" ON public.product_colors;
CREATE POLICY "Users can manage their own product colors" ON public.product_colors
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Preparations
DROP POLICY IF EXISTS "Users can view all preparations" ON public.preparations;
CREATE POLICY "Users can view all preparations" ON public.preparations
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert preparations" ON public.preparations;
CREATE POLICY "Users can insert preparations" ON public.preparations
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update preparations" ON public.preparations;
CREATE POLICY "Users can update preparations" ON public.preparations
FOR UPDATE TO authenticated
USING (true);

-- =====================================================
-- 10. STORAGE POLICIES
-- =====================================================

-- Políticas para el bucket de productos
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE 'Tablas creadas: %, Funciones: %, Políticas RLS: %, Triggers: %', 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'),
        (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public'),
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
        (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public');
END $$;