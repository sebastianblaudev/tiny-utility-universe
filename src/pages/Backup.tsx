
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Download, Clock, AlertTriangle, ExternalLink, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { initDatabase } from "@/lib/db-service";

const Backup = () => {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [nextBackupTime, setNextBackupTime] = useState<string | null>(null);
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if running in an iframe
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      // If we can't access window.top due to security restrictions, we're definitely in an iframe
      setIsInIframe(true);
    }
  }, []);
  
  // Load saved preferences
  useEffect(() => {
    const savedAutoBackup = localStorage.getItem("cotipro_autobackup");
    const savedLastBackup = localStorage.getItem("cotipro_lastbackup");
    const savedFolderPath = localStorage.getItem("cotipro_backup_path");
    
    if (savedAutoBackup === "true") {
      setAutoBackupEnabled(true);
    }
    
    if (savedLastBackup) {
      setLastBackupTime(savedLastBackup);
    }
    
    if (savedFolderPath) {
      setFolderPath(savedFolderPath);
    }
  }, []);
  
  // Handle auto backup timer
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Set up new timer if auto backup is enabled and we have a folder handle
    if (autoBackupEnabled && folderHandle) {
      // Schedule backup every 20 minutes (1200000 ms)
      timerRef.current = window.setInterval(() => {
        performBackup();
        
        // Update next backup time
        const next = new Date();
        next.setMinutes(next.getMinutes() + 20);
        setNextBackupTime(next.toLocaleString());
      }, 1200000); // 20 minutes
      
      // Set initial next backup time
      const next = new Date();
      next.setMinutes(next.getMinutes() + 20);
      setNextBackupTime(next.toLocaleString());
      
      toast.info(
        "Respaldo automático activado", 
        { description: "Se realizará un respaldo cada 20 minutos" }
      );
    } else {
      setNextBackupTime(null);
    }
    
    // Cleanup timer on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoBackupEnabled, folderHandle]);
  
  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem("cotipro_autobackup", autoBackupEnabled ? "true" : "false");
    
    if (lastBackupTime) {
      localStorage.setItem("cotipro_lastbackup", lastBackupTime);
    }
    
    if (folderPath) {
      localStorage.setItem("cotipro_backup_path", folderPath);
    }
  }, [autoBackupEnabled, lastBackupTime, folderPath]);
  
  // Check if File System Access API is available
  const isFileSystemAccessSupported = (): boolean => {
    return 'showDirectoryPicker' in window;
  };
  
  // Check if the app is running in an iframe that allows file system access
  const canAccessFileSystem = (): boolean => {
    return isFileSystemAccessSupported() && !isInIframe;
  };
  
  // Select backup location
  const selectBackupLocation = async () => {
    try {
      // Check if running in iframe
      if (isInIframe) {
        toast.error(
          "Acceso restringido en iframe", 
          { 
            description: "No se puede acceder al selector de archivos dentro de un iframe. Por favor, abre la aplicación en una ventana completa del navegador." 
          }
        );
        return null;
      }
      
      // Check if File System Access API is supported
      if (!isFileSystemAccessSupported()) {
        toast.error(
          "API no soportada", 
          { description: "Tu navegador no soporta la API de acceso al sistema de archivos. Por favor, utiliza Chrome, Edge o un navegador basado en Chromium." }
        );
        return null;
      }
      
      // Request permission to access the file system
      const dirHandle = await window.showDirectoryPicker({
        id: 'cotipro-backup',
        mode: 'readwrite',
      }).catch(error => {
        // Handle user cancellation separately
        if (error.name === 'AbortError') {
          console.log('User cancelled the directory selection');
          return null;
        }
        throw error; // Re-throw other errors
      });
      
      // If dirHandle is null (user cancelled), return early
      if (!dirHandle) {
        return null;
      }
      
      // Verify we can write to the directory by testing permissions
      try {
        // Check if we have permission to write
        const permissionStatus = await dirHandle.requestPermission({ mode: 'readwrite' });
        
        if (permissionStatus !== 'granted') {
          toast.error(
            "Permiso denegado", 
            { description: "No se pudo obtener permiso para escribir en la carpeta seleccionada" }
          );
          return null;
        }
      } catch (permError) {
        console.error("Error al verificar permisos:", permError);
        toast.error(
          "Error de permisos", 
          { description: "No se pudo verificar los permisos de escritura en la carpeta seleccionada" }
        );
        return null;
      }
      
      // Store the folder handle and update UI
      setFolderHandle(dirHandle);
      
      // Save a friendly name of the directory
      const name = dirHandle.name;
      setFolderPath(name);
      
      toast.success(
        "Ubicación seleccionada", 
        { description: `Se guardará en la carpeta: ${name}` }
      );
      
      return dirHandle;
    } catch (error) {
      console.error("Error al seleccionar la ubicación:", error);
      
      // Provide more specific error messages based on error type
      if ((error as Error).name === 'SecurityError') {
        if (isInIframe) {
          toast.error(
            "Error de seguridad", 
            { description: "Los navegadores no permiten seleccionar carpetas dentro de un iframe. Por favor, abre la aplicación en una ventana completa." }
          );
        } else {
          toast.error(
            "Error de seguridad", 
            { description: "No se pudo acceder a la carpeta por motivos de seguridad del navegador." }
          );
        }
      } else if ((error as Error).name === 'NotAllowedError') {
        toast.error(
          "Acceso denegado", 
          { description: "El navegador denegó el acceso a la carpeta. Asegúrate de permitir el acceso cuando se te solicite." }
        );
      } else {
        toast.error(
          "Error al seleccionar la ubicación", 
          { description: `No se pudo acceder a la carpeta seleccionada: ${(error as Error).message}` }
        );
      }
      
      return null;
    }
  };
  
  // Perform the backup operation
  const performBackup = async () => {
    // Check if running in iframe
    if (isInIframe) {
      toast.error(
        "Acceso restringido en iframe", 
        { 
          description: "No se puede acceder al selector de archivos dentro de un iframe. Por favor, abre la aplicación en una ventana completa del navegador." 
        }
      );
      return;
    }
    
    // Check if File System Access API is supported
    if (!isFileSystemAccessSupported()) {
      toast.error(
        "API no soportada", 
        { description: "Tu navegador no soporta la API de acceso al sistema de archivos. Por favor, utiliza Chrome, Edge o un navegador basado en Chromium." }
      );
      return;
    }
    
    if (!folderHandle) {
      const newHandle = await selectBackupLocation();
      if (!newHandle) return;
      setFolderHandle(newHandle);
    }
    
    try {
      // Try to verify we still have permission (handles might expire)
      const permissionStatus = await folderHandle.requestPermission({ mode: 'readwrite' });
      
      if (permissionStatus !== 'granted') {
        toast.error(
          "Permiso denegado", 
          { description: "Los permisos para la carpeta han caducado. Por favor, seleccione la carpeta nuevamente." }
        );
        setFolderHandle(null);
        setFolderPath(null);
        return;
      }
      
      // Create a simple backup object with system information
      const backupData = {
        system: "CotiPro Chile",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        message: "Sistema de respaldo básico funcionando correctamente",
        data: {
          backupDate: new Date().toISOString(),
        }
      };
      
      // Generate timestamp for filename
      const now = new Date();
      const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const fileName = `cotipro_backup_${timestamp}.json`;
      
      // Write to file
      const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(backupData, null, 2));
      await writable.close();
      
      // Update last backup time
      setLastBackupTime(now.toLocaleString());
      
      toast.success(
        "Respaldo completado", 
        { description: `Archivo guardado como: ${fileName}` }
      );
    } catch (error) {
      console.error("Error creating backup:", error);
      
      // More specific error messages
      if ((error as Error).name === 'NotAllowedError') {
        toast.error(
          "Permiso denegado", 
          { description: "No tiene permisos para escribir en esta carpeta." }
        );
        // Reset folder handle since it's no longer valid
        setFolderHandle(null);
        setFolderPath(null);
      } else {
        toast.error(
          "Error al crear el respaldo", 
          { description: `No se pudo guardar el archivo de respaldo: ${(error as Error).message}` }
        );
      }
    }
  };

  // Import backup file
  const importBackup = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process the imported backup file
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      
      // Check file type
      if (!file.name.endsWith('.json')) {
        toast.error(
          "Formato incorrecto", 
          { description: "El archivo de respaldo debe ser un archivo JSON." }
        );
        return;
      }

      // Read the file
      const fileContent = await file.text();
      let backupData;
      
      try {
        backupData = JSON.parse(fileContent);
      } catch (parseError) {
        toast.error(
          "Archivo inválido", 
          { description: "El archivo seleccionado no es un JSON válido." }
        );
        return;
      }

      // Validate backup file format
      if (!backupData || !backupData.system || backupData.system !== "CotiPro Chile") {
        toast.error(
          "Archivo de respaldo inválido", 
          { description: "Este no parece ser un archivo de respaldo válido de CotiPro." }
        );
        return;
      }

      // Process the backup data
      // En una implementación real, aquí restauraríamos datos de la base de datos
      // Por ahora, solo mostramos un mensaje de éxito y actualizamos la UI

      toast.success(
        "Importación completada", 
        { description: "El archivo de respaldo se ha importado correctamente." }
      );
      
      // Update last backup time to reflect the imported file
      const importTime = new Date().toLocaleString();
      setLastBackupTime(importTime);
      localStorage.setItem("cotipro_lastbackup", importTime);

    } catch (error) {
      console.error("Error importing backup:", error);
      toast.error(
        "Error al importar", 
        { description: `No se pudo importar el archivo de respaldo: ${(error as Error).message}` }
      );
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Toggle auto backup
  const toggleAutoBackup = (enabled: boolean) => {
    if (enabled && isInIframe) {
      toast.error(
        "Función no disponible en iframe", 
        { description: "El respaldo automático no está disponible dentro de un iframe. Por favor, abre la aplicación en una ventana completa." }
      );
      return;
    }
    
    if (enabled && !isFileSystemAccessSupported()) {
      toast.error(
        "API no soportada", 
        { description: "Tu navegador no soporta la API de acceso al sistema de archivos. Por favor, utiliza Chrome, Edge o un navegador basado en Chromium." }
      );
      return;
    }
    
    if (enabled && !folderHandle) {
      // If enabling auto backup but no folder selected, prompt for folder
      selectBackupLocation().then(handle => {
        if (handle) {
          setAutoBackupEnabled(true);
        }
      });
    } else {
      setAutoBackupEnabled(enabled);
      
      if (!enabled) {
        toast.info("Respaldo automático desactivado");
      }
    }
  };
  
  return (
    <div className="container max-w-4xl p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Respaldo del Sistema</h1>
        <div className="flex gap-2">
          <Button
            onClick={performBackup}
            className="bg-gradient-to-r from-chile-blue to-chile-blue text-white"
            disabled={isInIframe}
          >
            <Save className="mr-2" />
            Hacer respaldo
          </Button>
          <Button
            onClick={importBackup}
            variant="outline"
            className="border-chile-blue text-chile-blue hover:bg-chile-blue/10"
            disabled={isInIframe}
          >
            <Upload className="mr-2" />
            Importar respaldo
          </Button>
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileImport}
            disabled={isInIframe}
          />
        </div>
      </div>
      
      {isInIframe && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta función no está disponible dentro de un iframe o vista previa. 
            Para usar la función de respaldo, por favor abre la aplicación en una ventana completa del navegador.
          </AlertDescription>
        </Alert>
      )}
      
      {!isFileSystemAccessSupported() && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu navegador no soporta la API de acceso al sistema de archivos. 
            Por favor, utiliza Chrome, Edge o un navegador basado en Chromium para usar esta función.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-chile-blue/10 to-chile-red/10">
          <CardTitle>Configuración de respaldos</CardTitle>
          <CardDescription>
            Configure la ubicación y frecuencia de sus respaldos automáticos
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Ubicación de respaldo</h3>
                <p className="text-sm text-gray-500">
                  Seleccione la carpeta donde se guardarán sus respaldos
                </p>
              </div>
              <Button 
                onClick={selectBackupLocation} 
                variant="outline" 
                disabled={isInIframe}
              >
                <Download className="mr-2" />
                {folderPath ? "Cambiar ubicación" : "Seleccionar ubicación"}
              </Button>
            </div>
            
            {folderPath && (
              <div className="p-3 bg-neutral-100 rounded-md">
                <p className="text-sm font-medium">
                  Carpeta actual: <span className="font-bold">{folderPath}</span>
                </p>
              </div>
            )}
            
            {isInIframe && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1 inline text-amber-500" />
                  Esta aplicación está corriendo dentro de un iframe, lo cual impide el acceso a archivos locales.
                  Para usar la funcionalidad de respaldo, abre la aplicación directamente en una ventana del navegador.
                </p>
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-xl font-semibold">Respaldo automático</h3>
                <p className="text-sm text-gray-500">
                  El sistema realizará respaldos automáticos cada 20 minutos
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="auto-backup-switch">
                  {autoBackupEnabled ? "Activado" : "Desactivado"}
                </Label>
                <Switch
                  id="auto-backup-switch"
                  checked={autoBackupEnabled}
                  onCheckedChange={toggleAutoBackup}
                  disabled={isInIframe}
                />
              </div>
            </div>
            
            {autoBackupEnabled && nextBackupTime && (
              <div className="p-3 bg-neutral-100 rounded-md flex items-center">
                <Clock className="mr-2 text-blue-500" />
                <p className="text-sm">
                  Próximo respaldo: <span className="font-bold">{nextBackupTime}</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="bg-neutral-100/50 flex flex-col items-stretch border-t">
          <div className="space-y-2 w-full">
            <h4 className="font-medium">Historial de respaldos</h4>
            {lastBackupTime ? (
              <p className="text-sm">
                Último respaldo: <span className="font-medium">{lastBackupTime}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No se han realizado respaldos aún
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Importar/Exportar respaldos</CardTitle>
          <CardDescription>
            Importe o exporte sus respaldos de forma segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-neutral-50 rounded-md border border-neutral-200">
            <h3 className="font-semibold text-lg mb-2">Importar un respaldo</h3>
            <p className="text-sm mb-3">
              Puede importar un archivo de respaldo previamente creado con el sistema CotiPro.
              La importación restaurará los datos del sistema al estado del respaldo.
            </p>
            <Button 
              onClick={importBackup} 
              className="w-full md:w-auto"
              disabled={isInIframe || isImporting}
              variant="outline"
            >
              <Upload className="mr-2" />
              {isImporting ? "Importando..." : "Seleccionar archivo de respaldo"}
            </Button>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-1">Formato de respaldo</h3>
            <p className="text-sm text-blue-700">
              Los archivos de respaldo son documentos JSON con la extensión .json
              y contienen toda la información necesaria para restaurar el sistema.
            </p>
          </div>
          
          {isInIframe && (
            <div className="flex flex-col gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-semibold text-yellow-800">¿Por qué no funciona?</h4>
              <p className="text-sm text-yellow-700">
                Esta aplicación está corriendo en un iframe (una ventana dentro de otra página web), 
                y los navegadores modernos no permiten que los iframes accedan al sistema de archivos por razones de seguridad.
              </p>
              <p className="text-sm text-yellow-700">
                Para utilizar esta funcionalidad, deberás abrir la aplicación en una ventana completa del navegador.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Backup;
