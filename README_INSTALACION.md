
# Instalación del Sistema de Respaldos Automáticos

## Archivos a subir a tu hosting

1. `webhook_backup.php` - Recibe los respaldos automáticos
2. `list_backups.php` - Lista los respaldos disponibles
3. `download_backup.php` - Permite descargar respaldos específicos

## Instrucciones de instalación

### 1. Subir archivos al hosting
- Sube los 3 archivos PHP a un directorio en tu hosting (ej: `/public_html/barber-backup/`)
- Asegúrate de que el directorio tenga permisos de escritura (755 o 777)

### 2. Configurar permisos
```bash
chmod 755 webhook_backup.php
chmod 755 list_backups.php  
chmod 755 download_backup.php
chmod 755 .  # directorio principal
```

### 3. Configurar en la aplicación
En la aplicación, ve a **Configuración > Respaldos Automáticos** y configura:

- **URL del Webhook**: `https://tu-dominio.com/barber-backup/webhook_backup.php`
- **Email del Negocio**: tu-email@ejemplo.com
- **Habilitar respaldos**: ✅ Activado

### 4. Probar la configuración
1. Haz clic en "Probar" en la aplicación
2. Verifica que se cree el directorio `backups/` automáticamente
3. Confirma que aparezca un archivo de respaldo

## URLs útiles

Una vez instalado, puedes usar estas URLs:

- **Recibir respaldos**: `https://tu-dominio.com/barber-backup/webhook_backup.php`
- **Listar respaldos**: `https://tu-dominio.com/barber-backup/list_backups.php?email=tu-email@ejemplo.com`
- **Descargar respaldo**: `https://tu-dominio.com/barber-backup/download_backup.php?file=backup_xxx.json`

## Funcionamiento

- Los respaldos se guardan automáticamente cuando hay cambios en el sistema
- Se mantienen los últimos 30 respaldos por negocio
- Los archivos se nombran: `backup_[email]_[fecha].json`
- Se crea un log en `backups/backup_log.txt`

## Seguridad

- Solo acepta requests POST válidos
- Valida el formato de datos
- Limpia nombres de archivos
- Mantiene logs de actividad

## Troubleshooting

Si no funciona:
1. Verifica que el directorio tenga permisos de escritura
2. Revisa los logs del servidor web
3. Asegúrate de que la URL sea accesible desde internet
4. Confirma que el hosting soporte PHP
