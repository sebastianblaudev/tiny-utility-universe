-- Create page_locks table for remote control
CREATE TABLE public.page_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  page_route TEXT NOT NULL,
  page_name TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_by TEXT, -- owner who locked it
  locked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, page_route)
);

-- Enable RLS
ALTER TABLE public.page_locks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY "STRICT: Page locks tenant isolation" 
ON public.page_locks 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id_safe())
WITH CHECK (tenant_id = get_current_user_tenant_id_safe());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_page_locks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_page_locks_updated_at
BEFORE UPDATE ON public.page_locks
FOR EACH ROW
EXECUTE FUNCTION public.update_page_locks_updated_at();

-- Enable realtime
ALTER TABLE public.page_locks REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_locks;