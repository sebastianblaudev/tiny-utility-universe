import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, RefreshCw, Server, RadioTower } from "lucide-react";
import { 
  getBackupConfig, 
  updateBackupConfig, 
  performServerBackup, 
  startServerBackups, 
  stopServerBackups,
  uploadBackupToServer
} from "@/utils/backupService";

export function ServerBackupSettings() {
  const [backupInterval, setBackupInterval] = useState('60'); // valor por defecto: 60 minutos
  const [serverUrl, setServerUrl] = useState('');
  const [serverBackupEnabled, setServerBackupEnabled] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [testInProgress, setTestInProgress] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  const { toast } = useToast();

  // Cargar configuración al montar el componente
  useEffect(() => {
    const loadConfig = async () => {
      const config = await getBackupConfig();
      if (config) {
        setBackupInterval(String(config.interval || 60));
        setServerUrl(config.serverBackupUrl || '');
        setServerBackupEnabled(config.serverBackupEnabled || false);
        setLastBackupDate(config.lastBackupDate || null);
      }
    };

    loadConfig();
  }, []);

  // Manejar cambios en la configuración
  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      const interval = parseInt(backupInterval, 10);
      if (isNaN(interval) || interval < 1) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Por favor ingresa un intervalo válido (minutos)",
        });
        setIsLoading(false);
        return;
      }

      if (!serverUrl.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Por favor ingresa la URL del servidor de respaldos",
        });
        setIsLoading(false);
        return;
      }

      // Actualizar configuración
      const updated = await updateBackupConfig({
        serverBackupUrl: serverUrl,
        interval: interval
      });

      if (updated) {
        toast({
          title: "Configuración guardada",
          description: "La configuración de respaldos al servidor se ha guardado correctamente",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar la configuración",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al guardar configuración",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio de estado de respaldos automáticos
  const handleToggleBackups = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      if (enabled) {
        // Verificar configuración
        const interval = parseInt(backupInterval, 10);
        if (isNaN(interval) || interval < 1) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Por favor ingresa un intervalo válido (minutos)",
          });
          setIsLoading(false);
          return;
        }

        if (!serverUrl.trim()) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Por favor ingresa la URL del servidor de respaldos",
          });
          setIsLoading(false);
          return;
        }

        // Iniciar respaldos
        const started = await startServerBackups(interval);
        if (started) {
          setServerBackupEnabled(true);
          toast({
            title: "Respaldos iniciados",
            description: `Se realizarán respaldos automáticos cada ${interval} minutos`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron iniciar los respaldos automáticos",
          });
        }
      } else {
        // Detener respaldos
        const stopped = stopServerBackups();
        await updateBackupConfig({ serverBackupEnabled: false });
        setServerBackupEnabled(false);
        toast({
          title: "Respaldos detenidos",
          description: "Los respaldos automáticos al servidor han sido detenidos",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar respaldo manual
  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      // Verificar URL
      if (!serverUrl.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Por favor ingresa la URL del servidor de respaldos",
        });
        setIsBackingUp(false);
        return;
      }

      // Guardar URL primero
      await updateBackupConfig({ serverBackupUrl: serverUrl });

      // Realizar respaldo
      const success = await performServerBackup();
      if (success) {
        const now = new Date().toISOString();
        setLastBackupDate(now);
        toast({
          title: "Respaldo realizado",
          description: "El respaldo ha sido enviado exitosamente al servidor",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo realizar el respaldo al servidor",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al realizar respaldo",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Test connection to server
  const testServerConnection = async () => {
    setTestInProgress(true);
    setTestResult(null);
    
    try {
      if (!serverUrl.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Por favor ingresa la URL del servidor de respaldos",
        });
        setTestInProgress(false);
        return;
      }

      // Save the URL first
      await updateBackupConfig({ serverBackupUrl: serverUrl });

      // Create minimal test data
      const testData = {
        timestamp: new Date().toISOString(),
        businessId: 'test-connection',
        business: { name: 'Test Connection' },
        products: [],
        customers: [],
        orders: [],
        tables: []
      };

      // Try to upload the test data
      const result = await uploadBackupToServer(testData);
      
      if (result) {
        setTestResult({
          success: true,
          message: "Conexión exitosa. El servidor respondió correctamente."
        });
        toast({
          title: "Prueba exitosa",
          description: "La conexión con el servidor de respaldos funciona correctamente",
        });
      } else {
        setTestResult({
          success: false,
          message: "El servidor no respondió correctamente. Verifica la URL y que el servidor esté en funcionamiento."
        });
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo conectar con el servidor de respaldos",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido al probar la conexión"
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al probar la conexión",
      });
    } finally {
      setTestInProgress(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="bg-[#1A1A1A] border-zinc-800 text-white">
      <CardHeader>
        <CardTitle>Respaldos en Servidor</CardTitle>
        <CardDescription className="text-zinc-400">
          Configura respaldos automáticos al servidor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-url">URL del servidor de respaldos</Label>
            <Input
              id="server-url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://pizzapos.app/subir_respaldo.php"
              className="bg-zinc-900 border-zinc-700 text-white"
            />
            <p className="text-xs text-zinc-500">
              URL donde se enviarán los respaldos en formato JSON
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
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>

          <div className="flex justify-between items-center">
            <Button
              onClick={testServerConnection}
              disabled={testInProgress}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              {testInProgress ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RadioTower className="h-4 w-4 mr-2" />
              )}
              Probar Conexión
            </Button>

            <Button
              onClick={handleSaveConfig}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Configuración
            </Button>
          </div>

          {testResult && (
            <Alert className={testResult.success ? "bg-green-900/20 border-green-800" : "bg-red-900/20 border-red-800"}>
              <AlertTitle className={testResult.success ? "text-green-400" : "text-red-400"}>
                {testResult.success ? "Conexión Exitosa" : "Error de Conexión"}
              </AlertTitle>
              <AlertDescription className="text-zinc-300">
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <div className="flex flex-col">
              <span className="font-medium">Respaldos automáticos</span>
              <span className="text-zinc-400 text-sm">
                {serverBackupEnabled
                  ? `Activo (cada ${backupInterval} minutos)`
                  : "Desactivado"}
              </span>
            </div>
            <Switch
              checked={serverBackupEnabled}
              onCheckedChange={handleToggleBackups}
              disabled={isLoading}
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleManualBackup}
              disabled={isBackingUp}
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              {isBackingUp ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Realizar Respaldo Ahora
            </Button>
          </div>

          {lastBackupDate && (
            <Alert className="bg-zinc-900 border-zinc-700">
              <Server className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-zinc-300">
                Último respaldo: {formatDate(lastBackupDate)}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
