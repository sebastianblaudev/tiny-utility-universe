-- Add is_by_weight and unit columns to products table if they don't exist
DO $$
BEGIN
    -- Add is_by_weight column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_by_weight'
    ) THEN
        ALTER TABLE public.products ADD COLUMN is_by_weight BOOLEAN DEFAULT false;
    END IF;
    
    -- Add unit column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'unit'
    ) THEN
        ALTER TABLE public.products ADD COLUMN unit TEXT DEFAULT 'unidad';
    END IF;
END $$;

-- Create some example weight-based products for testing
INSERT INTO public.products (name, price, category, is_by_weight, unit, tenant_id, user_id) 
VALUES 
    ('Manzanas', 2500, 'Frutas', true, 'kg', auth.jwt() -> 'user_metadata' ->> 'tenant_id', auth.uid()),
    ('Plátanos', 1800, 'Frutas', true, 'kg', auth.jwt() -> 'user_metadata' ->> 'tenant_id', auth.uid()),
    ('Carne molida', 8900, 'Carnes', true, 'kg', auth.jwt() -> 'user_metadata' ->> 'tenant_id', auth.uid())
ON CONFLICT (name, tenant_id) DO NOTHING;