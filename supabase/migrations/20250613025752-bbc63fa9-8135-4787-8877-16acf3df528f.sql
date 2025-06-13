
-- Habilitar RLS y crear políticas para user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" 
  ON public.user_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
  ON public.user_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON public.user_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" 
  ON public.user_preferences 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Habilitar RLS y crear políticas para app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own app settings" 
  ON public.app_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own app settings" 
  ON public.app_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app settings" 
  ON public.app_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own app settings" 
  ON public.app_settings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Habilitar RLS y crear políticas para system_users
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own system users" 
  ON public.system_users 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own system users" 
  ON public.system_users 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own system users" 
  ON public.system_users 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own system users" 
  ON public.system_users 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Habilitar RLS y crear políticas para tips
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tips" 
  ON public.tips 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tips" 
  ON public.tips 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tips" 
  ON public.tips 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tips" 
  ON public.tips 
  FOR DELETE 
  USING (auth.uid() = user_id);
