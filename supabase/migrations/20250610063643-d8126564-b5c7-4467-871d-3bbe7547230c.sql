
-- Create barber commissions table
CREATE TABLE IF NOT EXISTS public.barber_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barber_id TEXT NOT NULL,
  barber_name TEXT,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  service_id TEXT,
  category_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on barber_commissions table
ALTER TABLE public.barber_commissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for barber_commissions
CREATE POLICY "Users can view their own barber commissions" 
ON public.barber_commissions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own barber commissions" 
ON public.barber_commissions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own barber commissions" 
ON public.barber_commissions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own barber commissions" 
ON public.barber_commissions FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger to update updated_at column
CREATE OR REPLACE TRIGGER update_barber_commissions_updated_at
  BEFORE UPDATE ON public.barber_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
