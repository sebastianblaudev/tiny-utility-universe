
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Upload, Download, LogIn, LogOut, Check, X, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  initializeGoogleDrive, 
  loginToGoogleDrive, 
  logoutFromGoogleDrive, 
  isGoogleDriveAuthenticated,
  saveBackupToDrive,
  listDriveBackups,
  downloadDriveBackup
} from '@/utils/googleDrivePersonal';
import { openDB } from 'idb';
import { DB_NAME } from '@/lib/query-client';
import { Auth } from '@/lib/auth';
import type { BackupData } from '@/types/backupTypes';

export function GoogleDriveBackupPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isListingBackups, setIsListingBackups] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backups, setBackups] = useState<Array<{ id: string; name: string; modifiedTime: string; link?: string }>>([]);
  const [uploadResult, setUploadResult] = useState<{success: boolean; link?: string; error?: string} | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Inicializar y comprobar estado de autenticación al cargar
  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true);
      try {
        await initializeGoogleDrive();
        const authenticated = isGoogleDriveAuthenticated();
        setIsAuthenticated(authenticated);
        setInitError(null);
        
        // Si está autenticado, cargar lista de respaldos
        if (authenticated) {
          loadBackupsList();
        }
      } catch (error) {
        console.error('Error initializing Google Drive:', error);
        if (error && typeof error === 'object' && 'error' in error && 'details' in error) {
          // Capturar el error de origen no válido
          if (error.error === 'idpiframe_initialization_failed') {
            setInitError('origin_not_registered');
          } else {
            setInitError('unknown');
          }
        } else {
          setInitError('unknown');
        }
        
        toast({
          title: 'Error',
          description: 'No se pudo inicializar Google Drive',
          variant: 'destructive',
        });
      } finally {
        setIsInitializing(false);
      }
    };
    
    initialize();
  }, [toast]);
  
  // Función para iniciar sesión en Google Drive
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await loginToGoogleDrive();
      setIsAuthenticated(success);
      
      if (success) {
        toast({
          title: 'Conectado',
          description: 'Has iniciado sesión en Google Drive',
        });
        setInitError(null);
        loadBackupsList();
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo iniciar sesión en Google Drive',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error logging in to Google Drive:', error);
      
      // Capturar el error específico de origen no registrado
      if (error && typeof error === 'object' && 'error' in error && 'details' in error) {
        if (error.error === 'idpiframe_initialization_failed') {
          setInitError('origin_not_registered');
        } else {
          setInitError('unknown');
        }
      } else {
        setInitError('unknown');
      }
      
      toast({
        title: 'Error',
        description: 'Error al iniciar sesión en Google Drive',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cerrar sesión en Google Drive
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutFromGoogleDrive();
      setIsAuthenticated(false);
      setBackups([]);
      toast({
        title: 'Desconectado',
        description: 'Has cerrado sesión en Google Drive',
      });
    } catch (error) {
      console.error('Error logging out from Google Drive:', error);
      toast({
        title: 'Error',
        description: 'Error al cerrar sesión en Google Drive',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar lista de respaldos de Google Drive
  const loadBackupsList = async () => {
    if (!isAuthenticated) return;
    
    setIsListingBackups(true);
    try {
      const result = await listDriveBackups();
      if (result.success) {
        setBackups(result.backups || []);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudieron cargar los respaldos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error listing backups:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los respaldos',
        variant: 'destructive',
      });
    } finally {
      setIsListingBackups(false);
    }
  };
  
  // Función para crear un respaldo y subirlo a Google Drive
  const handleCreateBackup = async () => {
    // Verificar autenticación
    const auth = Auth.getInstance();
    if (!auth.isAuthenticated()) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para crear un respaldo',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    setUploadResult(null);
    
    try {
      // Crear datos para el respaldo
      const db = await openDB(DB_NAME, 9);
      
      // Obtener datos para el respaldo
      const products = await db.getAll('products');
      const customers = await db.getAll('customers');
      const orders = await db.getAll('orders');
      const tables = await db.getAll('tables');
      
      // Obtener datos de negocio
      const business = await db.get('business', 1);
      
      // Crear objeto de datos del respaldo
      const backupData: BackupData = {
        products,
        customers,
        orders,
        tables,
        business,
        timestamp: new Date().toISOString(),
      };
      
      // Guardar respaldo en Google Drive
      const result = await saveBackupToDrive(backupData);
      setUploadResult(result);
      
      if (result.success) {
        toast({
          title: 'Respaldo creado',
          description: 'El respaldo se ha subido correctamente a Google Drive',
        });
        
        // Actualizar lista de respaldos
        loadBackupsList();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo crear el respaldo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
      toast({
        title: 'Error',
        description: 'No se pudo crear el respaldo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Función para restaurar desde un respaldo
  const handleRestoreBackup = async (fileId: string) => {
    setIsRestoring(true);
    try {
      // Descargar respaldo de Google Drive
      const result = await downloadDriveBackup(fileId);
      
      if (!result.success || !result.data) {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo descargar el respaldo',
          variant: 'destructive',
        });
        return;
      }
      
      const backupData = result.data as BackupData;
      
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
        title: 'Restauración completada',
        description: 'Los datos se han restaurado correctamente desde Google Drive',
      });
      
      // Forzar recarga para aplicar los cambios
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: 'Error',
        description: 'No se pudo restaurar el respaldo',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };
  
  // Renderizar mensaje de error sobre origen no registrado
  const renderOriginError = () => {
    if (initError !== 'origin_not_registered') return null;
    
    const currentOrigin = window.location.origin;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Configuración incompleta</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>
              La URL actual (<strong>{currentOrigin}</strong>) no está registrada como origen permitido en Google Cloud Console.
            </p>
            <p className="text-sm">
              Para corregir este problema:
            </p>
            <ol className="list-decimal pl-5 text-sm space-y-1">
              <li>Ve a la <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Selecciona tu proyecto</li>
              <li>Edita tu ID de cliente OAuth</li>
              <li>En "Orígenes de JavaScript autorizados", añade: <code className="bg-gray-700 px-2 py-0.5 rounded">{currentOrigin}</code></li>
              <li>Guarda los cambios y recarga esta página</li>
            </ol>
            <p className="text-sm mt-2">
              <a 
                href="https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center text-blue-400 hover:text-blue-300"
              >
                Ver guía completa <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Respaldos en Google Drive Personal</CardTitle>
        <CardDescription>
          Guarda y gestiona tus respaldos en tu cuenta personal de Google Drive
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isInitializing ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !isAuthenticated ? (
          <div className="space-y-4">
            {renderOriginError()}
            
            <p className="text-sm text-muted-foreground">
              Conecta tu cuenta de Google Drive para guardar respaldos automáticos en la nube.
            </p>
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Conectar con Google Drive
            </Button>
            
            <div className="rounded-md bg-muted p-4 mt-4">
              <h4 className="font-medium mb-2">Beneficios de usar Google Drive:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>15GB de almacenamiento gratuito</li>
                <li>Acceso desde cualquier dispositivo</li>
                <li>Sincronización automática</li>
                <li>Soporte para versiones de respaldo</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-500" />
                <span className="font-medium">Conectado a Google Drive</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <LogOut className="mr-1 h-3 w-3" />
                )}
                Desconectar
              </Button>
            </div>
            
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleCreateBackup}
                disabled={isUploading}
              >
                {isUploading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isUploading ? "Creando respaldo..." : "Crear respaldo ahora"}
              </Button>
              
              {uploadResult && (
                <Alert variant={uploadResult.success ? "default" : "destructive"}>
                  <AlertDescription>
                    {uploadResult.success 
                      ? "Respaldo creado correctamente" 
                      : `Error: ${uploadResult.error || "No se pudo crear el respaldo"}`}
                    {uploadResult.link && (
                      <div className="mt-2">
                        <a 
                          href={uploadResult.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 underline"
                        >
                          Ver en Google Drive
                        </a>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Respaldos disponibles</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={loadBackupsList}
                  disabled={isListingBackups}
                >
                  {isListingBackups ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {backups.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 px-3 text-xs">Nombre</th>
                        <th className="text-left p-2 px-3 text-xs">Fecha</th>
                        <th className="text-right p-2 px-3 text-xs">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((backup) => (
                        <tr key={backup.id} className="border-t">
                          <td className="p-2 px-3 text-sm truncate max-w-[12rem]">
                            {backup.name.replace('pizzapos-backup-', '')}
                          </td>
                          <td className="p-2 px-3 text-sm">
                            {new Date(backup.modifiedTime).toLocaleString()}
                          </td>
                          <td className="p-2 px-3 text-right space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestoreBackup(backup.id)}
                              disabled={isRestoring}
                            >
                              {isRestoring ? (
                                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="mr-1 h-3 w-3" />
                              )}
                              Restaurar
                            </Button>
                            {backup.link && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(backup.link, '_blank')}
                              >
                                Ver
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : isListingBackups ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md bg-muted/20">
                  <p className="text-muted-foreground">
                    No hay respaldos disponibles
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Crea tu primer respaldo con el botón superior
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col">
        <p className="text-xs text-muted-foreground">
          Los respaldos se guardan en tu cuenta personal de Google Drive y solo tú tienes acceso a ellos.
        </p>
      </CardFooter>
    </Card>
  );
}
