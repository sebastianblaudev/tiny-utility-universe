
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, FolderOpen, Upload, Server, Mail } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import { 
  selectBackupDirectory, 
  createBackup, 
  startAutoBackup, 
  stopAutoBackup, 
  isAutoBackupEnabled,
  getLastBackupDate,
  restoreFromLocalBackup,
  isServerBackupEnabled,
  getServerBackupUrl,
  initializeBackupSystem,
  getBusinessEmail
} from "@/utils/autoBackup"
import { Badge } from "@/components/ui/badge"
import { useBackupMonitor } from "@/hooks/useBackupMonitor"

export default function RespaldosPage() {
  const { toast } = useToast()
  const [autoBackupActive, setAutoBackupActive] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [serverBackupActive, setServerBackupActive] = useState(false)
  const [serverUrl, setServerUrl] = useState<string>("")
  const [businessEmail, setBusinessEmail] = useState<string>("")
  
  // Use the backup monitor hook
  const backupMonitor = useBackupMonitor();

  useEffect(() => {
    // Initialize the backup system on component mount
    initializeBackupSystem();
    
    setAutoBackupActive(isAutoBackupEnabled())
    setLastBackup(getLastBackupDate())
    setServerBackupActive(isServerBackupEnabled())
    setServerUrl(getServerBackupUrl())
    setBusinessEmail(getBusinessEmail())
  }, [])

  // Update from backupMonitor
  useEffect(() => {
    setAutoBackupActive(backupMonitor.isBackupRunning);
    setServerBackupActive(backupMonitor.isServerEnabled);
    setLastBackup(backupMonitor.lastBackupTime);
    if (backupMonitor.serverUrl) {
      setServerUrl(backupMonitor.serverUrl);
    }
    if (backupMonitor.businessEmail) {
      setBusinessEmail(backupMonitor.businessEmail);
    }
  }, [backupMonitor]);

  const handleSelectDirectory = async () => {
    const success = await selectBackupDirectory()
    if (success) {
      toast({
        title: "Carpeta seleccionada",
        description: "La carpeta para respaldos ha sido configurada correctamente."
      })
    }
  }

  const handleCreateBackup = async () => {
    const filename = await createBackup()
    if (filename) {
      setLastBackup(new Date().toISOString())
      toast({
        title: "Respaldo creado",
        description: `Se ha creado el respaldo: ${filename}`
      })
    } else {
      toast({
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
      toast({
        title: "Respaldo automático desactivado",
        description: "Se ha desactivado el respaldo automático"
      })
    } else {
      startAutoBackup(5) // Backup every 5 minutes
      setAutoBackupActive(true)
      toast({
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
        toast({
          title: "Respaldo importado",
          description: "Los datos han sido restaurados correctamente"
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo restaurar el respaldo",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al restaurar el respaldo",
        variant: "destructive"
      })
    } finally {
      setIsRestoring(false)
      event.target.value = '' // Reset file input
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto p-4 relative">
        <BackButton />
        <div className="max-w-4xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-white">Respaldos</h1>
          
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
                    {serverBackupActive && (
                      <Badge className="bg-purple-600">Servidor: Activo</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
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
                
                {serverBackupActive && (
                  <div className="bg-purple-900/30 p-3 rounded-md border border-purple-700 mt-2">
                    <div className="flex items-center space-x-2">
                      <Server className="h-5 w-5 text-purple-400" />
                      <div>
                        <h3 className="text-sm font-medium text-white">
                          Respaldo a servidor remoto activo
                        </h3>
                        {serverUrl && (
                          <p className="text-xs text-purple-300 break-all">
                            Enviando a: {serverUrl}
                          </p>
                        )}
                        {businessEmail && (
                          <div className="flex items-center mt-1">
                            <Mail className="h-3 w-3 text-purple-400 mr-1" />
                            <p className="text-xs text-purple-300 break-all">
                              ID de respaldo: {businessEmail}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
