
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, ServerCog, RadioTower, Server } from "lucide-react";
import { getBackupConfig, updateBackupConfig, uploadBackupToServer } from "@/utils/backupService";

export default function ServerBackupTest() {
  const [serverUrl, setServerUrl] = useState('');
  const [testInProgress, setTestInProgress] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [responseDetails, setResponseDetails] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Cargar la URL guardada al montar el componente
  React.useEffect(() => {
    const loadConfig = async () => {
      const config = await getBackupConfig();
      if (config && config.serverBackupUrl) {
        setServerUrl(config.serverBackupUrl);
      } else {
        // URL predeterminada si no hay configuración
        setServerUrl('https://pizzapos.app/subir_respaldo.php');
      }
    };
    
    loadConfig();
  }, []);
  
  // Función para probar la conexión
  const testServerConnection = async () => {
    setTestInProgress(true);
    setTestResult(null);
    setResponseDetails(null);
    
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

      // Guardar la URL primero
      await updateBackupConfig({ serverBackupUrl: serverUrl });

      // Crear datos mínimos para la prueba
      const testData = {
        timestamp: new Date().toISOString(),
        businessId: 'test-connection-' + Math.random().toString(36).substring(2, 7),
        business: { 
          name: 'Test Connection',
          id: 'test-biz-' + Math.random().toString(36).substring(2, 7)
        },
        products: [{ id: 'test-product', name: 'Test Product' }],
        customers: [{ id: 'test-customer', name: 'Test Customer' }],
        orders: [{ id: 'test-order', total: 100 }],
        tables: []
      };

      // Intentar subir los datos de prueba
      let rawResponse: Response | null = null;
      let responseText: string | null = null;
      
      try {
        // Obtenemos la URL del servidor
        const serverUrl = (await getBackupConfig())?.serverBackupUrl || 'https://pizzapos.app/subir_respaldo.php';
        
        // Preparamos el cuerpo de la solicitud según el formato esperado por el PHP
        const requestBody = {
          id_negocio: testData.businessId,
          respaldo: testData
        };
        
        // Hacemos la solicitud al servidor PHP y capturamos la respuesta completa
        rawResponse = await fetch(serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        // Guardamos el texto de respuesta
        responseText = await rawResponse.text();
        
        // Intentamos analizar como JSON si es posible
        let jsonResponse = null;
        try {
          jsonResponse = JSON.parse(responseText);
          setResponseDetails(JSON.stringify(jsonResponse, null, 2));
        } catch (e) {
          // Si no es JSON válido, mostramos el texto plano
          setResponseDetails(responseText);
        }
        
        if (rawResponse.ok) {
          setTestResult({
            success: true,
            message: `Conexión exitosa. Código de estado HTTP: ${rawResponse.status}`
          });
          toast({
            title: "Prueba exitosa",
            description: "La conexión con el servidor de respaldos funciona correctamente",
          });
        } else {
          setTestResult({
            success: false,
            message: `El servidor respondió con código de error: ${rawResponse.status} ${rawResponse.statusText}`
          });
          toast({
            variant: "destructive",
            title: "Error",
            description: `Error en la respuesta: ${rawResponse.status} ${rawResponse.statusText}`,
          });
        }
      } catch (networkError) {
        console.error("Error de red:", networkError);
        setTestResult({
          success: false,
          message: "Error de red al intentar conectar con el servidor"
        });
        setResponseDetails(`Error: ${networkError instanceof Error ? networkError.message : String(networkError)}`);
        toast({
          variant: "destructive",
          title: "Error de red",
          description: networkError instanceof Error ? networkError.message : "Error al conectar con el servidor",
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto p-4 relative">
        <BackButton />
        <div className="max-w-3xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-white">Prueba de Conexión con el Servidor PHP</h1>
          
          <Card className="bg-[#1A1A1A] border-zinc-800 text-white mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <ServerCog className="h-6 w-6 text-orange-500" />
                <CardTitle>Configuración del Servidor</CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                Configura y prueba la conexión al servidor de respaldos PHP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="pt-4">
                <Button
                  onClick={testServerConnection}
                  disabled={testInProgress}
                  className="bg-orange-600 hover:bg-orange-700 w-full"
                >
                  {testInProgress ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RadioTower className="h-4 w-4 mr-2" />
                  )}
                  {testInProgress ? "Probando Conexión..." : "Probar Conexión al Servidor"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {testResult && (
            <Card className={testResult.success ? "bg-green-900/20 border-green-800" : "bg-red-900/20 border-red-800"}>
              <CardHeader>
                <CardTitle className={testResult.success ? "text-green-400" : "text-red-400"}>
                  {testResult.success ? "Conexión Exitosa ✓" : "Error de Conexión ✗"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-300">{testResult.message}</p>
                
                {responseDetails && (
                  <div className="mt-4">
                    <Label>Respuesta del servidor:</Label>
                    <div className="bg-black/50 border border-zinc-800 rounded-md p-3 mt-2 overflow-x-auto">
                      <pre className="text-xs text-zinc-300 whitespace-pre-wrap">{responseDetails}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
              {testResult.success && (
                <CardFooter>
                  <Alert className="bg-zinc-900 border-zinc-700">
                    <Server className="h-4 w-4 text-orange-500" />
                    <AlertTitle>Configuración correcta</AlertTitle>
                    <AlertDescription className="text-zinc-300">
                      El servidor está configurado correctamente para recibir respaldos.
                    </AlertDescription>
                  </Alert>
                </CardFooter>
              )}
            </Card>
          )}
          
          <Card className="bg-[#1A1A1A] border-zinc-800 text-white mt-6">
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 text-sm">
                Esta herramienta envía un conjunto mínimo de datos de prueba al servidor PHP para verificar si está
                configurado correctamente para recibir respaldos del sistema. No se modifican datos reales.
              </p>
              <div className="mt-4 p-3 bg-zinc-900 rounded-md">
                <h3 className="text-sm font-medium mb-2">Formato esperado por el PHP:</h3>
                <pre className="text-xs text-zinc-400 overflow-x-auto">
{`{
  "id_negocio": "identificador-del-negocio",
  "respaldo": {
    // Datos completos del respaldo
    "products": [...],
    "customers": [...],
    "orders": [...],
    ...
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
