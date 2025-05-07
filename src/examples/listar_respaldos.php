
<?php
// Configuración del script
header("Access-Control-Allow-Origin: *"); // Permitir acceso desde cualquier origen (ajustar en producción)
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Para peticiones OPTIONS (pre-flight de CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Directorio donde se guardan los respaldos
$DIRECTORIO_RESPALDOS = __DIR__ . '/respaldos';

// Verificar que sea una petición GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Solo se permiten peticiones GET']);
    exit;
}

try {
    // Verificar si se ha proporcionado un ID de negocio
    if (!isset($_GET['id_negocio'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Se requiere el parámetro id_negocio']);
        exit;
    }
    
    $id_negocio = $_GET['id_negocio'];
    $directorio_negocio = $DIRECTORIO_RESPALDOS . '/' . $id_negocio;
    
    // Verificar si existe el directorio del negocio
    if (!file_exists($directorio_negocio)) {
        echo json_encode(['backups' => []]);
        exit;
    }
    
    // Verificar si existe el archivo de índice
    $ruta_indice = $directorio_negocio . '/index.json';
    if (!file_exists($ruta_indice)) {
        echo json_encode(['backups' => []]);
        exit;
    }
    
    // Leer el archivo de índice
    $contenido_indice = file_get_contents($ruta_indice);
    $indice = json_decode($contenido_indice, true) ?: [];
    
    // Devolver la lista de respaldos
    echo json_encode(['backups' => $indice]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al listar respaldos', 'message' => $e->getMessage()]);
}
?>
