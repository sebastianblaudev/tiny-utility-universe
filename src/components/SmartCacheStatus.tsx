import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSmartCache } from '@/hooks/useSmartCache';
import { 
  Database, 
  Zap, 
  Clock, 
  BarChart3, 
  RefreshCw, 
  HardDrive,
  TrendingUp,
  Wifi,
  WifiOff
} from 'lucide-react';

const SmartCacheStatus: React.FC = () => {
  const {
    metrics,
    isLoading,
    isSyncing,
    lastSyncTime,
    cacheEnabled,
    syncProducts,
    optimizeCache,
    preloadPopularProducts
  } = useSmartCache();

  const isOnline = navigator.onLine;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatHitRatio = (ratio: number): string => {
    return `${(ratio * 100).toFixed(1)}%`;
  };

  if (!cacheEnabled) {
    return (
      <Card className="p-4 border-destructive bg-destructive/5">
        <div className="flex items-center gap-2 text-destructive">
          <Database className="h-4 w-4" />
          <span className="text-sm font-medium">Caché inteligente deshabilitada</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-2 mb-2 bg-muted/30">
      {/* Compact header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
            <Badge 
              variant={isSyncing ? 'secondary' : isOnline ? 'default' : 'destructive'}
              className="text-xs px-1 py-0"
            >
              {isSyncing ? 'sync' : isOnline ? 'online' : 'offline'}
            </Badge>
          </div>
          
          {metrics && (
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">
                {metrics.totalProducts} productos
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {metrics && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">
                {formatHitRatio(metrics.hitRatio)}
              </span>
            </div>
          )}
          
          {lastSyncTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-muted-foreground">
                {lastSyncTime.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => syncProducts(true)}
            disabled={isSyncing || !isOnline}
            className="h-6 w-6 p-0"
            title="Sincronizar productos"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      
      {isSyncing && (
        <div className="mt-1">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </Card>
  );
};

export default SmartCacheStatus;