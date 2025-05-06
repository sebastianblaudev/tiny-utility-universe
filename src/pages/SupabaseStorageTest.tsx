
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { testSupabaseStorageConnection, listCloudBackups } from "@/utils/autoBackup";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function SupabaseStorageTest() {
  const [connectionStatus, setConnectionStatus] = useState<{
    checked: boolean;
    success?: boolean;
    message?: string;
  }>({ checked: false });
  
  const [backups, setBackups] = useState<{ name: string; path: string; updated_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [buckets, setBuckets] = useState<{name: string, id: string, public: boolean}[]>([
    { name: 'local-backup', id: 'local-1', public: false }
  ]);

  async function checkConnection() {
    setIsLoading(true);
    try {
      const result = await testSupabaseStorageConnection();
      setConnectionStatus({
        checked: true,
        success: result.success,
        message: result.message
      });
      
      // If connection is successful, list available backups
      if (result.success) {
        const backupsList = await listCloudBackups();
        setBackups(backupsList);
      }
      
      toast[result.success ? "success" : "error"](
        result.success ? "Conexión exitosa" : "Error de conexión",
        { description: result.message }
      );
    } catch (error) {
      setConnectionStatus({
        checked: true,
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido"
      });
      toast.error("Error al verificar conexión", {
        description: error instanceof Error ? error.message : "Error desconocido"
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function createBucket(name: string) {
    try {
      // Simplified version that just adds a bucket to the local state
      const newBucket = {
        name,
        id: `local-${Date.now()}`,
        public: false
      };
      
      setBuckets([...buckets, newBucket]);
      
      toast.success("Bucket creado localmente", {
        description: `Se ha creado el bucket ${name} (simulación)`
      });
      
    } catch (error) {
      toast.error("Error al crear bucket", {
        description: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  useEffect(() => {
    // Check connection when component mounts
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto p-4 relative">
        <BackButton />
        
        <div className="max-w-4xl mx-auto mt-12 space-y-6">
          <h1 className="text-2xl font-bold mb-6 text-white">Test de Conexión Almacenamiento Local</h1>
          
          <Card className="bg-[#1A1A1A] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Estado de Conexión</CardTitle>
              <CardDescription className="text-gray-400">
                Prueba la conexión con almacenamiento local para respaldos
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {connectionStatus.checked && (
                <Alert className={connectionStatus.success ? "bg-green-800/20" : "bg-red-800/20"}>
                  {connectionStatus.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <AlertDescription className="text-white">
                    {connectionStatus.message}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={checkConnection} 
                disabled={isLoading}
                className={isLoading ? "opacity-50" : ""}
              >
                {isLoading ? "Verificando..." : "Verificar Conexión"}
              </Button>
              
              {buckets.length > 0 && (
                <>
                  <h3 className="text-lg font-medium mt-6">Buckets Disponibles (Simulación)</h3>
                  <div className="border rounded-md overflow-hidden border-zinc-700">
                    <table className="w-full">
                      <thead className="bg-zinc-800">
                        <tr>
                          <th className="text-left p-3">Nombre</th>
                          <th className="text-left p-3">ID</th>
                          <th className="text-left p-3">Acceso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buckets.map((bucket, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-zinc-900/50" : ""}>
                            <td className="p-3">
                              {bucket.name}
                              {bucket.name === 'bkpid' && (
                                <Badge className="ml-2 bg-green-600">Principal</Badge>
                              )}
                            </td>
                            <td className="p-3">{bucket.id}</td>
                            <td className="p-3">
                              {bucket.public ? "Público" : "Privado"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <Button 
                    onClick={() => createBucket("bkpid")}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={buckets.some(b => b.name === "bkpid")}
                  >
                    {buckets.some(b => b.name === "bkpid") 
                      ? "Bucket bkpid ya existe" 
                      : "Crear bucket bkpid"}
                  </Button>
                </>
              )}
              
              {backups.length > 0 && (
                <>
                  <h3 className="text-lg font-medium mt-6">Respaldos Disponibles</h3>
                  <div className="border rounded-md overflow-hidden border-zinc-700">
                    <table className="w-full">
                      <thead className="bg-zinc-800">
                        <tr>
                          <th className="text-left p-3">Nombre</th>
                          <th className="text-left p-3">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backups.map((backup, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-zinc-900/50" : ""}>
                            <td className="p-3">{backup.name}</td>
                            <td className="p-3">
                              {new Date(backup.updated_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              
              {connectionStatus.success && backups.length === 0 && (
                <Alert className="bg-blue-800/20">
                  <AlertDescription className="text-white">
                    Conexión establecida pero no hay respaldos disponibles.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
