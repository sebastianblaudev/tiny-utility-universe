# Instrucciones de Migración a Nuevo Proyecto Supabase

## 1. Crear Nuevo Proyecto Supabase

1. Ve a [supabase.com](https://supabase.com/dashboard)
2. Crea un nuevo proyecto
3. Anota las siguientes credenciales:
   - **Project ID**: (ej: abc123xyz)
   - **Anon Key**: (empieza con eyJhbGciOiJIUzI1NiIsInR5cCI...)
   - **Service Role Key**: (empieza con eyJhbGciOiJIUzI1NiIsInR5cCI...)

## 2. Ejecutar el Script de Migración

1. En el nuevo proyecto Supabase, ve a **SQL Editor**
2. Crea una nueva query
3. Copia TODO el contenido del archivo `migration_script_complete.sql`
4. Ejecuta el script (puede tomar varios minutos)
5. Verifica que no haya errores en la ejecución

## 3. Actualizar Configuración del Proyecto

### A. Actualizar supabase/config.toml

Reemplaza el contenido completo con:

```toml
project_id = "TU_NUEVO_PROJECT_ID"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323
api_url = "http://127.0.0.1:54321"

[ingest]
enabled = false
port = 54324

[storage]
enabled = true
port = 54325
image_transformation = {
  enabled = true
}

[auth]
enabled = true
port = 54326
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["https://127.0.0.1:3000"]
jwt_expiry = 3600
refresh_token_rotation_enabled = true
refresh_token_reuse_interval = 10
enable_signup = true

[edge_functions]
enabled = false
port = 54327

[analytics]
enabled = false
port = 54328
vector_port = 54329
gcp_project_id = ""
gcp_project_number = ""
gcp_jwt_path = "supabase/gcp.json"
```

### B. Actualizar src/integrations/supabase/client.ts

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://TU_NUEVO_PROJECT_ID.supabase.co'
const supabaseAnonKey = 'TU_NUEVO_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})
```

## 4. Configurar Authentication

### A. URLs de Configuración

En el dashboard de Supabase, ve a **Authentication > URL Configuration**:

- **Site URL**: `https://tu-dominio.lovableproject.com`
- **Redirect URLs**: Agregar:
  - `https://tu-dominio.lovableproject.com/**`
  - `http://localhost:3000/**` (para desarrollo)

### B. Configurar Providers (si es necesario)

Si usas Google Auth u otros providers, configúralos en **Authentication > Providers**.

## 5. Regenerar Types de Supabase

1. Ve a **Settings > API** en tu nuevo proyecto
2. Copia la nueva URL del API
3. Los types se regenerarán automáticamente en Lovable

## 6. Verificación Post-Migración

### A. Verificar Tablas
Ejecuta en SQL Editor:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver 15+ tablas incluyendo: sales, products, customers, sale_items, etc.

### B. Verificar Funciones
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;
```

### C. Verificar RLS
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### D. Verificar Storage
Ve a **Storage** y confirma que existe el bucket `products`.

## 7. Testing

1. **Autenticación**: Prueba crear un usuario nuevo
2. **Productos**: Intenta crear un producto
3. **Ventas**: Realiza una venta de prueba
4. **Multitenancy**: Verifica que cada usuario ve solo sus datos

## 8. Deployment

Cuando todo funcione correctamente:

1. **Deploy a producción** en Lovable
2. **Actualiza las URLs** en Supabase Authentication para incluir tu dominio de producción
3. **Configura las variables de entorno** si las hay

## 9. Notas Importantes

- ✅ **Estructura migrada**: Todas las tablas, funciones, triggers y políticas RLS
- ✅ **Sin datos**: Base de datos limpia sin usuarios ni datos previos
- ✅ **Multitenancy**: Sistema de aislamiento por tenant_id funcional
- ⚠️ **Nuevos usuarios**: Todos los usuarios deberán registrarse nuevamente
- ⚠️ **Testing necesario**: Prueba exhaustivamente antes de producción

## 10. Rollback (si es necesario)

Si necesitas volver al proyecto anterior, simplemente:
1. Restaura el `config.toml` original
2. Restaura el `client.ts` original
3. Redeploy el proyecto

---

**¿Necesitas ayuda?** Si encuentras algún error durante la migración, comparte el mensaje de error específico para obtener asistencia.