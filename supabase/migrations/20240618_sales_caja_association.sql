
-- Migration to ensure sales table has caja_id and payment_method fields
BEGIN;

-- Make sure the sales table has a caja_id column for association with cash registers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sales'
        AND column_name = 'caja_id'
    ) THEN
        ALTER TABLE sales ADD COLUMN caja_id UUID REFERENCES cajas(id) NULL;
    END IF;
END $$;

-- Make sure the sales table has a payment_method column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sales'
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE sales ADD COLUMN payment_method TEXT NULL;
    END IF;
END $$;

-- Make sure the sales table has a cashier_name column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sales'
        AND column_name = 'cashier_name'
    ) THEN
        ALTER TABLE sales ADD COLUMN cashier_name TEXT NULL;
    END IF;
END $$;

-- Create an index for faster querying of sales by caja_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'sales'
        AND indexname = 'sales_caja_id_idx'
    ) THEN
        CREATE INDEX sales_caja_id_idx ON sales(caja_id);
    END IF;
END $$;

-- Create an index for faster querying of sales by payment_method
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'sales'
        AND indexname = 'sales_payment_method_idx'
    ) THEN
        CREATE INDEX sales_payment_method_idx ON sales(payment_method);
    END IF;
END $$;

-- Create policy for users to access sales related to their tenant
CREATE POLICY IF NOT EXISTS "Users can view sales related to their tenant" ON sales
FOR SELECT TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth.uid() = id) OR
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
);

-- Ensure the cajas table exists with necessary structure
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'cajas'
    ) THEN
        CREATE TABLE cajas (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            estado TEXT NOT NULL,
            fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            fecha_cierre TIMESTAMPTZ NULL,
            monto_inicial NUMERIC(10,2) NOT NULL,
            monto_final NUMERIC(10,2) NULL,
            nombre_cajero TEXT NOT NULL,
            tenant_id UUID NOT NULL,
            observaciones TEXT NULL
        );
        
        -- Add RLS policies for cajas
        ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view cajas related to their tenant" ON cajas
        FOR SELECT TO authenticated
        USING (
            tenant_id = (SELECT tenant_id FROM users WHERE auth.uid() = id) OR
            tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
        );
        
        CREATE POLICY "Users can insert cajas for their tenant" ON cajas
        FOR INSERT TO authenticated
        WITH CHECK (
            tenant_id = (SELECT tenant_id FROM users WHERE auth.uid() = id) OR
            tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
        );
        
        CREATE POLICY "Users can update cajas for their tenant" ON cajas
        FOR UPDATE TO authenticated
        USING (
            tenant_id = (SELECT tenant_id FROM users WHERE auth.uid() = id) OR
            tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
        )
        WITH CHECK (
            tenant_id = (SELECT tenant_id FROM users WHERE auth.uid() = id) OR
            tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
        );
    END IF;
END $$;

-- Ensure the transacciones_caja table exists for recording cash movements
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'transacciones_caja'
    ) THEN
        CREATE TABLE transacciones_caja (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            caja_id UUID NOT NULL REFERENCES cajas(id),
            tipo TEXT NOT NULL,
            monto NUMERIC(10,2) NOT NULL,
            metodo_pago TEXT NOT NULL,
            descripcion TEXT NULL,
            fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            tenant_id UUID NOT NULL
        );
        
        -- Add RLS policies for transacciones_caja
        ALTER TABLE transacciones_caja ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view transactions related to their tenant" ON transacciones_caja
        FOR SELECT TO authenticated
        USING (
            tenant_id = (SELECT tenant_id FROM users WHERE auth.uid() = id) OR
            tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
        );
        
        CREATE POLICY "Users can insert transactions for their tenant" ON transacciones_caja
        FOR INSERT TO authenticated
        WITH CHECK (
            tenant_id = (SELECT tenant_id FROM users WHERE auth.uid() = id) OR
            tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
        );
    END IF;
END $$;

COMMIT;
