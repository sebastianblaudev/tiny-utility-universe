
-- Actualizar la función handle_new_user para crear perfiles completos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Crear perfil con datos completos
  INSERT INTO public.profiles (id, email, name, pin, role, branch_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'pin', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'barber'),
    '1'
  );
  
  -- Crear configuración de aplicación por defecto
  INSERT INTO public.app_settings (user_id, branch_name, address, phone)
  VALUES (
    NEW.id,
    'Mi Barbería',
    '',
    ''
  );
  
  -- Crear preferencias de usuario por defecto
  INSERT INTO public.user_preferences (user_id, theme, sidebar_open, notifications_enabled)
  VALUES (
    NEW.id,
    'system',
    false,
    true
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no bloquear la creación del usuario
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Asegurar que el trigger existe y está activo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Crear perfil para usuarios existentes que no lo tengan
INSERT INTO public.profiles (id, email, name, pin, role, branch_id)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'pin', '1234'),
  COALESCE(u.raw_user_meta_data->>'role', 'admin'),
  '1'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Crear configuración de aplicación para usuarios existentes
INSERT INTO public.app_settings (user_id, branch_name, address, phone)
SELECT 
  u.id,
  'Mi Barbería',
  '',
  ''
FROM auth.users u
LEFT JOIN public.app_settings a ON u.id = a.user_id
WHERE a.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Crear preferencias para usuarios existentes
INSERT INTO public.user_preferences (user_id, theme, sidebar_open, notifications_enabled)
SELECT 
  u.id,
  'system',
  false,
  true
FROM auth.users u
LEFT JOIN public.user_preferences p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
