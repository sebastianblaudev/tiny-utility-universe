
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { CheckCircle, Users, CreditCard, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateMissingSaleTenantIds } from '@/utils/salesUtils';

const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [serviceRoleWarning, setServiceRoleWarning] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [ownTenantId, setOwnTenantId] = useState<string | null>(null);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const { tenantId } = useAuth();

  useEffect(() => {
    // Just set loading to false after a short delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    // Check if current user is super admin and get tenant ID
    const checkSuperAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      setIsSuperAdmin(
        user?.email === 'admin@sistema.com' || 
        !!user?.user_metadata?.isSuperAdmin
      );
      
      setOwnTenantId(user?.user_metadata?.tenant_id || null);
    };
    
    checkSuperAdmin();
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-update sales with missing tenant IDs
  useEffect(() => {
    if (tenantId) {
      handleUpdateSales();
    }
  }, [tenantId]);

  const handleUpdateSales = async () => {
    if (isAutoUpdating || !tenantId) return;
    
    setIsAutoUpdating(true);
    await updateMissingSaleTenantIds(tenantId, () => {
      // Optional callback when complete
      console.log("Sales updated from AdminPanel");
    });
    setIsAutoUpdating(false);
  };

  const dismissWarning = () => {
    setServiceRoleWarning(false);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="glass-morph border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Panel de Administración</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUpdateSales}
            disabled={isAutoUpdating}
            title="Actualizar ventas sin ID de negocio"
          >
            <RefreshCw size={16} className={`mr-2 ${isAutoUpdating ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {serviceRoleWarning && (
            <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                Configuración Requerida
              </h3>
              <p className="mt-2 text-yellow-700 dark:text-yellow-300">
                Las funciones de administración requieren una clave de servicio de Supabase para acceder a la API de administración. 
                Esta funcionalidad no está disponible directamente desde el frontend por razones de seguridad.
              </p>
              <p className="mt-2 text-yellow-700 dark:text-yellow-300">
                Para implementar funcionalidades de administración, necesitarás crear una función de Edge o un servidor backend 
                con las credenciales de servicio apropiadas.
              </p>
              <p className="mt-2 text-yellow-700 dark:text-yellow-300">
                Recuerda que el sistema utiliza multi-tenant y cada negocio debe ver solo sus propios datos.
                Tu ID de tenant es: {ownTenantId || 'No disponible'}
              </p>
              <Button 
                variant="outline" 
                className="mt-2 border-yellow-400 text-yellow-700 dark:text-yellow-300"
                onClick={dismissWarning}
              >
                Entendido
              </Button>
            </div>
          )}
          
          {loading ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-24" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !serviceRoleWarning && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              {isSuperAdmin && (
                <Link to="/license-management" className="block">
                  <Card className="h-full transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg font-medium">
                        <CreditCard className="text-blue-600" size={20} />
                        Gestión de Licencias
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">
                        Administra y supervisa las licencias de los usuarios en el sistema.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <CheckCircle size={12} />
                          Acceso completo
                        </span>
                        <Button size="sm" variant="outline">
                          Acceder
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
              
              <Card className="h-full transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg font-medium">
                    <Users className="text-blue-600" size={20} />
                    Gestión de Usuarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Administra los usuarios del sistema, sus roles y permisos.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      Configuración requerida
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toast.info("Esta funcionalidad requiere configuración adicional en el backend");
                      }}
                    >
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
