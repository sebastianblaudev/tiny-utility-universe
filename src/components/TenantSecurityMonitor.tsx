import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useTenantSecurity } from '@/hooks/useTenantSecurity';
import { useAuth } from '@/contexts/AuthContext';

const TenantSecurityMonitor = () => {
  const { tenantId } = useAuth();
  const { isSecure, securityEvents } = useTenantSecurity();

  // No mostrar nada si no hay tenant_id (usuario no autenticado)
  if (!tenantId) {
    return (
      <Alert className="mb-4 border-red-500 bg-red-50">
        <XCircle className="h-4 w-4 text-red-500" />
        <AlertDescription>
          <strong>Error de Seguridad Crítico:</strong> No hay contexto de tenant disponible. 
          El sistema de aislamiento está comprometido. Reinicie su sesión inmediatamente.
        </AlertDescription>
      </Alert>
    );
  }

  // Sistema seguro
  if (isSecure && securityEvents.length === 0) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <strong>Sistema Seguro:</strong> Aislamiento de tenant activo (ID: {tenantId.substring(0, 8)}...)
        </AlertDescription>
      </Alert>
    );
  }

  // Mostrar eventos de seguridad si los hay
  if (securityEvents.length > 0) {
    const criticalEvents = securityEvents.filter(e => e.severity === 'critical');
    const errorEvents = securityEvents.filter(e => e.severity === 'error');
    const warningEvents = securityEvents.filter(e => e.severity === 'warning');

    return (
      <div className="space-y-2 mb-4">
        {criticalEvents.map((event, index) => (
          <Alert key={`critical-${index}`} className="border-red-500 bg-red-100">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription>
              <strong>EVENTO CRÍTICO DE SEGURIDAD:</strong> {event.event.replace('TENANT_SECURITY_CRITICAL: ', '')} - {event.timestamp.toLocaleTimeString()}
            </AlertDescription>
          </Alert>
        ))}
        
        {errorEvents.map((event, index) => (
          <Alert key={`error-${index}`} className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription>
              <strong>Error de Seguridad:</strong> {event.event.replace('TENANT_SECURITY_ERROR: ', '')} - {event.timestamp.toLocaleTimeString()}
            </AlertDescription>
          </Alert>
        ))}
        
        {warningEvents.map((event, index) => (
          <Alert key={`warning-${index}`} className="border-yellow-200 bg-yellow-50">
            <Shield className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              <strong>Advertencia de Seguridad:</strong> {event.event.replace('TENANT_SECURITY_WARNING: ', '')} - {event.timestamp.toLocaleTimeString()}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  }

  return null;
};

export default TenantSecurityMonitor;