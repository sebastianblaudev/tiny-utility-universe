
<?php
// Este script debe ser ejecutado por un cron job cada 5 minutos

// Definir la ruta de la carpeta de respaldos
$backupDir = __DIR__ . '/bkp';

// Crear la carpeta si no existe
if (!is_dir($backupDir)) {
    if (!mkdir($backupDir, 0755, true)) {
        error_log('Error al crear carpeta de respaldos en auto_sync.php');
        exit(1);
    }
}

// Registrar la ejecución del script en un log
$logData = date('Y-m-d H:i:s') . " - Verificación automática de respaldos ejecutada\n";
file_put_contents(__DIR__ . '/auto_sync_log.txt', $logData, FILE_APPEND);

// Intentar recuperar datos de aplicaciones cliente
// Esto simula solicitudes desde clientes para mantener los datos actualizados
$clientAppIds = glob($backupDir . '/*_bkp.json');
foreach ($clientAppIds as $backupFile) {
    // Registrar en el log que se está procesando este archivo
    $filename = basename($backupFile);
    $businessId = str_replace('_bkp.json', '', $filename);
    $logData = date('Y-m-d H:i:s') . " - Procesando datos de negocio: " . $businessId . "\n";
    file_put_contents(__DIR__ . '/auto_sync_log.txt', $logData, FILE_APPEND);
    
    // Aquí podrías procesar los datos si es necesario
}

// Verificar si hay respaldos más antiguos que 24 horas y eliminarlos
// para mantener limpio el sistema de archivos
$files = glob($backupDir . '/*_bkp.json');
$now = time();
$maxAge = 24 * 60 * 60; // 24 horas en segundos

foreach ($files as $file) {
    if (is_file($file)) {
        $fileAge = $now - filemtime($file);
        if ($fileAge > $maxAge) {
            // Crear una carpeta de archivado si no existe
            $archiveDir = __DIR__ . '/bkp/archived';
            if (!is_dir($archiveDir)) {
                mkdir($archiveDir, 0755, true);
            }
            
            // Mover el archivo antiguo a la carpeta de archivado
            $filename = basename($file);
            rename($file, $archiveDir . '/' . $filename);
            
            // Registrar la acción
            $logData = date('Y-m-d H:i:s') . " - Respaldo antiguo movido a archivo: " . $filename . "\n";
            file_put_contents(__DIR__ . '/auto_sync_log.txt', $logData, FILE_APPEND);
        }
    }
}

// Registrar finalización exitosa
$logData = date('Y-m-d H:i:s') . " - Verificación automática completada\n";
file_put_contents(__DIR__ . '/auto_sync_log.txt', $logData, FILE_APPEND);

echo "Sincronización automática ejecutada correctamente.";
