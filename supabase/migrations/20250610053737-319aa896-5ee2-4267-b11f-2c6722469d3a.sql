
-- Crear tabla para usuarios del sistema (reemplaza localStorage)
CREATE TABLE public.system_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  pin text NOT NULL,
  role text NOT NULL DEFAULT 'barber',
  branch_id text DEFAULT '1',
  is_blocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, pin),
  UNIQUE(user_id, name)
);

-- Expandir app_settings para incluir todas las configuraciones
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS receipt_settings jsonb DEFAULT '{
  "showLogo": true,
  "showAddress": true,
  "showPhone": true,
  "footerText": "Gracias por su visita"
}'::jsonb,
ADD COLUMN IF NOT EXISTS language_settings jsonb DEFAULT '{
  "language": "es",
  "currency": "COP",
  "timezone": "America/Bogota"
}'::jsonb,
ADD COLUMN IF NOT EXISTS blocked_names jsonb DEFAULT '["prueba", "test", "ejemplo", "juan", "carlos", "miguel"]'::jsonb;

-- Crear tabla para preferencias de usuario
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sidebar_open boolean DEFAULT false,
  theme text DEFAULT 'system',
  notifications_enabled boolean DEFAULT true,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Crear tabla para tips
CREATE TABLE public.tips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tip_id text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  barber_id text NOT NULL,
  barber_name text,
  sale_id text,
  payment_method text NOT NULL DEFAULT 'cash',
  date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en todas las nuevas tablas
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para system_users
CREATE POLICY "Users can manage their own system users" ON public.system_users
FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para user_preferences
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para tips
CREATE POLICY "Users can manage their own tips" ON public.tips
FOR ALL USING (auth.uid() = user_id);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_users_updated_at BEFORE UPDATE ON public.system_users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tips_updated_at BEFORE UPDATE ON public.tips FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Habilitar realtime para todas las tablas
ALTER TABLE public.system_users REPLICA IDENTITY FULL;
ALTER TABLE public.user_preferences REPLICA IDENTITY FULL;
ALTER TABLE public.tips REPLICA IDENTITY FULL;

-- Agregar tablas a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tips;
