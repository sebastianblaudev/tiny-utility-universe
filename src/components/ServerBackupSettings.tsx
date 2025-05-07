
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, RefreshCw } from "lucide-react";
import { 
  getBackupConfig, 
  updateBackupConfig, 
  performServerBackup, 
  startServerBackups, 
  stopServerBackups 
} from "@/utils/backupService";

export function ServerBackupSettings() {
  const [backupInterval, setBackupInterval] = useState('60'); // valor por defecto: 60 minutos
  const [serverUrl, setServerUrl] = useState('');
  const [serverBackupEnabled, setServerBackupEnabled] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

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
              placeholder="https://your-backup-server.com/api/backups"
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

          <div className="flex justify-end">
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
