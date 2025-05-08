
import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { syncBackup, startAutoSync, stopAutoSync, isAutoSyncEnabled } from "@/utils/syncBackup";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, LineChart } from "lucide-react";

export default function Sync() {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Cargar estado inicial de sincronización automática
  useEffect(() => {
    setAutoSyncEnabled(isAutoSyncEnabled());
  }, []);

  // Manejar cambio de estado del switch de sincronización automática
  const handleAutoSyncChange = (checked: boolean) => {
    if (checked) {
      startAutoSync();
    } else {
      stopAutoSync();
    }
    setAutoSyncEnabled(checked);
  };

  // Realizar sincronización manual
  const handleManualSync = async () => {
    setSyncInProgress(true);
    
    try {
      const success = await syncBackup();
      
      if (success) {
        toast.success("Sincronización completada", {
          description: "Los datos se han sincronizado correctamente"
        });
        setLastSyncTime(new Date().toLocaleString());
      } else {
        toast.error("Error de sincronización", {
          description: "No se pudieron sincronizar los datos. Intenta de nuevo."
        });
      }
    } catch (error) {
      console.error("Error en sincronización manual:", error);
      toast.error("Error de sincronización", {
        description: error instanceof Error ? error.message : "Error desconocido"
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4">
      <div className="max-w-md mx-auto">
        <BackButton />
        
        <h1 className="text-2xl font-bold mb-6 text-center">Sincronización</h1>
        
        <Card className="bg-[#1A1A1A] border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Sincronización Automática</CardTitle>
            <CardDescription className="text-gray-400">
              Mantén tus datos respaldados automáticamente cada 5 minutos en la nube.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sync" className="text-white">
                Sincronización automática
              </Label>
              <Switch
                id="auto-sync"
                checked={autoSyncEnabled}
                onCheckedChange={handleAutoSyncChange}
              />
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              {autoSyncEnabled
                ? "La sincronización automática está activa. Tus datos se sincronizarán cada 5 minutos."
                : "La sincronización automática está desactivada."}
            </p>
          </CardFooter>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Sincronización Manual</CardTitle>
            <CardDescription className="text-gray-400">
              Sincroniza tus datos ahora con el servidor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleManualSync}
              className="w-full bg-[#4A64E2] hover:bg-[#3B51B8]"
              disabled={syncInProgress}
            >
              {syncInProgress ? "Sincronizando..." : "Sincronizar Ahora"}
            </Button>
            
            {lastSyncTime && (
              <p className="mt-4 text-sm text-gray-500 text-center">
                Última sincronización: {lastSyncTime}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Monitor de Ventas</CardTitle>
            <CardDescription className="text-gray-400">
              Accede al monitor de ventas para visualizar estadísticas de tu negocio desde cualquier lugar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <LineChart className="h-5 w-5 mr-2 text-blue-500" />
                <span>Ver estadísticas en tiempo real</span>
              </div>
              <Link to="/monitor">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  Abrir <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <ExternalLink className="h-5 w-5 mr-2 text-green-500" />
                <span>Acceso remoto</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs"
                onClick={() => {
                  const url = window.location.origin + "/monitor";
                  navigator.clipboard.writeText(url);
                  toast.success("URL copiada", { description: "URL del monitor copiada al portapapeles" });
                }}
              >
                Copiar URL
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
