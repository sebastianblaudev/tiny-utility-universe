import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Lock, Unlock, Shield, Smartphone } from 'lucide-react';
import { toggleMenuItemLock, getAllPageLocks, getCurrentUserTenantId } from '@/lib/supabase-helpers';
import { usePageLocks } from '@/hooks/usePageLocks';

interface PageLock {
  id: string;
  page_route: string;
  page_name: string;
  is_locked: boolean;
  locked_at?: string;
}

// Define all system pages that can be controlled
const SYSTEM_PAGES = [
  { route: '/pos', name: 'Punto de Venta (POS)' },
  { route: '/products', name: 'Productos' },
  { route: '/customers2', name: 'Clientes' },
  { route: '/estadisticas', name: 'Estadísticas' },
  { route: '/historial-ventas', name: 'Historial de Ventas' },
  { route: '/turnos', name: 'Turnos' },
  { route: '/configuracion', name: 'Configuración' },
  { route: '/ingredientes', name: 'Ingredientes' },
  { route: '/cashier-stats', name: 'Estadísticas Cajero' },
  { route: '/video-tutoriales', name: 'Video Tutoriales' },
  { route: '/mobile-dashboard', name: 'Dashboard Móvil' },
  { route: '/admin', name: 'Panel Admin' },
];

const OwnerControl: React.FC = () => {
  const { pageLocks, loading, refreshLocks } = usePageLocks();
  const [updating, setUpdating] = useState<string>('');

  const handleToggleLock = async (pageRoute: string, currentLocked: boolean) => {
    if (updating) return;
    
    setUpdating(pageRoute);
    
    try {
      const success = await toggleMenuItemLock(pageRoute, !currentLocked);
      
      if (success) {
        toast.success(
          !currentLocked ? `Página bloqueada: ${getPageName(pageRoute)}` : `Página desbloqueada: ${getPageName(pageRoute)}`,
          {
            description: !currentLocked ? 'Los empleados no podrán acceder a esta página' : 'Los empleados pueden acceder nuevamente',
            duration: 3000
          }
        );
        await refreshLocks();
      } else {
        toast.error('Error al cambiar el estado de la página');
      }
    } catch (error) {
      console.error('Error toggling page lock:', error);
      toast.error('Error al procesar la solicitud');
    } finally {
      setUpdating('');
    }
  };

  const getPageName = (route: string): string => {
    const page = SYSTEM_PAGES.find(p => p.route === route);
    return page?.name || route;
  };

  const isPageLocked = (route: string): boolean => {
    const lock = pageLocks.find(lock => lock.page_route === route);
    return lock?.is_locked || false;
  };

  const getPageLock = (route: string): PageLock | undefined => {
    return pageLocks.find(lock => lock.page_route === route);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Cargando control remoto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Control Remoto</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Smartphone className="h-4 w-4" />
              Gestión de acceso para empleados
            </p>
          </div>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid gap-4">
        {SYSTEM_PAGES.map((page) => {
          const locked = isPageLocked(page.route);
          const pageLock = getPageLock(page.route);
          const isUpdating = updating === page.route;

          return (
            <Card key={page.route} className="p-4 bg-card/60 backdrop-blur border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg transition-colors ${
                    locked ? 'bg-destructive/10' : 'bg-success/10'
                  }`}>
                    {locked ? (
                      <Lock className="h-5 w-5 text-destructive" />
                    ) : (
                      <Unlock className="h-5 w-5 text-success" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{page.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                        {page.route}
                      </code>
                      <Badge 
                        variant={locked ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {locked ? 'Bloqueado' : 'Permitido'}
                      </Badge>
                    </div>
                    {locked && pageLock?.locked_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Bloqueado: {new Date(pageLock.locked_at).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>

                <Switch
                  checked={locked}
                  onCheckedChange={() => handleToggleLock(page.route, locked)}
                  disabled={isUpdating}
                  className="data-[state=checked]:bg-destructive"
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="mt-8 p-4 bg-card/40 backdrop-blur rounded-lg border border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Estado del sistema:</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-destructive rounded-full"></div>
              {pageLocks.filter(lock => lock.is_locked).length} bloqueadas
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              {SYSTEM_PAGES.length - pageLocks.filter(lock => lock.is_locked).length} permitidas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerControl;