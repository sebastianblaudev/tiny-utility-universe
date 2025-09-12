# Estrategia de Migración a Nueva Base de Datos Supabase

## Resumen de Datos Actuales
- **Ventas**: 15,022 registros
- **Productos**: 5,317 registros  
- **Clientes**: 102 registros
- **Múltiples tablas**: cajas, cashiers, turnos, mesas, etc.

## Pasos de Migración Segura

### 1. Preparación de la Nueva Base de Datos

#### Paso 1.1: Crear el esquema completo
```sql
-- Ejecutar en la nueva base de datos Supabase
-- Este script recreará toda la estructura

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tipos ENUM
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Tabla: businesses
CREATE TABLE public.businesses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    currency TEXT DEFAULT 'CLP',
    timezone TEXT DEFAULT 'America/Santiago',
    tax_rate NUMERIC DEFAULT 19,
    receipt_footer TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: products
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    price NUMERIC NOT NULL,
    cost_price NUMERIC NOT NULL,
    stock NUMERIC NOT NULL DEFAULT 0,
    category TEXT,
    image_url TEXT,
    color TEXT,
    unit TEXT DEFAULT 'kg',
    is_by_weight BOOLEAN DEFAULT false,
    is_weight_based BOOLEAN DEFAULT false,
    tenant_id TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla: customers
CREATE TABLE public.customers (
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

-- Tabla: sales
CREATE TABLE public.sales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    total NUMERIC NOT NULL,
    payment_method TEXT,
    sale_type TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    cashier_name TEXT,
    customer_id UUID,
    tenant_id TEXT,
    turno_id UUID,
    order_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla: sale_items
CREATE TABLE public.sale_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    weight NUMERIC,
    unit TEXT,
    is_by_weight BOOLEAN DEFAULT false,
    tenant_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Continuar con el resto de tablas...
-- [Incluir todas las demás tablas del esquema actual]
```

#### Paso 1.2: Crear funciones de sistema
```sql
-- Funciones críticas para el funcionamiento

CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id_safe()
RETURNS TEXT
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

-- [Incluir todas las funciones del esquema actual]
```

#### Paso 1.3: Configurar RLS
```sql
-- Habilitar Row Level Security en todas las tablas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
-- [Continuar con todas las tablas]

-- Crear políticas RLS
CREATE POLICY "STRICT: Products tenant isolation" 
ON public.products 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id_safe())
WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- [Incluir todas las políticas RLS actuales]
```

### 2. Migración de Datos

#### Paso 2.1: Exportar datos de la base actual
```bash
# Ejecutar desde la base de datos actual
# Exportar por bloques para evitar timeouts

-- Exportar productos
COPY (SELECT * FROM products ORDER BY created_at) TO '/tmp/products_export.csv' WITH CSV HEADER;

-- Exportar clientes
COPY (SELECT * FROM customers ORDER BY created_at) TO '/tmp/customers_export.csv' WITH CSV HEADER;

-- Exportar ventas (por lotes de fechas)
COPY (SELECT * FROM sales WHERE date >= '2024-01-01' AND date < '2024-07-01' ORDER BY date) TO '/tmp/sales_2024_h1.csv' WITH CSV HEADER;

COPY (SELECT * FROM sales WHERE date >= '2024-07-01' ORDER BY date) TO '/tmp/sales_2024_h2.csv' WITH CSV HEADER;

-- Exportar items de ventas
COPY (SELECT * FROM sale_items ORDER BY created_at) TO '/tmp/sale_items_export.csv' WITH CSV HEADER;
```

#### Paso 2.2: Importar datos a la nueva base
```sql
-- En la nueva base de datos
-- Deshabilitar temporalmente los triggers para la importación

-- Importar productos
COPY products FROM '/tmp/products_export.csv' WITH CSV HEADER;

-- Importar clientes
COPY customers FROM '/tmp/customers_export.csv' WITH CSV HEADER;

-- Importar ventas
COPY sales FROM '/tmp/sales_2024_h1.csv' WITH CSV HEADER;
COPY sales FROM '/tmp/sales_2024_h2.csv' WITH CSV HEADER;

-- Importar items de ventas
COPY sale_items FROM '/tmp/sale_items_export.csv' WITH CSV HEADER;
```

### 3. Configuración de la Aplicación

#### Paso 3.1: Crear archivo de configuración dual
```typescript
// src/config/database.ts
export const DATABASE_CONFIG = {
  // Nueva base de datos (producción)
  production: {
    url: "https://NUEVA-URL.supabase.co",
    anonKey: "NUEVA-ANON-KEY"
  },
  // Base actual (respaldo)
  fallback: {
    url: "https://sutftjxaiirivuxbttow.supabase.co", 
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
};
```

#### Paso 3.2: Implementar cliente dual
```typescript
// src/integrations/supabase/dual-client.ts
import { createClient } from '@supabase/supabase-js';
import { DATABASE_CONFIG } from '@/config/database';

const primaryClient = createClient(
  DATABASE_CONFIG.production.url,
  DATABASE_CONFIG.production.anonKey
);

const fallbackClient = createClient(
  DATABASE_CONFIG.fallback.url,
  DATABASE_CONFIG.fallback.anonKey
);

export { primaryClient as supabase, fallbackClient };
```

### 4. Plan de Cambio Gradual

#### Fase 1: Preparación (Sin impacto)
- [ ] Crear nueva base de datos
- [ ] Migrar esquema y funciones
- [ ] Probar conectividad

#### Fase 2: Migración de datos (Sin impacto)
- [ ] Exportar datos actuales
- [ ] Importar a nueva base
- [ ] Verificar integridad de datos

#### Fase 3: Implementación dual (Respaldo activo)
- [ ] Implementar cliente dual
- [ ] Configurar sincronización bidireccional
- [ ] Monitorear funcionamiento

#### Fase 4: Cambio final (Mínimo impacto)
- [ ] Cambiar configuración a nueva base
- [ ] Mantener fallback activo 24h
- [ ] Desactivar base anterior

### 5. Scripts de Verificación

#### Verificar integridad de datos
```sql
-- Comparar conteos entre bases
SELECT 
  'products' as tabla,
  COUNT(*) as registros_nueva,
  (SELECT COUNT(*) FROM productos_old) as registros_anterior
FROM products
UNION ALL
SELECT 
  'sales' as tabla,
  COUNT(*) as registros_nueva, 
  (SELECT COUNT(*) FROM sales_old) as registros_anterior
FROM sales;
```

### 6. Plan de Rollback

Si algo falla durante la migración:

1. **Rollback inmediato**: Cambiar URLs en `src/integrations/supabase/client.ts`
2. **Rollback con datos**: Activar cliente fallback automáticamente
3. **Recuperación completa**: Restaurar desde backup de la base anterior

## Cronograma Sugerido

- **Día 1**: Preparar nueva base y migrar esquema
- **Día 2**: Migrar datos y verificar
- **Día 3**: Implementar sistema dual
- **Día 4**: Cambio gradual con monitoreo
- **Día 5**: Finalización y limpieza

## Contacto y Soporte

Durante la migración, mantener:
- Backup completo de base actual
- Logs detallados de cada paso
- Plan de comunicación con usuarios
- Monitoreo continuo de errores