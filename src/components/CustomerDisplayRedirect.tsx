
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CustomerDisplayRedirectProps {
  version?: 1 | 2;
}

const CustomerDisplayRedirect: React.FC<CustomerDisplayRedirectProps> = ({ version = 2 }) => {
  const { tenantId } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get the tenant ID either from context or from localStorage as fallback
    const effectiveTenantId = tenantId || localStorage.getItem('current_tenant_id');
    
    if (effectiveTenantId) {
      // Make sure to use the correct parameter name: tenant instead of tenantId
      const displayPath = version === 1 ? '/pantalla' : '/pantalla2';
      
      // Ensure we're using the full URL with origin to avoid any path issues
      const targetUrl = `${window.location.origin}${displayPath}?tenant=${encodeURIComponent(effectiveTenantId)}`;
      
      console.log(`Abriendo pantalla de cliente, datos:`, {
        tenantId: effectiveTenantId,
        fromContext: Boolean(tenantId),
        fromLocalStorage: Boolean(localStorage.getItem('current_tenant_id')),
        targetUrl,
        version
      });
      
      toast({
        title: "Abriendo pantalla para cliente",
        description: `ID de negocio: ${effectiveTenantId}`,
        duration: 3000
      });

      // Open in a new tab
      try {
        const newWindow = window.open(targetUrl, '_blank');
        if (!newWindow) {
          setError("El navegador bloqueó la apertura de la nueva ventana. Por favor, permita las ventanas emergentes.");
          console.error("Navegador bloqueó la apertura de la ventana");
        }
      } catch (e) {
        console.error("Error al abrir la ventana:", e);
        setError(`Error al abrir la ventana: ${e}`);
      }
    } else {
      const errorMsg = "No se pudo determinar el tenant_id para la pantalla del cliente";
      console.error(errorMsg);
      setError(errorMsg);
      toast({
        title: "Error",
        description: "No se pudo determinar el ID del negocio para la pantalla",
        variant: "destructive"
      });
    }
  }, [tenantId, version, toast]);

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-center">
      {error ? (
        <p className="mb-2 text-red-500 dark:text-red-400">{error}</p>
      ) : (
        <p className="mb-2 text-gray-700 dark:text-gray-300">
          {tenantId || localStorage.getItem('current_tenant_id')
            ? "Abriendo pantalla para cliente en una nueva pestaña..." 
            : "No se pudo determinar el ID del negocio"}
        </p>
      )}
      
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {tenantId && <div>Tenant ID desde contexto: {tenantId}</div>}
        {localStorage.getItem('current_tenant_id') && 
          <div>Tenant ID desde localStorage: {localStorage.getItem('current_tenant_id')}</div>}
      </div>
    </div>
  );
};

export default CustomerDisplayRedirect;
