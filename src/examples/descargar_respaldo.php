
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
    // Verificar si se han proporcionado los parámetros necesarios
    if (!isset($_GET['id_negocio']) || !isset($_GET['filename'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Se requieren los parámetros id_negocio y filename']);
        exit;
    }
    
    $id_negocio = $_GET['id_negocio'];
    $filename = $_GET['filename'];
    
    // Validar que el nombre de archivo no contenga caracteres peligrosos
    if (preg_match('/[\/\\\\]/', $filename)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre de archivo no válido']);
        exit;
    }
    
    // Construir la ruta al archivo
    $ruta_archivo = $DIRECTORIO_RESPALDOS . '/' . $id_negocio . '/' . $filename;
    
    // Verificar si existe el archivo
    if (!file_exists($ruta_archivo)) {
        http_response_code(404);
        echo json_encode(['error' => 'Archivo de respaldo no encontrado']);
        exit;
    }
    
    // Leer el contenido del archivo
    $contenido = file_get_contents($ruta_archivo);
    $respaldo = json_decode($contenido, true);
    
    // Devolver el contenido del respaldo
    echo json_encode($respaldo);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al descargar respaldo', 'message' => $e->getMessage()]);
}
?>
