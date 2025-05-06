
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
  testSupabaseStorageConnection
} from "@/utils/autoBackup"
import { Badge } from "@/components/ui/badge"
import { useBackupMonitor } from "@/hooks/useBackupMonitor"
import { toast } from "sonner"
import { setupBackupBucket } from "@/utils/setupBackupBucket"

export default function RespaldosPage() {
  const { toast: toastUI } = useToast()
  const [autoBackupActive, setAutoBackupActive] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isBucketSetup, setIsBucketSetup] = useState(false)
  
  // Use the backup monitor hook
  const backupMonitor = useBackupMonitor();

  useEffect(() => {
    setAutoBackupActive(isAutoBackupEnabled())
    setLastBackup(getLastBackupDate())
    
    // Check if the backup bucket is properly set up
    const checkBucket = async () => {
      const result = await testSupabaseStorageConnection();
      setIsBucketSetup(result.success);
    }
    
    checkBucket();
  }, [])

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
          toastUI({
            title: "Error al configurar el almacenamiento",
            description: "No se pudo configurar el bucket para respaldos",
            variant: "destructive"
          });
          setIsSyncing(false);
          return;
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
          </div>
        </div>
      </div>
    </div>
  )
}
