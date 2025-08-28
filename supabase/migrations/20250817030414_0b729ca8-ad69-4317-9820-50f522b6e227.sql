-- Crear constraint único para código por tenant para evitar duplicados
ALTER TABLE public.products 
ADD CONSTRAINT products_code_tenant_unique 
UNIQUE (code, tenant_id);

-- Crear función para eliminar productos con validación de admin
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
  -- En una implementación real, aquí verificarías la contraseña contra una tabla de admins
  IF auth.role() != 'authenticated' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no autenticado'
    );
  END IF;
  
  -- Simular validación de contraseña (en implementación real usar hash)
  IF admin_password != 'admin123' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Contraseña de administrador incorrecta'
    );
  END IF;
  
  -- Eliminar el producto
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