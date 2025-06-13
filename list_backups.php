
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$backupDir = 'backups';
$businessEmail = $_GET['email'] ?? '';

if (empty($businessEmail)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email del negocio requerido']);
    exit();
}

$safeEmail = str_replace(['@', '.'], '-', $businessEmail);
$pattern = $backupDir . "/backup_{$safeEmail}_*.json";
$files = glob($pattern);

$backups = [];
foreach ($files as $file) {
    $filename = basename($file);
    $backups[] = [
        'filename' => $filename,
        'size' => filesize($file),
        'date' => date('Y-m-d H:i:s', filemtime($file)),
        'download_url' => "download_backup.php?file=" . urlencode($filename)
    ];
}

// Ordenar por fecha (más reciente primero)
usort($backups, function($a, $b) {
    return strtotime($b['date']) - strtotime($a['date']);
});

echo json_encode([
    'success' => true,
    'email' => $businessEmail,
    'backups' => $backups,
    'total' => count($backups)
]);
?>
