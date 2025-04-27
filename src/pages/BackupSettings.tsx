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
  setFTPConfig
} from "@/utils/autoBackup";
import { Auth } from "@/lib/auth";
import AuthScreen from "@/components/auth/AuthScreen";
import { Loader2, Save, FolderOpen, AlertTriangle } from "lucide-react";
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
  const [ftpConfig, setFtpConfig] = useState({
    ftpEnabled: false,
    ftpHost: '',
    ftpUser: '',
    ftpPassword: '',
    ftpPath: '/backups'
  });
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
    
    return () => clearInterval(checkInterval);
  }, []);
  
  const handleCreateLocalBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const filename = await createBackup();
      if (filename) {
        setLastBackupDate(new Date().toISOString());
        toast({
          title: "Respaldo local creado",
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

  const handleFTPConfigChange = (field: string, value: string | boolean) => {
    const newConfig = {
      ...ftpConfig,
      [field]: value
    };
    setFtpConfig(newConfig);
    setFTPConfig(newConfig);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <AuthScreen isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuración de Respaldos</h1>
        {auth.isAuthenticated() ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
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
            <CardTitle>Respaldos Manuales</CardTitle>
            <CardDescription>
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
                {isCreatingBackup ? "Creando respaldo..." : "Crear Respaldo Local"}
              </Button>
              
              {lastBackupDate && (
                <p className="text-sm text-muted-foreground mt-2">
                  Último respaldo: {new Date(lastBackupDate).toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backup-file">Restaurar desde archivo</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
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
            <CardTitle>Respaldos Automáticos</CardTitle>
            <CardDescription>
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
                <p className="text-sm text-muted-foreground">
                  Selecciona una carpeta para guardar los respaldos automáticos (solo Chrome/Edge).
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backup-interval">Intervalo de respaldo (minutos)</Label>
                <Input
                  id="backup-interval"
                  type="number"
                  min="1"
                  value={backupInterval}
                  onChange={(e) => setBackupInterval(e.target.value)}
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
              <AlertDescription>
                Con la carpeta configurada, los respaldos se guardarán automáticamente sin ventanas de descarga.
                Esta función solo está disponible en Chrome, Edge y otros navegadores basados en Chromium.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Configuración FTP</CardTitle>
            <CardDescription>
              Configura los datos de tu hosting compartido para el respaldo automático
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="ftp-enabled"
                checked={ftpConfig.ftpEnabled}
                onCheckedChange={(checked) => handleFTPConfigChange('ftpEnabled', checked)}
              />
              <Label htmlFor="ftp-enabled">Habilitar respaldo FTP</Label>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ftp-host">Host FTP</Label>
                <Input
                  id="ftp-host"
                  type="text"
                  value={ftpConfig.ftpHost}
                  onChange={(e) => handleFTPConfigChange('ftpHost', e.target.value)}
                  placeholder="ftp.tudominio.com"
                />
              </div>

              <div>
                <Label htmlFor="ftp-user">Usuario FTP</Label>
                <Input
                  id="ftp-user"
                  type="text"
                  value={ftpConfig.ftpUser}
                  onChange={(e) => handleFTPConfigChange('ftpUser', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="ftp-password">Contraseña FTP</Label>
                <Input
                  id="ftp-password"
                  type="password"
                  value={ftpConfig.ftpPassword}
                  onChange={(e) => handleFTPConfigChange('ftpPassword', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="ftp-path">Ruta en el servidor</Label>
                <Input
                  id="ftp-path"
                  type="text"
                  value={ftpConfig.ftpPath}
                  onChange={(e) => handleFTPConfigChange('ftpPath', e.target.value)}
                  placeholder="/backups"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
          <CardDescription>
            Información sobre el sistema de respaldos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Esta aplicación utiliza respaldos locales que se guardan en el dispositivo actual.
            Los respaldos contienen todos los datos de tu restaurante (productos, clientes, pedidos, etc).
          </p>
          <p>
            Es importante mantener copias de seguridad regulares para evitar pérdida de datos.
            Te recomendamos configurar respaldos automáticos y guardarlos en un lugar seguro.
          </p>
          <div className="mt-4">
            <h3 className="text-lg font-medium">Recomendaciones</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Configura respaldos automáticos con un intervalo adecuado (cada 10-30 minutos)</li>
              <li>Configura tu navegador para guardar los respaldos en una carpeta específica</li>
              <li>Realiza copias de seguridad externas periódicamente (disco duro externo, nube, etc)</li>
              <li>Etiqueta los respaldos con fechas para identificarlos fácilmente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSettings;
