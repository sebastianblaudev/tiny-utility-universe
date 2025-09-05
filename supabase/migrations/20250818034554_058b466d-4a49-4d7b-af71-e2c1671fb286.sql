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