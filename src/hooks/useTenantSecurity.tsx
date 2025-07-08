import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUserTenantId } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityEvent {
  event: string;
  timestamp: Date;
  severity: 'warning' | 'error' | 'critical';
  details?: any;
}

export const useTenantSecurity = () => {
  const { user, tenantId } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isSecure, setIsSecure] = useState(false);

  // Validar el estado de seguridad del tenant
  const validateTenantSecurity = async (): Promise<boolean> => {
    try {
      if (!user) {
        console.error("TENANT_SECURITY_CRITICAL: No authenticated user");
        return false;
      }

      if (!tenantId) {
        console.error("TENANT_SECURITY_CRITICAL: No tenant_id in auth context");
        addSecurityEvent('MISSING_TENANT_ID', 'critical', { userId: user.id });
        return false;
      }

      // Verificar que el tenant_id coincida con el metadata del usuario
      const currentTenantId = await getCurrentUserTenantId();
      if (currentTenantId !== tenantId) {
        console.error("TENANT_SECURITY_CRITICAL: Tenant ID mismatch", {
          authContext: tenantId,
          userMetadata: currentTenantId
        });
        addSecurityEvent('TENANT_ID_MISMATCH', 'critical', {
          authContext: tenantId,
          userMetadata: currentTenantId
        });
        return false;
      }

      setIsSecure(true);
      return true;
    } catch (error) {
      console.error("TENANT_SECURITY_ERROR: Validation failed", error);
      addSecurityEvent('VALIDATION_ERROR', 'error', { error: error.message });
      return false;
    }
  };

  // Agregar evento de seguridad
  const addSecurityEvent = (event: string, severity: 'warning' | 'error' | 'critical', details?: any) => {
    const newEvent: SecurityEvent = {
      event,
      severity,
      timestamp: new Date(),
      details
    };

    setSecurityEvents(prev => [...prev.slice(-9), newEvent]); // Mantener solo los últimos 10 eventos

    // Mostrar toast para eventos críticos
    if (severity === 'critical') {
      toast.error('Alerta de Seguridad Crítica', {
        description: `Evento: ${event}`,
        duration: 10000
      });
    }
  };

  // Interceptar logs de consola para capturar eventos de seguridad
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('TENANT_SECURITY')) {
        const event = args[0];
        const severity = event.includes('CRITICAL') ? 'critical' : 'error';
        addSecurityEvent(event, severity, args[1]);
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('TENANT_SECURITY')) {
        const event = args[0];
        addSecurityEvent(event, 'warning', args[1]);
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Validar seguridad al montar el componente
  useEffect(() => {
    validateTenantSecurity();
  }, [user, tenantId]);

  return {
    isSecure,
    securityEvents,
    validateTenantSecurity,
    addSecurityEvent
  };
};