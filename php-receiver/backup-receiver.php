
<?php
/**
 * PizzaPOS Backup Receiver
 * 
 * Este script recibe respaldos JSON de la aplicación PizzaPOS y los almacena
 * en carpetas específicas para cada negocio.
 * 
 * INSTRUCCIONES:
 * 1. Sube este archivo a tu hosting compartido
 * 2. Crea una carpeta "backups" y asegúrate de que tenga permisos de escritura
 * 3. (Opcional) Configura la API_KEY abajo para mayor seguridad
 * 4. Configura la aplicación para enviar respaldos a la URL de este script
 */

// Configuración
define('API_KEY', ''); // Déjala vacía para desactivar la verificación o pon tu clave personalizada
define('BACKUPS_DIR', './backups/');      // Directorio donde se guardarán los respaldos
define('LOG_FILE', './backup_log.txt');   // Archivo de registro para eventos de respaldo
define('MAX_BACKUPS_PER_BUSINESS', 50);   // Máximo de respaldos a mantener por negocio

// Cabeceras CORS para permitir solicitudes desde cualquier origen
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

// Manejar solicitud OPTIONS preliminar
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Función para escribir en el archivo de registro
function write_log($message) {
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[$timestamp] $message" . PHP_EOL;
    file_put_contents(LOG_FILE, $log_message, FILE_APPEND);
}

// Endpoint de prueba - Se usa para verificar que el servidor esté funcionando
if (isset($_GET['test'])) {
    echo json_encode(['status' => 'success', 'message' => 'El receptor de respaldos está funcionando correctamente']);
    exit;
}

// Solo aceptar solicitudes POST para datos reales
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Verificar la API key sólo si está configurada
$headers = getallheaders();
$api_key_header = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : '';

if (API_KEY !== '' && $api_key_header !== API_KEY) {
    write_log("Verificación de API Key fallida");
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

// Obtener los datos JSON
$json_data = file_get_contents('php://input');
if (!$json_data) {
    write_log("No se recibieron datos");
    http_response_code(400);
    echo json_encode(['error' => 'No se recibieron datos']);
    exit;
}

// Analizar el JSON
$data = json_decode($json_data, true);
if (!$data || !isset($data['businessId']) || !isset($data['data'])) {
    write_log("Formato de datos inválido");
    http_response_code(400);
    echo json_encode(['error' => 'Formato de datos inválido']);
    exit;
}

// Extraer el ID del negocio y crear carpeta si es necesario
$business_id = preg_replace('/[^a-zA-Z0-9_-]/', '', $data['businessId']); // Sanitizar ID del negocio
if (empty($business_id)) {
    $business_id = 'default';
}

$business_dir = BACKUPS_DIR . $business_id . '/';
if (!file_exists($business_dir)) {
    if (!mkdir($business_dir, 0755, true)) {
        write_log("Error al crear directorio: $business_dir");
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear directorio']);
        exit;
    }
}

// Generar nombre de archivo con marca de tiempo
$timestamp = date('Y-m-d_H-i-s');
$filename = $business_id . '_backup_' . $timestamp . '.json';
$filepath = $business_dir . $filename;

// Guardar el respaldo
if (file_put_contents($filepath, json_encode($data['data'], JSON_PRETTY_PRINT))) {
    write_log("Respaldo guardado: $filepath");
    
    // Limpiar respaldos antiguos si excedemos el límite
    $files = glob($business_dir . '*.json');
    if (count($files) > MAX_BACKUPS_PER_BUSINESS) {
        usort($files, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        
        $files_to_delete = array_slice($files, 0, count($files) - MAX_BACKUPS_PER_BUSINESS);
        foreach ($files_to_delete as $file) {
            unlink($file);
            write_log("Respaldo antiguo eliminado: $file");
        }
    }
    
    // Crear un archivo de metadatos que incluye información del último respaldo
    $meta_data = [
        'lastBackup' => $timestamp,
        'backupCount' => count(glob($business_dir . '*.json')),
        'businessId' => $business_id,
        'latestBackupFile' => $filename
    ];
    file_put_contents($business_dir . 'metadata.json', json_encode($meta_data, JSON_PRETTY_PRINT));
    
    http_response_code(200);
    echo json_encode([
        'status' => 'success', 
        'message' => 'Respaldo guardado exitosamente',
        'filename' => $filename
    ]);
} else {
    write_log("Error al escribir el archivo de respaldo");
    http_response_code(500);
    echo json_encode(['error' => 'Error al guardar respaldo']);
}
