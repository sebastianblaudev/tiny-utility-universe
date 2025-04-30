
# Receptor de Respaldos PizzaPOS

Este script PHP permite recibir y guardar los respaldos JSON enviados por la aplicación PizzaPOS, organizándolos por negocio en un hosting compartido.

## Instrucciones de instalación

1. **Sube los archivos al servidor**:
   - Sube el archivo `backup-receiver.php` a tu hosting compartido

2. **Configura los permisos y directorios**:
   - Crea una carpeta llamada `backups` en el mismo directorio
   - Asegúrate que la carpeta tenga permisos de escritura (chmod 755 o 775)

3. **Configura la clave API (opcional)**:
   - Abre el archivo `backup-receiver.php` y modifica la línea que define `API_KEY`
   - Puedes dejarla vacía para desactivar la verificación de API Key
   - Para crear tu propia clave, simplemente genera una cadena aleatoria y colócala aquí

4. **Configura la aplicación PizzaPOS**:
   - Ve a la sección "Configuración de Respaldos" en la aplicación
   - Activa los "Respaldos a Servidor Remoto"
   - Ingresa la URL completa al archivo PHP: `https://tudominio.com/ruta/backup-receiver.php`
   - Ingresa la clave API si la configuraste
   
5. **Prueba la conexión**:
   - Usa la función "Probar conexión" en la aplicación
   - También puedes probar manualmente visitando la URL con ?test al final

## Estructura de archivos

Una vez funcionando, se creará automáticamente esta estructura:

```
/backups/
  /business-id-1/
    business-id-1_backup_2025-04-30_15-30-00.json
    metadata.json
  /business-id-2/
    business-id-2_backup_2025-04-30_15-35-00.json
    metadata.json
```

## Accediendo a los datos

Para cada negocio se crea una carpeta con su ID, y dentro se guardan:
- Los archivos JSON de respaldo (limitados automáticamente)
- Un archivo metadata.json con información sobre el último respaldo

## Seguridad

- La API Key es opcional pero recomendada para mayor seguridad
- Si decides no utilizar API Key, considera proteger el directorio con .htaccess
- Para crear tu propia API Key, puedes usar cualquier cadena aleatoria o un generador online

## Solución de problemas

Si los respaldos no se están guardando:
1. Verifica permisos de escritura en la carpeta "backups"
2. Revisa el archivo "backup_log.txt" para ver mensajes de error
3. Asegúrate de que la URL configurada en la aplicación es correcta
4. Verifica que la clave API coincida entre la app y el script (si la configuraste)
