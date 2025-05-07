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
  isAutoCloudBackupEnabled,
  setAutoCloudBackup,
  isSupabaseBackupEnabled,
  setSupabaseBackupEnabled
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
import { Loader2, Save, FolderOpen, AlertTriangle, Cloud, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ServerBackupSettings } from "@/components/ServerBackupSettings";

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
  
  // ... keep existing code (cloud config states)
  const [cloudConfig, setCloudConfigState] = useState({
    cloudEnabled: isCloudEnabled(),
    cloudBucketName: getCloudBucketName(),
    supabaseEnabled: isSupabaseBackupEnabled() // Add Supabase enabled state
  });
  const [cloudSignedIn, setCloudSignedIn] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState('pizzapos-backups');
  const [projectId, setProjectId] = useState('');
  const [autoCloudBackup, setAutoCloudBackup] = useState(isAutoCloudBackupEnabled());
  const [supabaseEnabled, setSupabaseEnabled] = useState(isSupabaseBackupEnabled());
  
  const { toast } = useToast();
  const auth = Auth.getInstance();
  const [isSyncing, setIsSyncing] = useState(false);
  
  useEffect(() => {
    setAutoBackupEnabled(isAutoBackupEnabled());
    setBackupInterval(String(getBackupInterval()));
    setLastBackupDate(getLastBackupDate());
    setIsInIframe(window !== window.top);
    setAutoCloudBackup(isAutoCloudBackupEnabled());
    setSupabaseEnabled(isSupabaseBackupEnabled()); // Add this line
    
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
  
  const handleAutoCloudBackupChange = (checked: boolean) => {
    setAutoCloudBackup(checked);
    setAutoCloudBackup?.(checked);
  };
  
  const handleSupabaseEnabledChange = (checked: boolean) => {
    setSupabaseEnabled(checked);
    setSupabaseBackupEnabled(checked);
    handleCloudConfigChange('supabaseEnabled', checked);
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

  // Nueva función para sincronización manual con Supabase
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const filename = await createBackup();
      if (filename) {
        setLastBackupDate(new Date().toISOString());
        toast({
          title: "Sincronización completada",
          description: "Los datos se han sincronizado con la nube correctamente"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo sincronizar con la nube",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al sincronizar",
      });
    } finally {
      setIsSyncing(false);
    }
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
            {/* Nuevo botón de sincronización */}
            <div className="space-y-2">
              <Button 
                onClick={handleSyncNow} 
                disabled={isSyncing}
                className="flex items-center gap-2 w-full bg-[#4A64E2] hover:bg-[#3B51B8]"
              >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isSyncing ? "Sincronizando con la nube..." : "Sincronizar Ahora"}
              </Button>
            </div>

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
        
        {/* Nueva tarjeta para respaldos en servidor */}
        <ServerBackupSettings />
        
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

            {/* Auto Cloud Backup toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-cloud-backup"
                checked={autoCloudBackup}
                onCheckedChange={handleAutoCloudBackupChange}
              />
              <Label htmlFor="auto-cloud-backup" className="text-white">Subir respaldo automáticamente a la nube</Label>
              <div className="text-sm text-gray-400">(Se reemplaza cada 5 min)</div>
            </div>
            
            {/* New toggle for Supabase backups */}
            <div className="flex items-center space-x-2">
              <Switch
                id="supabase-enabled"
                checked={supabaseEnabled}
                onCheckedChange={handleSupabaseEnabledChange}
              />
              <Label htmlFor="supabase-enabled" className="text-white">Habilitar respaldos en Supabase Storage</Label>
              <div className="text-sm text-green-400">(Recomendado)</div>
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
            Te recomendamos configurar respaldos automáticos para mayor seguridad.
          </p>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-white">Recomendaciones</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-white">
              <li>Configura respaldos automáticos con un intervalo adecuado (cada 5-10 minutos)</li>
              <li>Realiza respaldos manuales adicionales antes de cambios importantes</li>
              <li>Revisa periódicamente que los respaldos se estén realizando correctamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSettings;
