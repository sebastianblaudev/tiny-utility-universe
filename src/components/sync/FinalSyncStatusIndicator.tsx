
import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, Upload, Database, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFinalMasterSync } from '@/hooks/useFinalMasterSync';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const FinalSyncStatusIndicator = () => {
  const { 
    syncStatus, 
    lastSyncTime, 
    manualPush, 
    isReady,
    canSync 
  } = useFinalMasterSync();

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'pushing':
        return <Upload className="w-4 h-4 animate-spin" />;
      case 'pulling':
        return <Download className="w-4 h-4 animate-spin" />;
      case 'synced':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'idle':
      default:
        return canSync ? <Cloud className="w-4 h-4 text-blue-500" /> : <CloudOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (!isReady) return 'Inicializando...';
    
    switch (syncStatus) {
      case 'pushing':
        return 'Respaldando...';
      case 'pulling':
        return 'Sincronizando...';
      case 'synced':
        return 'Respaldado';
      case 'idle':
      default:
        return canSync ? 'Automático' : 'Sin conexión';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'pushing':
      case 'pulling':
        return 'secondary';
      case 'synced':
        return 'default';
      case 'idle':
      default:
        return canSync ? 'secondary' : 'outline';
    }
  };

  const handleManualBackup = async () => {
    const success = await manualPush();
    if (!success) {
      console.log('❌ Error en respaldo manual');
    }
  };

  if (!canSync && !isReady) {
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
              <p><strong>Respaldo Automático:</strong> {getStatusText()}</p>
              {lastSyncTime && (
                <p><strong>Último respaldo:</strong><br />
                  {format(lastSyncTime, 'PPp', { locale: es })}
                </p>
              )}
              {!isReady && (
                <p className="text-blue-500">Sistema inicializándose...</p>
              )}
              <p className="text-green-600">Se activa con cada transacción</p>
              <p className="text-blue-600">Pull automático al iniciar sesión</p>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualBackup}
              disabled={syncStatus === 'pushing' || syncStatus === 'pulling' || !isReady}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${(syncStatus === 'pushing' || syncStatus === 'pulling') ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{!isReady ? 'Inicializando...' : 'Respaldo manual a Supabase'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
