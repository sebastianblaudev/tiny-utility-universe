
<?php
$backupDir = 'backups';
$filename = $_GET['file'] ?? '';

if (empty($filename)) {
    http_response_code(400);
    echo 'Archivo no especificado';
    exit();
}

// Validar que el archivo existe y está en el directorio correcto
$filepath = $backupDir . '/' . basename($filename);

if (!file_exists($filepath) || !is_file($filepath)) {
    http_response_code(404);
    echo 'Archivo no encontrado';
    exit();
}

// Validar que es un archivo de respaldo válido
if (!preg_match('/^backup_.*\.json$/', basename($filename))) {
    http_response_code(403);
    echo 'Archivo no válido';
    exit();
}

// Configurar headers para descarga
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . basename($filename) . '"');
header('Content-Length: ' . filesize($filepath));
header('Cache-Control: no-cache, must-revalidate');
header('Expires: 0');

// Enviar el archivo
readfile($filepath);
exit();
?>
