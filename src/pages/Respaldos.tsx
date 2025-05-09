import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, FolderOpen, Upload, RefreshCw } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import { 
  selectBackupDirectory, 
  createBackup, 
  startAutoBackup, 
  stopAutoBackup, 
  isAutoBackupEnabled,
  getLastBackupDate,
  restoreFromLocalBackup,
  testSupabaseStorageConnection,
  restoreFromCloudBackup,
  listCloudBackups
} from "@/utils/autoBackup";
import { Badge } from "@/components/ui/badge"
import { useBackupMonitor } from "@/hooks/useBackupMonitor"
import { toast } from "sonner"
import { setupBackupBucket, invokeBucketSetupFunction } from "@/utils/setupBackupBucket"

export default function RespaldosPage() {
  const { toast: toastUI } = useToast()
  const [autoBackupActive, setAutoBackupActive] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isBucketSetup, setIsBucketSetup] = useState(false)
  const [backups, setBackups] = useState<{name: string; path: string; updated_at: string}[]>([])
  const [isLoadingBackups, setIsLoadingBackups] = useState(false)
  
  // Use the backup monitor hook
  const backupMonitor = useBackupMonitor();

  useEffect(() => {
    setAutoBackupActive(isAutoBackupEnabled())
    setLastBackup(getLastBackupDate())
    
    // Check if the backup bucket is properly set up
    const checkBucket = async () => {
      const result = await testSupabaseStorageConnection();
      setIsBucketSetup(result.success);
      
      if (result.success) {
        // If connection is successful, load available backups
        loadBackups();
      }
    }
    
    checkBucket();
  }, [])

  const loadBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const backupsList = await listCloudBackups();
      setBackups(backupsList);
    } catch (error) {
      console.error("Error loading backups:", error);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleSelectDirectory = async () => {
    const success = await selectBackupDirectory()
    if (success) {
      toastUI({
        title: "Carpeta seleccionada",
        description: "La carpeta para respaldos ha sido configurada correctamente."
      })
    }
  }

  const handleCreateBackup = async () => {
    const filename = await createBackup()
    if (filename) {
      setLastBackup(new Date().toISOString())
      toastUI({
        title: "Respaldo creado",
        description: `Se ha creado el respaldo: ${filename}`
      })
    } else {
      toastUI({
        title: "Error",
        description: "No se pudo crear el respaldo",
        variant: "destructive"
      })
    }
  }

  const toggleAutoBackup = () => {
    if (autoBackupActive) {
      stopAutoBackup()
      setAutoBackupActive(false)
      toastUI({
        title: "Respaldo automático desactivado",
        description: "Se ha desactivado el respaldo automático"
      })
    } else {
      startAutoBackup(5) // Backup every 5 minutes
      setAutoBackupActive(true)
      toastUI({
        title: "Respaldo automático activado",
        description: "Se realizará un respaldo automático cada 5 minutos"
      })
    }
  }

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsRestoring(true)
    try {
      const success = await restoreFromLocalBackup(file)
      if (success) {
        toastUI({
          title: "Respaldo importado",
          description: "Los datos han sido restaurados correctamente"
        })
      } else {
        toastUI({
          title: "Error",
          description: "No se pudo restaurar el respaldo",
          variant: "destructive"
        })
      }
    } catch (error) {
      toastUI({
        title: "Error",
        description: "Ocurrió un error al restaurar el respaldo",
        variant: "destructive"
      })
    } finally {
      setIsRestoring(false)
      event.target.value = '' // Reset file input
    }
  }

  // Function to restore a cloud backup
  const handleRestoreCloudBackup = async (path: string) => {
    setIsRestoring(true);
    try {
      const success = await restoreFromCloudBackup(path);
      if (success) {
        toastUI({
          title: "Respaldo restaurado",
          description: "Los datos han sido restaurados correctamente desde la nube"
        });
      } else {
        toastUI({
          title: "Error",
          description: "No se pudo restaurar el respaldo desde la nube",
          variant: "destructive"
        });
      }
    } catch (error) {
      toastUI({
        title: "Error",
        description: "Ocurrió un error al restaurar el respaldo",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Function to verify connection with Supabase
  const handleVerifyConnection = async () => {
    setIsVerifying(true);
    try {
      // First try to set up the bucket if needed
      if (!isBucketSetup) {
        const setupResult = await setupBackupBucket();
        if (setupResult) {
          setIsBucketSetup(true);
        }
      }
      
      const result = await testSupabaseStorageConnection();
      if (result.success) {
        toastUI({
          title: "Conexión exitosa",
          description: result.message
        });
        
        // If connection is successful, load available backups
        loadBackups();
      } else {
        toastUI({
          title: "Error de conexión",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toastUI({
        title: "Error",
        description: "No se pudo verificar la conexión",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Function for manual sync with Supabase
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      // First try to set up the bucket if needed
      if (!isBucketSetup) {
        const setupResult = await setupBackupBucket();
        if (!setupResult) {
          // Try invoking the edge function to set up the bucket
          const edgeFunctionResult = await invokeBucketSetupFunction();
          if (!edgeFunctionResult) {
            toastUI({
              title: "Error al configurar el almacenamiento",
              description: "No se pudo configurar el bucket para respaldos",
              variant: "destructive"
            });
            setIsSyncing(false);
            return;
          }
          setIsBucketSetup(true);
        } else {
          setIsBucketSetup(true);
        }
      }
      
      // Then check connection
      const connectionCheck = await testSupabaseStorageConnection();
      if (!connectionCheck.success) {
        toastUI({
          title: "Error de conexión",
          description: connectionCheck.message,
          variant: "destructive"
        });
        setIsSyncing(false);
        return;
      }
      
      const filename = await createBackup();
      if (filename) {
        setLastBackup(new Date().toISOString());
        await loadBackups(); // Reload backups list after creating a new backup
        backupMonitor.refresh(); // Refresh the backup monitor state
        toastUI({
          title: "Sincronización completada",
          description: "Los datos se han sincronizado con la nube correctamente"
        });
      } else {
        toastUI({
          title: "Error",
          description: "No se pudo sincronizar con la nube",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error during sync:", error);
      toastUI({
        title: "Error",
        description: "Ocurrió un error durante la sincronización",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white w-full m-0 p-0">
      <div className="p-4 relative">
        <BackButton />
        <div className="max-w-4xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-white text-center">Respaldos</h1>
          
          <div className="grid gap-6">
            <Card className="bg-[#1A1A1A] border-zinc-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Configuración de Respaldos</CardTitle>
                    <CardDescription className="text-gray-400">
                      Crea, restaura y configura respaldos automáticos.
                    </CardDescription>
                  </div>
                  <div className="space-x-2">
                    {autoBackupActive && (
                      <Badge className="bg-green-600">Auto: Activo</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {/* Botón de verificación de conexión */}
                <Button 
                  onClick={handleVerifyConnection}
                  className="w-full bg-[#67a3ff] hover:bg-[#4b88db] flex items-center justify-center"
                  disabled={isVerifying}
                >
                  <RefreshCw className={`mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
                  {isVerifying ? "Verificando..." : "Verificar Conexión"}
                </Button>
                
                {/* Nuevo botón de sincronización */}
                <Button 
                  onClick={handleSyncNow}
                  className="w-full bg-[#4A64E2] hover:bg-[#3B51B8] flex items-center justify-center"
                  disabled={isSyncing}
                >
                  <RefreshCw className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? "Sincronizando..." : "Sincronizar Ahora"}
                </Button>
                
                <Button 
                  onClick={handleSelectDirectory}
                  className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]"
                >
                  <FolderOpen className="mr-2" />
                  Seleccionar Carpeta de Respaldos
                </Button>
                
                <Button 
                  onClick={handleCreateBackup}
                  className="w-full bg-[#6E59A5] hover:bg-[#9b87f5]"
                >
                  <Save className="mr-2" />
                  Crear Respaldo Ahora
                </Button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                    id="import-backup"
                    disabled={isRestoring}
                  />
                  <Button 
                    onClick={() => document.getElementById('import-backup')?.click()}
                    className="w-full bg-[#403E43] hover:bg-[#8E9196]"
                    disabled={isRestoring}
                  >
                    <Upload className="mr-2" />
                    {isRestoring ? "Importando..." : "Importar Respaldo"}
                  </Button>
                </div>
                
                <Button 
                  onClick={toggleAutoBackup}
                  variant={autoBackupActive ? "destructive" : "outline"}
                  className={autoBackupActive ? "w-full" : "w-full bg-[#403E43] text-white hover:bg-[#8E9196]"}
                >
                  {autoBackupActive ? "Desactivar Respaldo Automático" : "Activar Respaldo Automático"}
                </Button>
                
                {lastBackup && (
                  <p className="text-sm text-gray-400 mt-2">
                    Último respaldo: {new Date(lastBackup).toLocaleString()}
                  </p>
                )}
                
                <Button 
                  onClick={() => window.location.href = '/backup-settings'}
                  variant="outline"
                  className="w-full bg-[#2A2A2A] text-white hover:bg-[#3E3E3E]"
                >
                  Configuración Avanzada de Respaldos
                </Button>
              </CardContent>
            </Card>
            
            {/* Nueva sección para mostrar los respaldos en la nube */}
            {backups.length > 0 && (
              <Card className="bg-[#1A1A1A] border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Respaldos en la Nube</CardTitle>
                  <CardDescription className="text-gray-400">
                    Respaldos guardados en Supabase.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden border-zinc-700">
                    <table className="w-full">
                      <thead className="bg-zinc-800">
                        <tr>
                          <th className="text-left p-3">Nombre</th>
                          <th className="text-left p-3">Fecha</th>
                          <th className="text-center p-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backups.map((backup, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-zinc-900/50" : ""}>
                            <td className="p-3">{backup.name}</td>
                            <td className="p-3">
                              {new Date(backup.updated_at).toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreCloudBackup(backup.path)}
                                disabled={isRestoring}
                              >
                                {isRestoring ? "Restaurando..." : "Restaurar"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <Button 
                    onClick={loadBackups}
                    className="mt-4 w-full bg-[#2A2A2A] hover:bg-[#3E3E3E]"
                    disabled={isLoadingBackups}
                  >
                    <RefreshCw className={`mr-2 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                    {isLoadingBackups ? "Cargando..." : "Actualizar lista de respaldos"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
