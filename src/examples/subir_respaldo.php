
<?php
// Configuración del script
header("Access-Control-Allow-Origin: *"); // Permitir acceso desde cualquier origen (ajustar en producción)
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Para peticiones OPTIONS (pre-flight de CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Directorio donde se guardarán los respaldos
$DIRECTORIO_RESPALDOS = __DIR__ . '/respaldos';

// Función para registrar errores en un archivo de log
function registrar_error($mensaje) {
    $archivo_log = __DIR__ . '/respaldo_errores.log';
    $fecha = date('Y-m-d H:i:s');
    file_put_contents($archivo_log, "[$fecha] $mensaje" . PHP_EOL, FILE_APPEND);
}

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Solo se permiten peticiones POST']);
    exit;
}

try {
    // Obtener el contenido de la petición
    $contenido = file_get_contents('php://input');
    
    // Decodificar el JSON
    $datos = json_decode($contenido, true);
    
    // Verificar que los datos sean válidos
    if (!$datos || !isset($datos['id_negocio']) || !isset($datos['respaldo'])) {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => 'Datos de respaldo inválidos']);
        exit;
    }
    
    // Crear directorio para los respaldos si no existe
    if (!file_exists($DIRECTORIO_RESPALDOS)) {
        mkdir($DIRECTORIO_RESPALDOS, 0755, true);
    }
    
    // Crear directorio específico para el negocio
    $directorio_negocio = $DIRECTORIO_RESPALDOS . '/' . $datos['id_negocio'];
    if (!file_exists($directorio_negocio)) {
        mkdir($directorio_negocio, 0755, true);
    }
    
    // Formatear timestamp para el nombre del archivo
    $timestamp = isset($datos['respaldo']['timestamp']) 
        ? $datos['respaldo']['timestamp'] 
        : date('Y-m-d_H-i-s');
    
    // Limpiar el timestamp para usarlo como nombre de archivo
    $timestamp_limpio = str_replace([' ', ':', '.', 'T', 'Z'], ['_', '-', '-', '_', ''], $timestamp);
    $nombre_archivo = "backup-{$timestamp_limpio}.json";
    $ruta_archivo = $directorio_negocio . '/' . $nombre_archivo;
    
    // Guardar el archivo
    $resultado = file_put_contents($ruta_archivo, json_encode($datos['respaldo'], JSON_PRETTY_PRINT));
    
    if ($resultado === false) {
        throw new Exception("No se pudo escribir el archivo de respaldo");
    }
    
    // Registrar los metadatos en un archivo índice
    $ruta_indice = $directorio_negocio . '/index.json';
    $indice = [];
    
    if (file_exists($ruta_indice)) {
        $contenido_indice = file_get_contents($ruta_indice);
        if ($contenido_indice) {
            $indice = json_decode($contenido_indice, true) ?: [];
        }
    }
    
    // Añadir entrada al índice
    $indice[] = [
        'filename' => $nombre_archivo,
        'timestamp' => $timestamp,
        'size' => filesize($ruta_archivo)
    ];
    
    // Ordenar por fecha más reciente primero
    usort($indice, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    // Guardar índice actualizado
    file_put_contents($ruta_indice, json_encode($indice, JSON_PRETTY_PRINT));
    
    // Devolver respuesta exitosa
    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => 'Respaldo recibido y guardado correctamente',
        'filename' => $nombre_archivo
    ]);
    
} catch (Exception $e) {
    // Registrar el error
    registrar_error($e->getMessage());
    
    // Devolver error
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al procesar el respaldo', 
        'message' => $e->getMessage()
    ]);
}
?>
