
<?php
// Habilitar headers CORS para permitir solicitudes desde cualquier origen
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Si es una solicitud OPTIONS, terminar aquí (pre-flight de CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Verificar que la solicitud sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido. Use POST.'
    ]);
    exit;
}

// Obtener el contenido JSON de la solicitud
$jsonData = file_get_contents('php://input');

// Verificar si hay datos
if (empty($jsonData)) {
    echo json_encode([
        'success' => false,
        'message' => 'No se recibieron datos.'
    ]);
    exit;
}

// Intentar decodificar el JSON
$data = json_decode($jsonData, true);

// Verificar si el JSON es válido
if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'success' => false,
        'message' => 'Formato JSON inválido: ' . json_last_error_msg()
    ]);
    exit;
}

// Verificar campos requeridos
if (!isset($data['businessId']) || !isset($data['data'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos incompletos. Se requiere businessId y data.'
    ]);
    exit;
}

// Crear la carpeta bkp si no existe
$backupDir = __DIR__ . '/bkp';
if (!is_dir($backupDir)) {
    if (!mkdir($backupDir, 0755, true)) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear la carpeta de respaldos.'
        ]);
        exit;
    }
}

// Generar nombre de archivo con el formato uid_bkp.json
$filename = $data['businessId'] . '_bkp.json';
$backupPath = $backupDir . '/' . $filename;

// Escribir los datos en el archivo
if (file_put_contents($backupPath, $jsonData) === false) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar el respaldo.'
    ]);
    exit;
}

// Registrar la operación en un log
$logData = date('Y-m-d H:i:s') . " - Respaldo creado para negocio: " . $data['businessId'] . "\n";
file_put_contents(__DIR__ . '/backup_log.txt', $logData, FILE_APPEND);

// Devolver respuesta exitosa
echo json_encode([
    'success' => true,
    'message' => 'Respaldo guardado correctamente.',
    'filename' => $filename,
    'timestamp' => date('Y-m-d H:i:s')
]);
