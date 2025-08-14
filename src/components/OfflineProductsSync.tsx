import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useOffline } from '@/hooks/useOffline';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const OfflineProductsSync: React.FC = () => {
  const { isOnline, cacheProducts } = useOffline();
  const { user } = useAuth();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineProductsCount, setOfflineProductsCount] = useState(0);

  // Load offline products count on mount
  useEffect(() => {
    loadOfflineProductsCount();
  }, []);

  const loadOfflineProductsCount = async () => {
    try {
      const { offlineManager } = await import('@/utils/offlineUtils');
      const products = await offlineManager.getOfflineProducts();
      setOfflineProductsCount(products.length);
      
      // Get last sync time from settings
      const lastSync = await offlineManager.getSetting('lastProductSync');
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    } catch (error) {
      console.error('Error loading offline products count:', error);
    }
  };

  const syncProducts = async () => {
    if (!isOnline || !user?.id) return;

    setIsSyncing(true);
    try {
      // Fetch products from Supabase
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      // Cache products for offline use
      await cacheProducts(products || []);
      
      // Store sync timestamp
      const { offlineManager } = await import('@/utils/offlineUtils');
      await offlineManager.storeSetting('lastProductSync', Date.now());
      
      setLastSyncTime(new Date());
      setOfflineProductsCount(products?.length || 0);

      console.log(`Synced ${products?.length || 0} products for offline use`);
    } catch (error) {
      console.error('Error syncing products:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOnline && offlineProductsCount === 0) {
    return (
      <Alert variant="destructive">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Sin conexión y sin productos en cache. Conéctate a internet para sincronizar productos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600" />
          )}
          
          <div>
            <h3 className="font-medium">
              Estado de Sincronización de Productos
            </h3>
            <p className="text-sm text-muted-foreground">
              {offlineProductsCount} productos disponibles offline
              {lastSyncTime && (
                <span className="ml-2">
                  • Última sincronización: {lastSyncTime.toLocaleString()}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "default" : "secondary"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
          
          {isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={syncProducts}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          )}
        </div>
      </div>

      {!isOnline && offlineProductsCount > 0 && (
        <Alert>
          <AlertDescription>
            Trabajando en modo offline con {offlineProductsCount} productos en cache. 
            Los cambios se sincronizarán cuando se restaure la conexión.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OfflineProductsSync;