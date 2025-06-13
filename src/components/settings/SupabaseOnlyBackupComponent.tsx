
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBarber } from "@/contexts/BarberContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseBackupService } from "@/services/SupabaseBackupService";
import { useSupabaseOnlySync } from "@/hooks/useSupabaseOnlySync";
import { Cloud, CloudDownload, CheckCircle, AlertCircle, Info, RefreshCw, Database, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SupabaseOnlyBackupComponent = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const barberContext = useBarber();
  const authContext = useAuth();
  const { syncStatus, lastSyncTime, manualPush, manualPull, isReady, canSync } = useSupabaseOnlySync();
  const [restoreInProgress, setRestoreInProgress] = useState(false);
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
    try {
      const systemUsers = authContext.getAllUsers();
      console.log('👥 Iniciando respaldo manual con usuarios:', systemUsers.length);
      
      const success = await manualPush();
      if (success) {
        toast({
          title: "Respaldo completado",
          description: `Los datos se han respaldado en Base de Datos incluyendo ${systemUsers.length} usuarios del sistema`,
        });
        await checkBackupStatus();
      } else {
        toast({
          title: "Error",
          description: "No se pudo completar el respaldo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in manual backup:', error);
      toast({
        title: "Error",
        description: "Error al crear el respaldo",
        variant: "destructive"
      });
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
      
      const success = await manualPull();
      
      if (success) {
        const restoredUsers = authContext.getAllUsers();
        toast({
          title: "Restauración completada",
          description: `Los datos se han sincronizado desde Base de Datos (${restoredUsers.length} usuarios restaurados)`,
        });
        await checkBackupStatus();
      } else {
        toast({
          title: "Error",
          description: "No se pudieron restaurar los datos desde Base de Datos",
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

  const getSyncStatusInfo = () => {
    switch (syncStatus) {
      case 'pushing':
        return { text: 'Guardando...', variant: 'secondary' as const, icon: RefreshCw };
      case 'pulling':
        return { text: 'Sincronizando...', variant: 'secondary' as const, icon: RefreshCw };
      case 'synced':
        return { text: 'Sincronizado', variant: 'default' as const, icon: CheckCircle };
      case 'idle':
      default:
        return { text: canSync ? 'Listo' : 'Sin conexión', variant: canSync ? 'secondary' as const : 'outline' as const, icon: Cloud };
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Respaldo Automático - Solo Base de Datos</CardTitle>
          <CardDescription>
            Sistema optimizado que solo usa Base de Datos para almacenamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <p>Debe iniciar sesión para acceder a los respaldos automáticos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getSyncStatusInfo();
  const systemUsers = authContext.getAllUsers();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Respaldo Automático - Solo Base de Datos
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <statusInfo.icon className={`w-3 h-3 ${(syncStatus === 'pushing' || syncStatus === 'pulling') ? 'animate-spin' : ''}`} />
            {statusInfo.text}
          </Badge>
        </CardTitle>
        <CardDescription>
          Sistema optimizado que mantiene todos los datos en Base de Datos únicamente. Usuario: {user.email}
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
          {isReady ? (
            <>
              <CheckCircle className="text-green-500" size={20} />
              <div className="flex-1">
                <p className="font-medium text-green-700 dark:text-green-300">
                  Sincronización automática activa
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Los datos y usuarios se sincronizan automáticamente con Base de Datos
                </p>
                {lastSyncTime && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Última sincronización: {lastSyncTime.toLocaleString()}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="text-amber-500" size={20} />
              <div className="flex-1">
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  Inicializando sistema de sincronización...
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  El sistema se está preparando para activar la sincronización automática
                </p>
              </div>
            </>
          )}
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
            disabled={syncStatus === 'pushing' || syncStatus === 'pulling' || !isReady}
            className="flex items-center gap-2"
          >
            <Cloud size={16} />
            {(syncStatus === 'pushing' || syncStatus === 'pulling') ? 'Sincronizando...' : `Sincronizar (${systemUsers.length} usuarios)`}
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
            <li>✅ Respaldos automáticos solo en Base de Datos (incluye usuarios del sistema)</li>
            <li>✅ Datos almacenados únicamente en Base de Datos Storage</li>
            <li>✅ Se activa con cada venta, adelanto o cambio en el sistema</li>
            <li>✅ Sincronización automática al iniciar sesión desde otros dispositivos</li>
            <li>✅ Datos y usuarios siempre consistentes</li>
            <li>✅ Sin almacenamiento local - máxima simplicidad</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseOnlyBackupComponent;
