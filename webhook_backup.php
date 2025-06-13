
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Solo permitir POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

// Obtener el contenido JSON del request
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validar que los datos sean válidos
if (!$data || !isset($data['businessEmail']) || !isset($data['timestamp'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos inválidos']);
    exit();
}

// Crear el directorio de respaldos si no existe
$backupDir = 'backups';
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0755, true);
}

// Generar nombre del archivo fijo basado en el email del negocio
$businessEmail = $data['businessEmail'];

// Reemplazar @ y . por - para crear un nombre de archivo válido
$safeEmail = str_replace(['@', '.'], '-', $businessEmail);
$filename = "backup_{$safeEmail}.json";
$jsFilename = "backup_{$safeEmail}.js";
$filepath = $backupDir . '/' . $filename;
$jsFilepath = $backupDir . '/' . $jsFilename;

// Guardar los datos en el archivo JSON (reemplazando el existente)
$success = file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT));

// Crear archivo JavaScript con export ES6
$jsContent = "export const backupData = " . json_encode($data, JSON_PRETTY_PRINT) . ";";
$jsSuccess = file_put_contents($jsFilepath, $jsContent);

if ($success && $jsSuccess) {
    // Log opcional - crear archivo de log con historial
    $logFile = $backupDir . '/backup_log.txt';
    $logEntry = date('Y-m-d H:i:s') . " - Respaldo actualizado: $filename y $jsFilename - Email: $businessEmail\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    
    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Respaldo actualizado exitosamente',
        'filename' => $filename,
        'jsFilename' => $jsFilename,
        'timestamp' => $data['timestamp'],
        'url' => "https://barberpos.ventapos.app/bkp/backups/$filename",
        'jsUrl' => "https://barberpos.ventapos.app/bkp/backups/$jsFilename"
    ]);
} else {
    // Error al guardar
    http_response_code(500);
    echo json_encode(['error' => 'Error al guardar el respaldo']);
}
?>
