
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityEvent {
  event: string;
  details: any;
  timestamp: Date;
  severity: 'warning' | 'error' | 'critical';
}

const TenantSecurityAlert = () => {
  const { tenantId } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    // Listen for all security events, not just serious ones
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('TENANT_SECURITY_WARNING') || 
           args[0].includes('TENANT_SECURITY_ERROR') || 
           args[0].includes('cross-tenant'))) {
        const event = args[0];
        const severity = args[0].includes('ERROR') ? 'error' : 'warning';
        setSecurityEvents(prev => [...prev.slice(-4), {
          event,
          details: args[1] || {},
          timestamp: new Date(),
          severity
        }]);
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('TENANT_SECURITY_EVENT') || 
           args[0].includes('TENANT_SECURITY_WARNING'))) {
        const event = args[0];
        setSecurityEvents(prev => [...prev.slice(-4), {
          event,
          details: args[1] || {},
          timestamp: new Date(),
          severity: 'critical'
        }]);
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!tenantId) {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Alerta de Seguridad Crítica:</strong> No hay tenant ID disponible. Sistema de aislamiento comprometido. Por favor, reinicie sesión inmediatamente.
        </AlertDescription>
      </Alert>
    );
  }

  if (securityEvents.length === 0) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Sistema Seguro:</strong> Aislamiento de tenant activo - ID: {tenantId.substring(0, 8)}...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2 mb-4">
      {securityEvents.map((event, index) => (
        <Alert 
          key={index} 
          className={
            event.severity === 'critical' 
              ? "border-red-500 bg-red-100" 
              : event.severity === 'error'
              ? "border-orange-200 bg-orange-50"
              : "border-yellow-200 bg-yellow-50"
          }
        >
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <strong>
              {event.severity === 'critical' ? 'EVENTO CRÍTICO DE SEGURIDAD' : 
               event.severity === 'error' ? 'Error de Seguridad' : 'Advertencia de Seguridad'}:
            </strong> {event.event.replace('TENANT_SECURITY_WARNING: ', '').replace('TENANT_SECURITY_ERROR: ', '').replace('TENANT_SECURITY_EVENT: ', '')} - 
            {event.timestamp.toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default TenantSecurityAlert;
