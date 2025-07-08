
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { validateTenantAccess, logTenantSecurityEvent } from '@/utils/tenantValidator';
import { toast } from 'sonner';

export const useTenantValidation = (requiredTenantId?: string | null) => {
  const { tenantId, user } = useAuth();

  useEffect(() => {
    const validateAccess = async () => {
      if (!user) return;
      
      if (!tenantId) {
        logTenantSecurityEvent('MISSING_TENANT_ID', {
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        toast.error("Error de seguridad: No se encontró ID de tenant");
        return;
      }

      if (requiredTenantId) {
        const isValid = await validateTenantAccess(requiredTenantId);
        if (!isValid) {
          logTenantSecurityEvent('CROSS_TENANT_ACCESS_ATTEMPT', {
            userId: user.id,
            currentTenant: tenantId,
            requestedTenant: requiredTenantId,
            timestamp: new Date().toISOString()
          });
          toast.error("Error de seguridad: Acceso denegado");
        }
      }
    };

    validateAccess();
  }, [tenantId, requiredTenantId, user]);

  return { tenantId, isValid: !!tenantId };
};
