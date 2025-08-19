-- Add columns to settings table for receipt configuration
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS receipt_footer TEXT DEFAULT 'Gracias por su compra',
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_phone TEXT;

-- Update existing settings to use receipt_header as receipt_footer if empty
UPDATE public.settings 
SET receipt_footer = COALESCE(receipt_header, 'Gracias por su compra')
WHERE receipt_footer IS NULL;