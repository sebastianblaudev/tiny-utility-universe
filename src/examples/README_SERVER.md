
# Instrucciones para instalar los scripts de respaldo en tu hosting

Este documento explica cómo configurar correctamente los scripts PHP para gestionar los respaldos de tu aplicación en tu hosting.

## Requisitos

1. Un hosting con soporte para PHP 7.0 o superior
2. Acceso FTP o SSH para subir archivos
3. Permisos de escritura en el directorio donde se alojarán los archivos

## Archivos incluidos

- `subir_respaldo.php`: Recibe los respaldos JSON y los almacena
- `listar_respaldos.php`: Devuelve la lista de respaldos disponibles
- `descargar_respaldo.php`: Permite recuperar un respaldo específico

## Instalación

1. **Crea un directorio en tu servidor** para alojar estos archivos (por ejemplo, `/respaldos-api/`)

2. **Sube los archivos PHP** al directorio creado:
   - subir_respaldo.php
   - listar_respaldos.php
   - descargar_respaldo.php

3. **Verifica los permisos**:
   - El directorio debe tener permisos de escritura (generalmente 755)
   - PHP debe tener permisos para crear subdirectorios y archivos

4. **Configure la URL del servidor en tu aplicación**:
   - En la configuración de respaldos, establece la URL del servidor como:
     `https://tudominio.com/respaldos-api/subir_respaldo.php`

## Configuración de seguridad (importante)

Los scripts están configurados para permitir solicitudes desde cualquier origen (CORS). En un entorno de producción, es recomendable restringir esto:

1. **Modifica la línea** en cada archivo:
   ```php
   header("Access-Control-Allow-Origin: *");
   ```

2. **Reemplaza el asterisco** con tu dominio específico:
   ```php
   header("Access-Control-Allow-Origin: https://tuaplicacion.com");
   ```

3. **Considera añadir autenticación** para mayor seguridad.

## Estructura de directorios creada

Los respaldos se organizarán automáticamente en la siguiente estructura:

```
/respaldos/
  ├── id_negocio_1/
  │   ├── backup-2023-05-01_14-30-00.json
  │   ├── backup-2023-05-02_15-45-00.json
  │   └── index.json
  └── id_negocio_2/
      ├── backup-2023-05-03_10-00-00.json
      └── index.json
```

## Solución de problemas

Si encuentras errores al usar estos scripts:

1. Verifica el archivo `respaldo_errores.log` que se creará en el mismo directorio
2. Asegúrate que PHP tenga permisos de escritura en el directorio
3. Comprueba que las peticiones CORS estén correctamente configuradas

## Probar la instalación

Una vez instalados los scripts, puedes usar la función "Probar Conexión" en la página de Configuración de Respaldos de tu aplicación para verificar que todo funciona correctamente.
