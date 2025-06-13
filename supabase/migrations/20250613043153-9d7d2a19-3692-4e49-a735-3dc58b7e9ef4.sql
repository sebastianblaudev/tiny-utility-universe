
-- Primero eliminar la tabla actual si existe
DROP TABLE IF EXISTS public.operational_expenses CASCADE;

-- Recrear la tabla con estructura correcta
CREATE TABLE public.operational_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  branch_id text NOT NULL DEFAULT 'main',
  date timestamp with time zone NOT NULL,
  category text NOT NULL CHECK (category IN ('rent', 'utilities', 'supplies', 'wages', 'maintenance', 'marketing', 'other')),
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  description text NOT NULL,
  recurrent boolean NOT NULL DEFAULT false,
  periodicity text CHECK (periodicity IS NULL OR periodicity IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  last_paid timestamp with time zone,
  next_due timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS en la tabla
ALTER TABLE public.operational_expenses ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para que los usuarios solo vean sus propios gastos
CREATE POLICY "Users can view their own operational expenses" 
  ON public.operational_expenses 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own operational expenses" 
  ON public.operational_expenses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own operational expenses" 
  ON public.operational_expenses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own operational expenses" 
  ON public.operational_expenses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_operational_expenses_updated_at
  BEFORE UPDATE ON public.operational_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar tiempo real para la tabla
ALTER TABLE public.operational_expenses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_expenses;

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_operational_expenses_user_id ON public.operational_expenses(user_id);
CREATE INDEX idx_operational_expenses_date ON public.operational_expenses(date);
CREATE INDEX idx_operational_expenses_category ON public.operational_expenses(category);
CREATE INDEX idx_operational_expenses_recurrent ON public.operational_expenses(recurrent);
