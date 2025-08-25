import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOffline } from '@/hooks/useOffline';
import { Wifi, WifiOff, RotateCcw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const OfflineIndicator: React.FC = () => {
  const { isOnline, queuedSalesCount, syncNow } = useOffline();

  if (isOnline && queuedSalesCount === 0) {
    return null; // Don't show anything when online and no pending syncs
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {!isOnline && (
        <Alert variant="destructive" className="mb-2">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Sin conexión - Modo offline</span>
            <Badge variant="secondary" className="ml-2">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      {queuedSalesCount > 0 && (
        <Alert className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{queuedSalesCount} venta(s) pendientes de sincronizar</span>
            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={syncNow}
                className="ml-2"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Sincronizar
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isOnline && queuedSalesCount === 0 && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <Wifi className="h-4 w-4" />
          <AlertDescription className="flex items-center">
            <span>Conectado - Todos los datos sincronizados</span>
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </Badge>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OfflineIndicator;