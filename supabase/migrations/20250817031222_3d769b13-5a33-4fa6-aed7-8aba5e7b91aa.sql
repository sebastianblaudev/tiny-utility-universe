-- Eliminar el constraint único global que está causando problemas
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_code_key;

-- Verificar que la función de eliminación funcione correctamente
-- y asegurarse de que esté usando el tenant_id correcto
CREATE OR REPLACE FUNCTION public.delete_product_with_admin_check(
  product_id UUID,
  admin_password TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_tenant_id TEXT;
  result JSON;
BEGIN
  -- Obtener tenant_id del usuario actual
  current_tenant_id := auth.jwt() -> 'user_metadata' ->> 'tenant_id';
  
  -- Validar que el usuario es admin (por ahora solo verificamos que esté autenticado)
  IF auth.role() != 'authenticated' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no autenticado'
    );
  END IF;
  
  -- Validar contraseña de administrador
  IF admin_password != 'admin123' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Contraseña de administrador incorrecta'
    );
  END IF;
  
  -- Eliminar el producto verificando tanto ID como tenant_id
  DELETE FROM public.products 
  WHERE id = product_id 
  AND tenant_id = current_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Producto no encontrado o no autorizado'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Producto eliminado correctamente'
  );
END;
$$;