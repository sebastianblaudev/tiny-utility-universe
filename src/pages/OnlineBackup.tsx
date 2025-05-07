
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { Save, RefreshCw, Download, LogIn, Cloud } from "lucide-react";
import { Auth } from '@/lib/auth';
import { openDB } from 'idb';
import { DB_NAME } from '@/lib/query-client';
import type { BusinessData } from '@/types/business';
import { 
  initializeGoogleDriveAPI, 
  signInToGoogleDrive, 
  isSignedInToGoogleDrive,
  saveBackupToDrive,
  listDriveBackups,
  fetchBackupFromDrive
} from "@/utils/googleDriveBackup";

export default function OnlineBackup() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupUrl, setBackupUrl] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [backups, setBackups] = useState<Array<{id: string; name: string; modifiedTime: string}>>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  
  // Verificar la conexión con Google Drive al iniciar
  useEffect(() => {
    const checkGoogleDriveConnection = async () => {
      setIsGoogleLoading(true);
      try {
        await initializeGoogleDriveAPI();
        const connected = isSignedInToGoogleDrive();
        setIsGoogleConnected(connected);
        
        // Si está conectado, cargar la lista de respaldos
        if (connected) {
          loadBackupsList();
        }
      } catch (error) {
        console.error("Error al verificar conexión con Google Drive:", error);
      } finally {
        setIsGoogleLoading(false);
      }
    };
    
    checkGoogleDriveConnection();
  }, []);
  
  // Función para conectar con Google Drive
  const connectToGoogleDrive = async () => {
    setIsGoogleLoading(true);
    try {
      await initializeGoogleDriveAPI();
      const connected = await signInToGoogleDrive();
      setIsGoogleConnected(connected);
      
      if (connected) {
        toast({
          title: "Conexión exitosa",
          description: "Se ha conectado correctamente con Google Drive"
        });
        
        // Cargar la lista de respaldos después de conectar
        loadBackupsList();
      } else {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con Google Drive",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al conectar con Google Drive:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al conectar con Google Drive",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  // Función para cargar la lista de respaldos
  const loadBackupsList = async () => {
    if (!isGoogleConnected) return;
    
    setIsLoadingBackups(true);
    try {
      const result = await listDriveBackups();
      if (result.success && result.files) {
        setBackups(result.files);
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron cargar los respaldos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al cargar respaldos:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar la lista de respaldos",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBackups(false);
    }
  };
  
  // Función para crear respaldo online
  const createOnlineBackup = async () => {
    // Verificar si el usuario está conectado a Google Drive
    if (!isGoogleConnected) {
      toast({
        title: "Error",
        description: "Debes conectar con Google Drive primero",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Verificar autenticación
      const auth = Auth.getInstance();
      if (!auth.isAuthenticated() || !auth.currentUser?.id) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para crear un respaldo online",
          variant: "destructive"
        });
        return;
      }
      
      const userId = auth.currentUser.id;
      
      // Crear datos de respaldo
      const db = await openDB(DB_NAME, 9);
      
      const products = await db.getAll('products');
      const customers = await db.getAll('customers');
      const orders = await db.getAll('orders');
      const tables = await db.getAll('tables');
      
      // Intentar obtener datos de negocio
      const businessData = await db.get('business', 1) as BusinessData | undefined;
      
      // Crear objeto de datos del respaldo
      const backupData = {
        products,
        customers,
        orders,
        tables,
        timestamp: new Date().toISOString(),
        tenantId: userId,
        business: businessData || {
          id: userId || 'default',
          name: 'PizzaPOS',
          email: auth.currentUser?.username || 'anonymous@pizzapos.app',
          isActive: true
        }
      };
      
      // Guardar respaldo en Google Drive
      const result = await saveBackupToDrive(backupData);
      
      if (result.success && result.webViewLink) {
        setBackupUrl(result.webViewLink);
        
        // Actualizar la lista de respaldos
        await loadBackupsList();
        
        toast({
          title: "Respaldo creado",
          description: "El respaldo en línea se ha creado correctamente"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo subir el respaldo a Google Drive",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error("Error creating online backup:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el respaldo online",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Función para restaurar desde un respaldo online
  const restoreFromDriveBackup = async (fileId: string) => {
    setIsRestoring(true);
    
    try {
      // Obtener datos del respaldo
      const backupData = await fetchBackupFromDrive(fileId);
      
      if (!backupData) {
        toast({
          title: "Error",
          description: "No se pudo recuperar el respaldo",
          variant: "destructive"
        });
        return;
      }
      
      // Abrir la base de datos
      const db = await openDB(DB_NAME, 9);
      
      // Iniciar transacción
      const tx = db.transaction(
        ['products', 'customers', 'orders', 'tables', 'business'], 
        'readwrite'
      );
      
      // Limpiar tablas existentes y restaurar con datos del respaldo
      await tx.objectStore('products').clear();
      await tx.objectStore('customers').clear();
      await tx.objectStore('orders').clear();
      await tx.objectStore('tables').clear();
      
      // Restaurar datos
      for (const product of backupData.products || []) {
        await tx.objectStore('products').add(product);
      }
      
      for (const customer of backupData.customers || []) {
        await tx.objectStore('customers').add(customer);
      }
      
      for (const order of backupData.orders || []) {
        await tx.objectStore('orders').add(order);
      }
      
      for (const table of backupData.tables || []) {
        await tx.objectStore('tables').add(table);
      }
      
      // Restaurar datos de negocio
      if (backupData.business) {
        await tx.objectStore('business').put(backupData.business, 1);
      }
      
      // Completar la transacción
      await tx.done;
      
      toast({
        title: "Restauración completada",
        description: "Los datos se han restaurado correctamente desde el respaldo online"
      });
      
      // Forzar recarga para aplicar los cambios
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error("Error restoring from online backup:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al restaurar desde el respaldo online",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white w-full m-0 p-0">
      <div className="p-4 relative">
        <BackButton />
        <div className="max-w-4xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-white text-center">Respaldo Online</h1>
          
          {!isGoogleConnected ? (
            <Card className="bg-[#1A1A1A] border-zinc-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Conectar con Google Drive</CardTitle>
                <CardDescription className="text-gray-400">
                  Conéctate a Google Drive para crear y restaurar respaldos online
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={connectToGoogleDrive}
                  className="w-full bg-[#4A64E2] hover:bg-[#3B51B8] flex items-center justify-center"
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <>
                      <RefreshCw className="mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2" />
                      Conectar con Google Drive
                    </>
                  )}
                </Button>
                
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Beneficios de Google Drive</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                    <li>15GB de almacenamiento gratuito</li>
                    <li>Acceso a tus respaldos desde cualquier dispositivo</li>
                    <li>Almacenamiento seguro en la nube</li>
                    <li>No hay límites en el tamaño de los respaldos</li>
                    <li>Control total sobre tus respaldos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-[#1A1A1A] border-zinc-800 mb-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white">Crear Respaldo en Google Drive</CardTitle>
                      <CardDescription className="text-gray-400">
                        Guarda tu respaldo en Google Drive para acceder desde cualquier lugar
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-green-500">
                      <Cloud className="h-4 w-4" />
                      <span className="text-xs">Conectado</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={createOnlineBackup}
                    className="w-full bg-[#4A64E2] hover:bg-[#3B51B8] flex items-center justify-center"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="mr-2 animate-spin" />
                        Creando Respaldo...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" />
                        Crear Respaldo Online
                      </>
                    )}
                  </Button>
                  
                  {backupUrl && (
                    <div className="mt-4 p-4 bg-zinc-800 rounded-md">
                      <p className="text-sm font-medium mb-2">Respaldo creado correctamente:</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-blue-400 break-all flex-1">{backupUrl}</p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(backupUrl, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Información del Respaldo</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                      <li>Los respaldos se almacenan en tu cuenta de Google Drive</li>
                      <li>Se incluyen tus productos, clientes, órdenes y mesas</li>
                      <li>Cada respaldo tiene un nombre con fecha y hora</li>
                      <li>Los archivos se guardan en formato JSON</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              {/* Lista de respaldos */}
              <Card className="bg-[#1A1A1A] border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Tus Respaldos en Google Drive</CardTitle>
                  <CardDescription className="text-gray-400">
                    Gestiona y restaura tus respaldos almacenados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={loadBackupsList}
                    className="w-full bg-[#2A2A2A] hover:bg-[#3E3E3E] flex items-center justify-center"
                    disabled={isLoadingBackups}
                  >
                    {isLoadingBackups ? (
                      <>
                        <RefreshCw className="mr-2 animate-spin" />
                        Cargando respaldos...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2" />
                        Actualizar lista de respaldos
                      </>
                    )}
                  </Button>
                  
                  {backups.length > 0 ? (
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
                            <tr key={backup.id} className={index % 2 === 0 ? "bg-zinc-900/50" : ""}>
                              <td className="p-3 text-sm truncate max-w-[200px]">{backup.name}</td>
                              <td className="p-3 text-sm">
                                {new Date(backup.modifiedTime).toLocaleString()}
                              </td>
                              <td className="p-3 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreFromDriveBackup(backup.id)}
                                  disabled={isRestoring}
                                  className="mr-1"
                                >
                                  {isRestoring ? "Restaurando..." : "Restaurar"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    window.open(`https://drive.google.com/file/d/${backup.id}/view`, '_blank');
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      {isLoadingBackups 
                        ? "Cargando respaldos..."
                        : "No se encontraron respaldos. Crea tu primer respaldo online."}
                    </div>
                  )}
                  
                  <div className="text-sm text-yellow-400 bg-yellow-900/30 p-3 rounded-md border border-yellow-800">
                    <strong>¡Advertencia!</strong> Restaurar un respaldo reemplazará todos tus datos actuales.
                    Asegúrate de crear un respaldo de tu información actual antes de continuar.
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
