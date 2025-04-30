import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  createBackup, 
  restoreFromLocalBackup, 
  startAutoBackup,
  stopAutoBackup,
  isAutoBackupEnabled,
  getBackupInterval,
  getLastBackupDate,
  selectBackupDirectory,
  setCloudConfig,
  testGoogleCloudConnection,
  isCloudEnabled,
  getCloudBucketName,
  setServerBackupConfig,
  isServerBackupEnabled,
  getServerBackupUrl,
  getServerBackupApiKey
} from "@/utils/autoBackup";
import { 
  initializeCloudAPI, 
  signInToCloud, 
  signOutFromCloud, 
  isSignedInToCloud,
  createCloudBucket 
} from "@/utils/cloudBackup";
import { Auth } from "@/lib/auth";
import AuthScreen from "@/components/auth/AuthScreen";
import { Loader2, Save, FolderOpen, AlertTriangle, Cloud, Server } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const BackupSettings = () => {
  const [backupInterval, setBackupInterval] = useState(String(getBackupInterval()));
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(isAutoBackupEnabled());
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(getLastBackupDate());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  
  // Add server backup config state
  const [serverConfig, setServerConfigState] = useState({
    serverBackupEnabled: isServerBackupEnabled(),
    serverBackupUrl: getServerBackupUrl(),
    serverBackupApiKey: getServerBackupApiKey()
  });
  const [testingServerConnection, setTestingServerConnection] = useState(false);
  
  // Add PHP setup instructions state
  const [showPhpInstructions, setShowPhpInstructions] = useState(false);
  
  // ... keep existing code (cloud config states)
  const [cloudConfig, setCloudConfigState] = useState({
    cloudEnabled: isCloudEnabled(),
    cloudBucketName: getCloudBucketName()
  });
  const [cloudSignedIn, setCloudSignedIn] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState('pizzapos-backups');
  const [projectId, setProjectId] = useState('');
  
  const { toast } = useToast();
  const auth = Auth.getInstance();
  
  useEffect(() => {
    setAutoBackupEnabled(isAutoBackupEnabled());
    setBackupInterval(String(getBackupInterval()));
    setLastBackupDate(getLastBackupDate());
    setIsInIframe(window !== window.top);
    
    const checkInterval = setInterval(() => {
      const currentLastBackup = getLastBackupDate();
      if (currentLastBackup !== lastBackupDate) {
        setLastBackupDate(currentLastBackup);
      }
    }, 60000);
    
    // Initialize Google Cloud API
    const initCloud = async () => {
      await initializeCloudAPI();
      setCloudSignedIn(isSignedInToCloud());
    };
    
    initCloud();
    
    return () => clearInterval(checkInterval);
  }, []);
  
  const handleCreateLocalBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const filename = await createBackup();
      if (filename) {
        setLastBackupDate(new Date().toISOString());
        toast({
          title: "Respaldo creado",
          description: "El respaldo ha sido guardado correctamente",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo crear el respaldo",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al crear respaldo",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };
  
  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor selecciona un archivo de respaldo para restaurar",
      });
      return;
    }
    
    setIsRestoring(true);
    
    try {
      const success = await restoreFromLocalBackup(selectedFile);
      if (success) {
        toast({
          title: "Respaldo restaurado",
          description: "Los datos han sido restaurados correctamente",
        });
        setSelectedFile(null);
        const fileInput = document.getElementById('backup-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo restaurar el respaldo",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al restaurar",
      });
    } finally {
      setIsRestoring(false);
    }
  };
  
  const handleStartAutoBackup = () => {
    const interval = parseInt(backupInterval, 10);
    if (isNaN(interval) || interval < 1) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa un intervalo válido (minutos)",
      });
      return;
    }
    
    startAutoBackup(interval);
    setAutoBackupEnabled(true);
    toast({
      title: "Respaldos automáticos iniciados",
      description: `Se crearán respaldos cada ${interval} minutos`,
    });
  };
  
  const handleStopAutoBackup = () => {
    stopAutoBackup();
    setAutoBackupEnabled(false);
    toast({
      title: "Respaldos automáticos detenidos",
      description: "Los respaldos automáticos han sido detenidos",
    });
  };
  
  const handleSelectDirectory = async () => {
    setIsSelectingFolder(true);
    try {
      const success = await selectBackupDirectory();
      if (success) {
        toast({
          title: "Carpeta seleccionada",
          description: "La carpeta para respaldos automáticos ha sido configurada correctamente.",
        });
      } else {
        if (isInIframe) {
          toast({
            variant: "destructive",
            title: "Error - Aplicación en iframe",
            description: "No es posible seleccionar carpetas mientras la aplicación está en un iframe. Abre la aplicación directamente en una nueva pestaña.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo configurar la carpeta para respaldos. Tu navegador puede no ser compatible o has cancelado la selección.",
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsSelectingFolder(false);
    }
  };

  const handleCloudConfigChange = (field: string, value: string | boolean) => {
    const newConfig = {
      ...cloudConfig,
      [field]: value
    };
    setCloudConfigState(newConfig);
    setCloudConfig(newConfig);
  };
  
  const handleSignInToCloud = async () => {
    try {
      await initializeCloudAPI();
      const signedIn = await signInToCloud();
      if (signedIn) {
        setCloudSignedIn(true);
        toast({
          title: "Conectado a Google Cloud",
          description: "Se ha iniciado sesión correctamente en Google Cloud",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo iniciar sesión en Google Cloud",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error de conexión con Google Cloud",
      });
    }
  };
  
  const handleSignOutFromCloud = () => {
    signOutFromCloud();
    setCloudSignedIn(false);
    toast({
      title: "Desconectado",
      description: "Se ha cerrado sesión de Google Cloud",
    });
  };
  
  const handleTestCloudConnection = async () => {
    setIsTestingConnection(true);
    try {
      const connected = await testGoogleCloudConnection();
      if (connected) {
        toast({
          title: "Conexión exitosa",
          description: "La conexión con Google Cloud funciona correctamente",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error de conexión",
          description: "No se pudo establecer conexión con Google Cloud",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa un nombre para el bucket",
      });
      return;
    }

    if (!projectId.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa el ID del proyecto de Google Cloud",
      });
      return;
    }
    
    setIsCreatingBucket(true);
    try {
      const bucketId = await createCloudBucket(newBucketName, projectId);
      if (bucketId) {
        handleCloudConfigChange('cloudBucketName', bucketId);
        toast({
          title: "Bucket creado",
          description: `Se ha creado el bucket "${newBucketName}" en Google Cloud Storage`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo crear el bucket en Google Cloud Storage",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el bucket",
      });
    } finally {
      setIsCreatingBucket(false);
    }
  };

  // Handle server config changes
  const handleServerConfigChange = (field: string, value: string | boolean) => {
    const newConfig = {
      ...serverConfig,
      [field]: value
    };
    setServerConfigState(newConfig);
  };
  
  // Save server config
  const handleSaveServerConfig = () => {
    if (serverConfig.serverBackupEnabled && !serverConfig.serverBackupUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa la URL del servidor para los respaldos automáticos",
      });
      return;
    }
    
    setServerBackupConfig({
      serverBackupEnabled: serverConfig.serverBackupEnabled,
      serverBackupUrl: serverConfig.serverBackupUrl,
      serverBackupApiKey: serverConfig.serverBackupApiKey
    });
    
    toast({
      title: "Configuración guardada",
      description: serverConfig.serverBackupEnabled 
        ? "Respaldos automáticos al servidor activados" 
        : "Respaldos automáticos al servidor desactivados",
    });
    
    // If server backup is enabled and auto backup isn't, start auto backup
    if (serverConfig.serverBackupEnabled && !autoBackupEnabled) {
      const interval = parseInt(backupInterval, 10) || 5;
      startAutoBackup(interval);
      setAutoBackupEnabled(true);
      toast({
        title: "Respaldos automáticos iniciados",
        description: `Se crearán respaldos cada ${interval} minutos`,
      });
    }
  };
  
  // Test server connection
  const testServerConnection = async () => {
    if (!serverConfig.serverBackupUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa la URL del servidor antes de probar la conexión",
      });
      return;
    }
    
    setTestingServerConnection(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (serverConfig.serverBackupApiKey) {
        headers['X-API-Key'] = serverConfig.serverBackupApiKey;
      }
      
      // Test endpoint to verify PHP script is working
      const testUrl = serverConfig.serverBackupUrl.includes('?') 
        ? `${serverConfig.serverBackupUrl}&test=1` 
        : `${serverConfig.serverBackupUrl}?test=1`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Conexión exitosa",
          description: data.message || "El servidor está disponible y responde correctamente",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error de conexión",
          description: `El servidor respondió con estado: ${response.status}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor. Verifica la URL e intenta nuevamente.",
      });
    } finally {
      setTestingServerConnection(false);
    }
  };

  // Download PHP receiver file
  const downloadPhpReceiver = () => {
    const apiKeyValue = serverConfig.serverBackupApiKey ? serverConfig.serverBackupApiKey : ''; // Empty by default
    
    const phpContent = `<?php
/**
 * PizzaPOS Backup Receiver
 * 
 * Este script recibe respaldos JSON de la aplicación PizzaPOS y los almacena
 * en carpetas específicas para cada negocio.
 */

// Configuración
define('API_KEY', '${apiKeyValue}'); // Déjala vacía para desactivar la verificación o pon tu clave personalizada
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
}`;

    const element = document.createElement('a');
    const file = new Blob([phpContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'backup-receiver.php';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Archivo PHP descargado",
      description: "Sube este archivo a tu hosting compartido y configura la URL en la aplicación",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <AuthScreen isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Configuración de Respaldos</h1>
        {auth.isAuthenticated() ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-white">
              Conectado como: <strong>{auth.currentUser?.username}</strong>
            </span>
            <Button 
              variant="outline" 
              onClick={() => {
                auth.logout();
                toast({
                  title: "Sesión cerrada",
                  description: "Has cerrado sesión correctamente",
                });
              }}
            >
              Cerrar Sesión
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowAuthModal(true)}>
            Iniciar Sesión / Registrarse
          </Button>
        )}
      </div>
      
      {isInIframe && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta aplicación está ejecutándose en un iframe, lo que limita algunas funcionalidades como seleccionar carpetas. 
            Para acceder a todas las funciones, abre la aplicación directamente en una pestaña.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Respaldos Manuales</CardTitle>
            <CardDescription className="text-white">
              Crea respaldos manualmente o restaura desde un respaldo previo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button 
                onClick={handleCreateLocalBackup} 
                disabled={isCreatingBackup}
                className="flex items-center gap-2"
              >
                {isCreatingBackup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isCreatingBackup ? "Creando respaldo..." : "Crear Respaldo"}
              </Button>
              
              {lastBackupDate && (
                <p className="text-sm text-white mt-2">
                  Último respaldo: {new Date(lastBackupDate).toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backup-file" className="text-white">Restaurar desde archivo</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="text-white"
              />
            </div>
            
            <Button 
              onClick={handleRestoreBackup}
              disabled={!selectedFile || isRestoring}
              className="flex items-center gap-2"
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isRestoring ? "Restaurando..." : "Restaurar Seleccionado"}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Respaldos Automáticos</CardTitle>
            <CardDescription className="text-white">
              Configura los respaldos automáticos periódicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Button 
                  onClick={handleSelectDirectory} 
                  className="mb-3 w-full flex items-center justify-center gap-2"
                  disabled={isSelectingFolder || isInIframe}
                >
                  {isSelectingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                  {isSelectingFolder ? "Seleccionando..." : "Seleccionar Carpeta para Respaldos"}
                </Button>
                <p className="text-sm text-white">
                  Selecciona una carpeta para guardar los respaldos automáticos (solo Chrome/Edge).
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backup-interval" className="text-white">Intervalo de respaldo (minutos)</Label>
                <Input
                  id="backup-interval"
                  type="number"
                  min="1"
                  value={backupInterval}
                  onChange={(e) => setBackupInterval(e.target.value)}
                  className="text-white"
                />
              </div>
              
              {autoBackupEnabled ? (
                <div>
                  <p className="text-sm text-green-600 mb-2">
                    Respaldos automáticos activados cada {backupInterval} minutos
                  </p>
                  <Button variant="outline" onClick={handleStopAutoBackup}>
                    Detener Respaldos Automáticos
                  </Button>
                </div>
              ) : (
                <Button onClick={handleStartAutoBackup}>
                  Iniciar Respaldos Automáticos
                </Button>
              )}
            </div>
            
            <Alert>
              <AlertDescription className="text-white">
                Con la carpeta configurada, los respaldos se guardarán automáticamente sin ventanas de descarga.
                Esta función solo está disponible en Chrome, Edge y otros navegadores basados en Chromium.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Respaldo a Servidor Remoto</CardTitle>
            <CardDescription className="text-white">
              Configura respaldos automáticos a un servidor remoto vía POST
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="server-enabled"
                checked={serverConfig.serverBackupEnabled}
                onCheckedChange={(checked) => handleServerConfigChange('serverBackupEnabled', checked)}
              />
              <Label htmlFor="server-enabled" className="text-white">
                Habilitar respaldo automático a servidor remoto
              </Label>
            </div>
            
            {serverConfig.serverBackupEnabled && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="server-url" className="text-white">URL del servidor</Label>
                  <Input
                    id="server-url"
                    type="url"
                    placeholder="https://tu-servidor.com/backup-receiver.php"
                    value={serverConfig.serverBackupUrl}
                    onChange={(e) => handleServerConfigChange('serverBackupUrl', e.target.value)}
                    className="text-white"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    URL del script PHP que recibirá los respaldos
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-white">API Key (opcional)</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Clave de API para autenticación"
                    value={serverConfig.serverBackupApiKey}
                    onChange={(e) => handleServerConfigChange('serverBackupApiKey', e.target.value)}
                    className="text-white"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Se enviará en el encabezado X-API-Key
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button 
                    onClick={handleSaveServerConfig}
                    className="flex-1"
                  >
                    Guardar Configuración
                  </Button>
                  
                  <Button 
                    onClick={testServerConnection}
                    variant="outline"
                    disabled={testingServerConnection || !serverConfig.serverBackupUrl}
                    className="flex items-center gap-2"
                  >
                    {testingServerConnection && <Loader2 className="h-4 w-4 animate-spin" />}
                    Probar Conexión
                  </Button>
                </div>
                
                <div className="mt-4">
                  <Button 
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowPhpInstructions(!showPhpInstructions)}
                  >
                    {showPhpInstructions ? "Ocultar instrucciones" : "Mostrar instrucciones para hosting compartido"}
                  </Button>
                  
                  {showPhpInstructions && (
                    <div className="mt-4 p-4 bg-black/30 rounded-md border border-purple-800">
                      <h3 className="font-medium text-white mb-2">Configuración en Hosting Compartido</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                        <li>Descarga el archivo PHP receptor haciendo clic en el botón de abajo</li>
                        <li>Sube este archivo a tu hosting compartido (ej: <code>public_html/backup-receiver.php</code>)</li>
                        <li>Crea una carpeta llamada <code>backups</code> en el mismo directorio</li>
                        <li>Asegúrate que la carpeta tiene permisos de escritura (chmod 755 o 775)</li>
                        <li>Configura la URL completa en este formulario (ej: <code>https://tudominio.com/backup-receiver.php</code>)</li>
                      </ol>
                      
                      <Button 
                        variant="outline" 
                        onClick={downloadPhpReceiver}
                        className="mt-3"
                      >
                        Descargar archivo PHP receptor
                      </Button>
                      
                      <p className="text-xs text-gray-400 mt-3">
                        Nota: El archivo descargado ya incluye tu clave API configurada.
                      </p>
                    </div>
                  )}
                </div>
                
                <Alert>
                  <AlertDescription className="text-white">
                    El sistema enviará cada {backupInterval} minutos una copia de la base de datos vía POST al servidor configurado.
                    Los respaldos se organizarán automáticamente por ID de negocio en el servidor.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Configuración Google Cloud</CardTitle>
            <CardDescription className="text-white">
              Configura respaldos automáticos a Google Cloud Storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="cloud-enabled"
                checked={cloudConfig.cloudEnabled}
                onCheckedChange={(checked) => handleCloudConfigChange('cloudEnabled', checked)}
              />
              <Label htmlFor="cloud-enabled" className="text-white">Habilitar respaldo a Google Cloud Storage</Label>
            </div>

            {!cloudSignedIn ? (
              <Button 
                onClick={handleSignInToCloud}
                className="flex items-center gap-2"
                variant="secondary"
              >
                <Cloud className="h-4 w-4" />
                Conectar con Google Cloud
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-green-600">
                    Conectado a Google Cloud
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSignOutFromCloud}
                  >
                    Desconectar
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project-id" className="text-white">ID del Proyecto</Label>
                  <Input
                    id="project-id"
                    type="text"
                    className="text-white"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="my-gcp-project-id"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bucket-name" className="text-white">Nombre del bucket</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="bucket-name"
                      type="text"
                      className="flex-1 text-white"
                      value={newBucketName}
                      onChange={(e) => setNewBucketName(e.target.value)}
                    />
                    <Button 
                      onClick={handleCreateBucket}
                      disabled={isCreatingBucket || !newBucketName.trim() || !projectId.trim()}
                    >
                      {isCreatingBucket ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
                    </Button>
                  </div>
                </div>
                
                {cloudConfig.cloudBucketName && (
                  <p className="text-sm text-white">
                    Bucket configurado para respaldos: {cloudConfig.cloudBucketName}
                  </p>
                )}
                
                <Button 
                  onClick={handleTestCloudConnection}
                  disabled={isTestingConnection}
                  variant="outline"
                  className="w-full"
                >
                  {isTestingConnection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Probar conexión con Google Cloud
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Información del Sistema</CardTitle>
          <CardDescription className="text-white">
            Información sobre el sistema de respaldos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white">
            Esta aplicación utiliza respaldos locales que se guardan en el dispositivo actual.
            Los respaldos contienen todos los datos de tu restaurante (productos, clientes, pedidos, etc).
          </p>
          <p className="text-white">
            Es importante mantener copias de seguridad regulares para evitar pérdida de datos.
            Te recomendamos configurar respaldos automáticos a un servidor remoto o Google Cloud Storage para mayor seguridad.
          </p>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-white">Recomendaciones</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-white">
              <li>Configura respaldos automáticos con un intervalo adecuado (cada 5-10 minutos)</li>
              <li>Utiliza la opción de respaldo a servidor remoto para enviar datos al administrador</li>
              <li>Revisa periódicamente que los respaldos se estén realizando correctamente</li>
              <li>Realiza respaldos manuales adicionales antes de cambios importantes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSettings;
