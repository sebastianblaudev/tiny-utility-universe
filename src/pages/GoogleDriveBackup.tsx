
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from '@/components/BackButton';
import { toast } from "sonner";
import {
  initializeGoogleDrive,
  loginToGoogleDrive,
  isGoogleDriveAuthenticated,
  logoutFromGoogleDrive,
  saveBackupToDrive,
  listDriveBackups,
  downloadDriveBackup
} from '@/utils/googleDriveUtils';
import { Loader2, Upload, Download, LogOut, RefreshCw, AlertTriangle } from "lucide-react";

export default function GoogleDriveBackup() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [backups, setBackups] = useState<Array<{ id: string; name: string; modifiedTime: string }>>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

  // Inicializar Google Drive API al cargar la página
  useEffect(() => {
    const init = async () => {
      try {
        await initializeGoogleDrive();
        setIsAuthenticated(isGoogleDriveAuthenticated());
      } catch (error) {
        console.error("Error initializing Google Drive:", error);
        toast.error("Error al inicializar Google Drive");
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  // Obtener lista de respaldos cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadBackupsList();
    }
  }, [isAuthenticated]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await loginToGoogleDrive();
      
      if (success) {
        setIsAuthenticated(true);
        toast.success("Inicio de sesión exitoso en Google Drive");
      } else {
        toast.error("No se pudo iniciar sesión en Google Drive");
      }
    } catch (error) {
      console.error("Error signing in to Google Drive:", error);
      toast.error("Error al iniciar sesión en Google Drive");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutFromGoogleDrive();
      setIsAuthenticated(false);
      setBackups([]);
      toast.success("Sesión cerrada en Google Drive");
    } catch (error) {
      console.error("Error signing out from Google Drive:", error);
      toast.error("Error al cerrar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      // Obtener datos a respaldar - En una implementación real, esto vendría de IndexedDB
      const data = await getDataToBackup();
      
      const result = await saveBackupToDrive(data);
      
      if (result.success) {
        toast.success("Respaldo creado exitosamente en Google Drive");
        loadBackupsList(); // Recargar la lista de respaldos
      } else {
        toast.error(`Error al crear respaldo: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error("Error al crear respaldo");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBackupsList = async () => {
    setIsLoadingBackups(true);
    try {
      const result = await listDriveBackups();
      
      if (result.success && result.backups) {
        setBackups(result.backups);
      } else {
        toast.error(`Error al cargar respaldos: ${result.error}`);
      }
    } catch (error) {
      console.error("Error listing backups:", error);
      toast.error("Error al cargar la lista de respaldos");
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleRestoreBackup = async (fileId: string) => {
    setIsLoading(true);
    try {
      const result = await downloadDriveBackup(fileId);
      
      if (result.success && result.data) {
        // Aquí implementarías la restauración de los datos
        toast.success("Respaldo descargado exitosamente");
        // Ejemplo: await restoreData(result.data);
      } else {
        toast.error(`Error al descargar respaldo: ${result.error}`);
      }
    } catch (error) {
      console.error("Error downloading backup:", error);
      toast.error("Error al descargar respaldo");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener datos a respaldar - En una implementación real, esto vendría de IndexedDB
  const getDataToBackup = async () => {
    // Simulación de datos - En producción, obtendrías los datos reales de tu IndexedDB o estado
    return {
      products: await getStoreData('products'),
      customers: await getStoreData('customers'),
      orders: await getStoreData('orders'),
      tables: await getStoreData('tables'),
      business: await getStoreData('business', 1),
      timestamp: new Date().toISOString(),
    };
  };

  // Función auxiliar para obtener datos de IndexedDB
  const getStoreData = async (storeName: string, key?: number | string) => {
    try {
      const { openDB } = await import('idb');
      const { DB_NAME } = await import('@/lib/query-client');
      
      const db = await openDB(DB_NAME, 9);
      
      if (key !== undefined) {
        return await db.get(storeName, key);
      } else {
        return await db.getAll(storeName);
      }
    } catch (error) {
      console.error(`Error getting data from ${storeName}:`, error);
      return key !== undefined ? null : [];
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
        <p>Inicializando Google Drive...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="p-4 relative">
        <BackButton />
        <div className="max-w-4xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-center">Respaldos en Google Drive</h1>

          <Card className="mb-8 bg-[#1A1A1A] text-white border-zinc-800">
            <CardHeader>
              <CardTitle>Estado de Google Drive</CardTitle>
              <CardDescription className="text-zinc-400">
                {isAuthenticated 
                  ? "Has iniciado sesión en Google Drive" 
                  : "Inicia sesión para guardar tus respaldos en Google Drive"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <Alert className="bg-green-900/20 border-green-700 text-white mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <AlertTitle>Conectado a Google Drive</AlertTitle>
                  </div>
                  <AlertDescription className="text-zinc-300">
                    Puedes crear respaldos y guardarlos en tu cuenta de Google Drive.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-yellow-900/20 border-yellow-700/50 text-white">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle>No has iniciado sesión</AlertTitle>
                  <AlertDescription className="text-zinc-300">
                    Necesitas iniciar sesión para guardar respaldos en Google Drive.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              {isAuthenticated ? (
                <div className="flex gap-4">
                  <Button 
                    variant="default" 
                    onClick={handleCreateBackup} 
                    disabled={isLoading}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Crear Respaldo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleGoogleLogout} 
                    disabled={isLoading}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleGoogleLogin} 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <svg 
                      className="h-5 w-5 mr-2" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" 
                        fill="#4285F4" 
                      />
                      <path 
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" 
                        fill="#34A853" 
                      />
                      <path 
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" 
                        fill="#FBBC05" 
                      />
                      <path 
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" 
                        fill="#EA4335" 
                      />
                    </svg>
                  )}
                  Iniciar sesión con Google
                </Button>
              )}
            </CardFooter>
          </Card>

          {isAuthenticated && (
            <Card className="bg-[#1A1A1A] text-white border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tus respaldos</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Respaldos guardados en tu Google Drive
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadBackupsList} 
                  disabled={isLoadingBackups}
                  className="h-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  {isLoadingBackups ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingBackups ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                  </div>
                ) : backups.length > 0 ? (
                  <div className="space-y-2">
                    {backups.map((backup) => (
                      <div 
                        key={backup.id} 
                        className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-300 truncate">
                            {backup.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {formatDate(backup.modifiedTime)}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRestoreBackup(backup.id)}
                          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    No hay respaldos guardados en tu Google Drive.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
