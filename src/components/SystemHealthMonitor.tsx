import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Wifi, 
  WifiOff, 
  Shield, 
  ShieldAlert, 
  Clock, 
  ClockIcon, 
  User, 
  UserX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Wrench
} from 'lucide-react';
import { getTenantIdWithFallbacks } from '@/utils/tenantValidationUtils';
import { validateClientServerTime } from '@/utils/dateValidationUtils';

interface SystemHealth {
  connectivity: 'online' | 'offline';
  authentication: 'authenticated' | 'unauthenticated' | 'error';
  tenantId: 'valid' | 'missing' | 'fallback';
  dateTime: 'valid' | 'warning' | 'error';
  lastCheck: Date;
}

const SystemHealthMonitor: React.FC = () => {
  const { user, tenantId } = useAuth();
  const [health, setHealth] = useState<SystemHealth>({
    connectivity: navigator.onLine ? 'online' : 'offline',
    authentication: user ? 'authenticated' : 'unauthenticated',
    tenantId: tenantId ? 'valid' : 'missing',
    dateTime: 'valid',
    lastCheck: new Date()
  });
  const [isVisible, setIsVisible] = useState(false);
  const [autoFixAttempted, setAutoFixAttempted] = useState(false);

  const checkSystemHealth = async () => {
    const newHealth: SystemHealth = {
      connectivity: navigator.onLine ? 'online' : 'offline',
      authentication: user ? 'authenticated' : 'unauthenticated',
      tenantId: 'missing',
      dateTime: 'valid',
      lastCheck: new Date()
    };

    // Check tenant ID with fallbacks
    try {
      const resolvedTenantId = await getTenantIdWithFallbacks();
      if (resolvedTenantId) {
        newHealth.tenantId = resolvedTenantId === tenantId ? 'valid' : 'fallback';
      } else {
        newHealth.tenantId = 'missing';
      }
    } catch (error) {
      console.error('Error checking tenant ID:', error);
      newHealth.tenantId = 'missing';
    }

    // Check date/time validity
    try {
      const timeValidation = await validateClientServerTime();
      if (timeValidation.isValid) {
        newHealth.dateTime = 'valid';
      } else if (timeValidation.differenceMinutes > 5) {
        newHealth.dateTime = 'error';
      } else {
        newHealth.dateTime = 'warning';
      }
    } catch (error) {
      console.error('Error validating time:', error);
      newHealth.dateTime = 'warning';
    }

    setHealth(newHealth);

    // Auto-fix critical issues
    if (!autoFixAttempted && (newHealth.tenantId === 'missing' || newHealth.authentication === 'unauthenticated')) {
      attemptAutoFix();
    }

    // Show monitor if there are issues
    const hasIssues = newHealth.tenantId === 'missing' || 
                     newHealth.authentication === 'error' || 
                     newHealth.dateTime === 'error' ||
                     newHealth.connectivity === 'offline';
    
    setIsVisible(hasIssues);
  };

  const attemptAutoFix = async () => {
    setAutoFixAttempted(true);
    
    try {
      // Try to recover tenant ID
      const recoveredTenantId = await getTenantIdWithFallbacks();
      if (recoveredTenantId) {
        toast.success('Tenant ID recuperado automáticamente');
        checkSystemHealth(); // Re-check after recovery
        return;
      }

      // If still no tenant ID, suggest user actions
      if (!recoveredTenantId && user) {
        toast.warning('Reinicie sesión para recuperar acceso completo', {
          action: {
            label: 'Reiniciar',
            onClick: () => window.location.reload()
          }
        });
      }
    } catch (error) {
      console.error('Auto-fix failed:', error);
      toast.error('No se pudo reparar automáticamente el sistema');
    }
  };

  useEffect(() => {
    // Initial check
    checkSystemHealth();

    // Set up periodic monitoring
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds

    // Listen to online/offline events
    const handleOnline = () => {
      checkSystemHealth();
      toast.success('Conexión restaurada');
    };

    const handleOffline = () => {
      checkSystemHealth();
      toast.warning('Conexión perdida - modo offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, tenantId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
      case 'online':
      case 'authenticated':
        return 'text-green-500';
      case 'warning':
      case 'fallback':
        return 'text-yellow-500';
      case 'error':
      case 'missing':
      case 'offline':
      case 'unauthenticated':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (component: string, status: string) => {
    const colorClass = getStatusColor(status);
    
    switch (component) {
      case 'connectivity':
        return status === 'online' ? 
          <Wifi className={`h-4 w-4 ${colorClass}`} /> : 
          <WifiOff className={`h-4 w-4 ${colorClass}`} />;
      case 'authentication':
        return status === 'authenticated' ? 
          <User className={`h-4 w-4 ${colorClass}`} /> : 
          <UserX className={`h-4 w-4 ${colorClass}`} />;
      case 'tenantId':
        return status === 'valid' ? 
          <Shield className={`h-4 w-4 ${colorClass}`} /> : 
          <ShieldAlert className={`h-4 w-4 ${colorClass}`} />;
      case 'dateTime':
        return status === 'valid' ? 
          <Clock className={`h-4 w-4 ${colorClass}`} /> : 
          <ClockIcon className={`h-4 w-4 ${colorClass}`} />;
      default:
        return status === 'valid' ? 
          <CheckCircle className={`h-4 w-4 ${colorClass}`} /> : 
          <XCircle className={`h-4 w-4 ${colorClass}`} />;
    }
  };

  const getStatusMessage = (component: string, status: string) => {
    switch (`${component}-${status}`) {
      case 'connectivity-online':
        return 'En línea';
      case 'connectivity-offline':
        return 'Sin conexión';
      case 'authentication-authenticated':
        return 'Autenticado';
      case 'authentication-unauthenticated':
        return 'No autenticado';
      case 'authentication-error':
        return 'Error de autenticación';
      case 'tenantId-valid':
        return 'ID válido';
      case 'tenantId-fallback':
        return 'Usando respaldo';
      case 'tenantId-missing':
        return 'ID faltante';
      case 'dateTime-valid':
        return 'Fecha correcta';
      case 'dateTime-warning':
        return 'Diferencia menor';
      case 'dateTime-error':
        return 'Fecha incorrecta';
      default:
        return status;
    }
  };

  if (!isVisible) return null;

  const criticalIssues = [
    health.tenantId === 'missing',
    health.authentication === 'error',
    health.dateTime === 'error'
  ].filter(Boolean).length;

  const warnings = [
    health.connectivity === 'offline',
    health.tenantId === 'fallback',
    health.dateTime === 'warning'
  ].filter(Boolean).length;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="bg-white dark:bg-gray-800 shadow-lg border-l-4 border-l-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Estado del Sistema</span>
            </div>
            <div className="flex gap-1">
              {criticalIssues > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalIssues} Crítico{criticalIssues > 1 ? 's' : ''}
                </Badge>
              )}
              {warnings > 0 && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  {warnings} Advertencia{warnings > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {/* Connectivity Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon('connectivity', health.connectivity)}
                <span className="text-xs">Conexión</span>
              </div>
              <span className="text-xs">{getStatusMessage('connectivity', health.connectivity)}</span>
            </div>

            {/* Authentication Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon('authentication', health.authentication)}
                <span className="text-xs">Autenticación</span>
              </div>
              <span className="text-xs">{getStatusMessage('authentication', health.authentication)}</span>
            </div>

            {/* Tenant ID Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon('tenantId', health.tenantId)}
                <span className="text-xs">Tenant ID</span>
              </div>
              <span className="text-xs">{getStatusMessage('tenantId', health.tenantId)}</span>
            </div>

            {/* Date/Time Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon('dateTime', health.dateTime)}
                <span className="text-xs">Fecha/Hora</span>
              </div>
              <span className="text-xs">{getStatusMessage('dateTime', health.dateTime)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {health.lastCheck.toLocaleTimeString()}
            </span>
            <div className="flex gap-1">
              {criticalIssues > 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 px-2 text-xs"
                  onClick={attemptAutoFix}
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  Reparar
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-xs"
                onClick={() => setIsVisible(false)}
              >
                ✕
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealthMonitor;