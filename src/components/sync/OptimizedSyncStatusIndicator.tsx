
import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOptimizedMasterSync } from '@/hooks/useOptimizedMasterSync';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const OptimizedSyncStatusIndicator = () => {
  const { 
    syncStatus, 
    lastSyncTime, 
    error, 
    manualPush, 
    checkPendingChanges,
    isInitialized,
    isReady,
    canSync 
  } = useOptimizedMasterSync();

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'pushing':
        return <Upload className="w-4 h-4 animate-spin" />;
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'idle':
      default:
        return canSync ? <Cloud className="w-4 h-4 text-blue-500" /> : <CloudOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (!isReady) return 'Inicializando...';
    
    switch (syncStatus) {
      case 'pushing':
        return 'Subiendo respaldo...';
      case 'synced':
        return 'Respaldo actualizado';
      case 'error':
        return 'Error en respaldo';
      case 'idle':
      default:
        return canSync ? 'Listo para respaldar' : 'Sin conexión';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'pushing':
        return 'secondary';
      case 'synced':
        return 'default';
      case 'error':
        return 'destructive';
      case 'idle':
      default:
        return canSync ? 'secondary' : 'outline';
    }
  };

  const handleManualBackup = async () => {
    await manualPush();
  };

  if (!isInitialized || !canSync) {
    return null;
  }

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
              {lastSyncTime && (
                <p><strong>Último respaldo:</strong><br />
                  {format(lastSyncTime, 'PPp', { locale: es })}
                </p>
              )}
              {error && (
                <p className="text-red-500"><strong>Error:</strong><br />
                  {error}
                </p>
              )}
              {checkPendingChanges() && (
                <p className="text-orange-500">Hay cambios pendientes por respaldar</p>
              )}
              {!isReady && (
                <p className="text-blue-500">Sistema inicializándose...</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualBackup}
              disabled={syncStatus === 'pushing' || !isReady}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${syncStatus === 'pushing' ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{!isReady ? 'Inicializando...' : 'Crear respaldo manual'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
