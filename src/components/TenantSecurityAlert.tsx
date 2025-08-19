
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityEvent {
  event: string;
  details: any;
  timestamp: Date;
}

const TenantSecurityAlert = () => {
  const { tenantId } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    // Listen for serious security events only
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('TENANT_SECURITY_WARNING') || args[0].includes('cross-tenant'))) {
        const event = args[0];
        setSecurityEvents(prev => [...prev.slice(-2), {
          event,
          details: args[1] || {},
          timestamp: new Date()
        }]);
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!tenantId) {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Alerta de Seguridad:</strong> No hay tenant ID disponible. Por favor, inicia sesión nuevamente.
        </AlertDescription>
      </Alert>
    );
  }

  if (securityEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {securityEvents.map((event, index) => (
        <Alert key={index} className="border-yellow-200 bg-yellow-50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Evento de Seguridad:</strong> {event.event} - 
            {event.timestamp.toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default TenantSecurityAlert;
