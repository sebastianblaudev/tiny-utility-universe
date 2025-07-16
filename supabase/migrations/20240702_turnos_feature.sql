
-- Migration for the Turnos feature
BEGIN;

-- Create turnos (shifts) table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'turnos'
    ) THEN
        CREATE TABLE turnos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            fecha_cierre TIMESTAMPTZ NULL,
            monto_inicial NUMERIC(10,2) NOT NULL DEFAULT 0,
            monto_final NUMERIC(10,2) NULL,
            estado TEXT NOT NULL DEFAULT 'abierto',
            cajero_id TEXT NULL,
            cajero_nombre TEXT NOT NULL,
            observaciones TEXT NULL,
            tenant_id TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Add RLS policies
        ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Turnos: Tenant access" ON turnos
            USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id')
            WITH CHECK (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');
    END IF;
END $$;

-- Create turno_transacciones table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'turno_transacciones'
    ) THEN
        CREATE TABLE turno_transacciones (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            turno_id UUID NOT NULL REFERENCES turnos(id),
            tipo TEXT NOT NULL,
            monto NUMERIC(10,2) NOT NULL,
            metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
            descripcion TEXT NULL,
            fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            venta_id UUID NULL,
            tenant_id TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Add RLS policies
        ALTER TABLE turno_transacciones ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Turno Transacciones: Tenant access" ON turno_transacciones
            USING (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id')
            WITH CHECK (tenant_id = auth.jwt() -> 'user_metadata' ->> 'tenant_id');
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_turnos_tenant_id ON turnos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);
CREATE INDEX IF NOT EXISTS idx_turno_transacciones_turno_id ON turno_transacciones(turno_id);
CREATE INDEX IF NOT EXISTS idx_turno_transacciones_tenant_id ON turno_transacciones(tenant_id);

COMMIT;
