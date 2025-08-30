-- Create table to track order sequences by year-month
CREATE TABLE public.order_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  year_month TEXT NOT NULL, -- Format: YYYYMM (e.g., "202506")
  last_sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, year_month)
);

-- Enable RLS
ALTER TABLE public.order_sequences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Order sequences: Tenant isolation" 
ON public.order_sequences 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id_safe())
WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Add order_number column to sales table
ALTER TABLE public.sales 
ADD COLUMN order_number TEXT;

-- Create function to generate next order number
CREATE OR REPLACE FUNCTION public.generate_order_number(tenant_id_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_year_month TEXT;
    next_sequence INTEGER;
    order_number TEXT;
BEGIN
    -- Get current year-month in YYYYMM format
    current_year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Insert or update the sequence for this year-month
    INSERT INTO public.order_sequences (tenant_id, year_month, last_sequence)
    VALUES (tenant_id_param, current_year_month, 1)
    ON CONFLICT (tenant_id, year_month)
    DO UPDATE SET 
        last_sequence = order_sequences.last_sequence + 1,
        updated_at = NOW()
    RETURNING last_sequence INTO next_sequence;
    
    -- Format the order number as YYYYMM-NNN
    order_number := current_year_month || '-' || LPAD(next_sequence::TEXT, 3, '0');
    
    RETURN order_number;
END;
$$;

-- Create trigger to auto-assign order numbers to new sales
CREATE OR REPLACE FUNCTION public.assign_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only assign order number if not already set
    IF NEW.order_number IS NULL THEN
        NEW.order_number := public.generate_order_number(NEW.tenant_id);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on sales table
CREATE TRIGGER assign_order_number_trigger
    BEFORE INSERT ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_order_number();

-- Update existing sales with order numbers (optional - for existing data)
-- This will assign sequential numbers to existing sales based on their date
DO $$
DECLARE
    sale_record RECORD;
    tenant_record RECORD;
    year_month TEXT;
    sequence_num INTEGER;
BEGIN
    -- Loop through each tenant
    FOR tenant_record IN 
        SELECT DISTINCT tenant_id 
        FROM public.sales 
        WHERE order_number IS NULL AND tenant_id IS NOT NULL
    LOOP
        -- Reset sequence for each tenant
        sequence_num := 0;
        
        -- Loop through sales for this tenant, ordered by date
        FOR sale_record IN 
            SELECT id, date, tenant_id
            FROM public.sales 
            WHERE tenant_id = tenant_record.tenant_id 
            AND order_number IS NULL
            ORDER BY date ASC
        LOOP
            -- Get year-month for this sale
            year_month := TO_CHAR(sale_record.date, 'YYYYMM');
            
            -- Increment sequence
            sequence_num := sequence_num + 1;
            
            -- Update the sale with order number
            UPDATE public.sales 
            SET order_number = year_month || '-' || LPAD(sequence_num::TEXT, 3, '0')
            WHERE id = sale_record.id;
            
            -- Update or insert the sequence tracker
            INSERT INTO public.order_sequences (tenant_id, year_month, last_sequence)
            VALUES (tenant_record.tenant_id, year_month, sequence_num)
            ON CONFLICT (tenant_id, year_month)
            DO UPDATE SET 
                last_sequence = GREATEST(order_sequences.last_sequence, sequence_num),
                updated_at = NOW();
        END LOOP;
    END LOOP;
END;
$$;