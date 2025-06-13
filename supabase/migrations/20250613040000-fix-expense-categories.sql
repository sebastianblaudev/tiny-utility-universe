
-- Add CHECK constraint for valid expense categories
ALTER TABLE public.operational_expenses 
ADD CONSTRAINT IF NOT EXISTS valid_expense_categories 
CHECK (category IN ('rent', 'utilities', 'supplies', 'wages', 'maintenance', 'marketing', 'other'));

-- Update any existing invalid categories to 'other'
UPDATE public.operational_expenses 
SET category = 'other' 
WHERE category NOT IN ('rent', 'utilities', 'supplies', 'wages', 'maintenance', 'marketing', 'other');
