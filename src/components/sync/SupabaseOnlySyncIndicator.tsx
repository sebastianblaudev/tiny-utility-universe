
import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Upload, Download, Database, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSupabaseOnlySync } from '@/hooks/useSupabaseOnlySync';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const SupabaseOnlySyncIndicator = () => {
  const { 
    syncStatus, 
    lastSyncTime, 
    manualPush, 
    manualPull,
    isReady,
    canSync 
  } = useSupabaseOnlySync();
  const authContext = useAuth();

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'pulling':
        return <Download className="w-4 h-4 animate-spin" />;
      case 'pushing':
        return <Upload className="w-4 h-4 animate-spin" />;
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'idle':
      default:
        return canSync ? <Database className="w-4 h-4 text-blue-500" /> : <CloudOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'pulling':
        return 'Descargando...';
      case 'pushing':
        return 'Guardando...';
      case 'synced':
        return 'Sincronizado';
      case 'idle':
      default:
        return canSync ? 'Base de Datos+DB' : 'Sin conexión';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'pulling':
      case 'pushing':
        return 'secondary';
      case 'synced':
        return 'default';
      case 'idle':
      default:
        return canSync ? 'secondary' : 'outline';
    }
  };

  const handleManualSync = async () => {
    // Siempre hacer push para mantener Base de Datos como fuente de verdad
    await manualPush();
  };

  if (!isReady || !canSync) {
    return null;
  }

  const systemUsers = authContext.getAllUsers();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={getStatusColor()} className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-sm">
              <p><strong>Estado:</strong> {getStatusText()}</p>
              <p><strong>Sistema:</strong> Solo Base de Datos + IndexedDB</p>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span><strong>Usuarios:</strong> {systemUsers.length}</span>
              </div>
              {lastSyncTime && (
                <p><strong>Última sincronización:</strong><br />
                  {format(lastSyncTime, 'PPp', { locale: es })}
                </p>
              )}
              <p className="text-blue-500">
                Datos y usuarios sincronizados automáticamente entre Base de Datos e IndexedDB
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSync}
              disabled={syncStatus === 'pulling' || syncStatus === 'pushing'}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${(syncStatus === 'pulling' || syncStatus === 'pushing') ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sincronizar manualmente con Base de Datos (incluye {systemUsers.length} usuarios)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
