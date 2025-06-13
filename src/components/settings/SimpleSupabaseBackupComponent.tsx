
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBarber } from "@/contexts/BarberContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseBackupService } from "@/services/SupabaseBackupService";
import { Cloud, CloudDownload, CheckCircle, AlertCircle, Info, RefreshCw, Database, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SimpleSupabaseBackupComponent = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const barberContext = useBarber();
  const authContext = useAuth();
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [backupExists, setBackupExists] = useState(false);
  const [checkingBackup, setCheckingBackup] = useState(false);
  const [backupInfo, setBackupInfo] = useState<{ fileName: string; lastModified: string } | null>(null);

  const backupService = new SupabaseBackupService();

  useEffect(() => {
    if (user) {
      checkBackupStatus();
    }
  }, [user]);

  const checkBackupStatus = async () => {
    setCheckingBackup(true);
    try {
      const exists = await backupService.checkBackupExists();
      setBackupExists(exists);
      
      if (exists) {
        const info = await backupService.getBackupInfo();
        setBackupInfo(info);
      }
    } catch (error) {
      console.error('Error checking backup status:', error);
    } finally {
      setCheckingBackup(false);
    }
  };

  const handleManualBackup = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debe estar autenticado para crear respaldos",
        variant: "destructive"
      });
      return;
    }

    setBackupInProgress(true);
    try {
      const systemUsers = authContext.getAllUsers();
      console.log('👥 Iniciando respaldo manual con usuarios:', systemUsers.length);
      
      // Crear respaldo de todos los datos del usuario actual
      const backupData = {
        appSettings: barberContext.appSettings,
        barbers: barberContext.barbers,
        categories: barberContext.categories,
        services: barberContext.services,
        products: barberContext.products,
        sales: barberContext.sales,
        cashAdvances: barberContext.cashAdvances,
        promotions: barberContext.promotions,
        systemUsers: systemUsers
      };

      await backupService.createBackup(backupData);
      
      toast({
        title: "Respaldo completado",
        description: `Los datos se han respaldado exitosamente incluyendo ${systemUsers.length} usuarios del sistema`,
      });
      await checkBackupStatus();
    } catch (error) {
      console.error('Error in manual backup:', error);
      toast({
        title: "Error",
        description: "Error al crear el respaldo",
        variant: "destructive"
      });
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleRestoreFromSupabase = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debe estar autenticado para restaurar desde Base de Datos",
        variant: "destructive"
      });
      return;
    }

    setRestoreInProgress(true);
    try {
      const currentUsers = authContext.getAllUsers();
      console.log('👥 Usuarios actuales antes de restaurar:', currentUsers.length);
      
      const backupData = await backupService.loadBackup();
      if (backupData) {
        await barberContext.loadFromBackupData(backupData);
        
        const restoredUsers = authContext.getAllUsers();
        toast({
          title: "Restauración completada",
          description: `Los datos se han restaurado desde Base de Datos (${restoredUsers.length} usuarios restaurados)`,
        });
        await checkBackupStatus();
      } else {
        toast({
          title: "Error",
          description: "No se encontró respaldo para restaurar",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error restoring from Base de Datos:', error);
      toast({
        title: "Error",
        description: "Error al restaurar desde Base de Datos",
        variant: "destructive"
      });
    } finally {
      setRestoreInProgress(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Respaldo Simplificado - Solo Base de Datos</CardTitle>
          <CardDescription>
            Sistema optimizado que solo usa Base de Datos para almacenamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <p>Debe iniciar sesión para acceder a los respaldos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const systemUsers = authContext.getAllUsers();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Respaldo Simplificado - Solo Base de Datos
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Activo
          </Badge>
        </CardTitle>
        <CardDescription>
          Sistema que mantiene todos los datos en Base de Datos únicamente. Usuario: {user.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <Users className="text-blue-500" size={20} />
          <div className="flex-1">
            <p className="font-medium text-blue-700 dark:text-blue-300">
              Usuarios del Sistema: {systemUsers.length}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Administradores: {systemUsers.filter(u => u.role === 'admin').length} | 
              Barberos: {systemUsers.filter(u => u.role === 'barber').length} | 
              Propietarios: {systemUsers.filter(u => u.role === 'owner').length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <CheckCircle className="text-green-500" size={20} />
          <div className="flex-1">
            <p className="font-medium text-green-700 dark:text-green-300">
              Sistema 100% Base de Datos activo
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Los datos se almacenan directamente en Base de Datos con aislamiento total por usuario
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {checkingBackup ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Verificando respaldo...</span>
            </div>
          ) : backupExists ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span>Respaldo disponible en Base de Datos (incluye usuarios)</span>
              </div>
              {backupInfo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info size={14} />
                  <span>Archivo: {backupInfo.fileName}</span>
                  <span>•</span>
                  <span>Última modificación: {new Date(backupInfo.lastModified).toLocaleString()}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle size={16} />
              <span>No hay respaldo disponible</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={handleManualBackup} 
            disabled={backupInProgress}
            className="flex items-center gap-2"
          >
            <Cloud size={16} />
            {backupInProgress ? 'Creando respaldo...' : `Crear respaldo (${systemUsers.length} usuarios)`}
          </Button>
          
          <Button 
            onClick={handleRestoreFromSupabase} 
            disabled={restoreInProgress || !backupExists}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <CloudDownload size={16} />
            {restoreInProgress ? 'Restaurando...' : 'Restaurar desde Base de Datos'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <p><strong>Sistema Optimizado - Solo Base de Datos:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>✅ Todos los datos almacenados únicamente en Base de Datos</li>
            <li>✅ Aislamiento total de datos por usuario autenticado</li>
            <li>✅ Respaldos automáticos incluyen usuarios del sistema</li>
            <li>✅ Row Level Security (RLS) para máxima seguridad</li>
            <li>✅ Sincronización en tiempo real entre dispositivos</li>
            <li>✅ Sin dependencias de IndexedDB o localStorage</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleSupabaseBackupComponent;
