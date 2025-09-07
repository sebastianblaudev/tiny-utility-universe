import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Database, 
  Wifi, 
  Shield,
  Activity,
  Calendar,
  User,
  Store,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface DiagnosticResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
  timestamp: Date;
}

interface SalesAnalytics {
  totalSales: number;
  todaySales: number;
  orphanedSales: number;
  salesWithoutTenant: number;
  averageDaily: number;
}

export const DiagnosticPanel: React.FC = () => {
  const { tenantId, user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: DiagnosticResult[] = [];
    
    try {
      // 1. Tenant ID Validation
      if (!tenantId) {
        results.push({
          component: 'Tenant ID',
          status: 'error',
          message: 'Tenant ID no disponible - riesgo crítico',
          timestamp: new Date()
        });
      } else {
        results.push({
          component: 'Tenant ID',
          status: 'healthy',
          message: `Tenant ID válido: ${tenantId}`,
          timestamp: new Date()
        });
      }

      // 2. Database Connectivity
      try {
        const { data, error } = await supabase.from('sales').select('count').limit(1);
        if (error) throw error;
        results.push({
          component: 'Base de Datos',
          status: 'healthy',
          message: 'Conexión a base de datos activa',
          timestamp: new Date()
        });
      } catch (dbError) {
        results.push({
          component: 'Base de Datos',
          status: 'error',
          message: `Error de conexión: ${dbError}`,
          timestamp: new Date()
        });
      }

      // 3. Sales Data Integrity
      if (tenantId) {
        try {
          // Count total sales
          const { data: totalSalesData, error: totalError } = await supabase
            .from('sales')
            .select('count')
            .eq('tenant_id', tenantId);
          
          if (totalError) throw totalError;

          // Count today's sales
          const today = new Date().toISOString().split('T')[0];
          const { data: todayData, error: todayError } = await supabase
            .from('sales')
            .select('count')
            .eq('tenant_id', tenantId)
            .gte('created_at', today);

          if (todayError) throw todayError;

          // Check for orphaned sales (sales without items)
          const { data: orphanedData, error: orphanedError } = await supabase
            .from('sales')
            .select(`
              id,
              sale_items!left(id)
            `)
            .eq('tenant_id', tenantId)
            .is('sale_items.id', null);

          if (orphanedError) throw orphanedError;

          // Check for sales without tenant_id
          const { data: noTenantData, error: noTenantError } = await supabase
            .from('sales')
            .select('count')
            .is('tenant_id', null);

          if (noTenantError) throw noTenantError;

          const analytics: SalesAnalytics = {
            totalSales: totalSalesData?.length || 0,
            todaySales: todayData?.length || 0,
            orphanedSales: orphanedData?.length || 0,
            salesWithoutTenant: noTenantData?.length || 0,
            averageDaily: 0
          };

          setSalesAnalytics(analytics);

          // Determine health status
          const hasIssues = analytics.orphanedSales > 0 || analytics.salesWithoutTenant > 10;
          results.push({
            component: 'Integridad de Ventas',
            status: hasIssues ? 'warning' : 'healthy',
            message: hasIssues 
              ? `${analytics.orphanedSales} ventas huérfanas, ${analytics.salesWithoutTenant} sin tenant`
              : 'Integridad de datos correcta',
            details: analytics,
            timestamp: new Date()
          });

        } catch (salesError) {
          results.push({
            component: 'Integridad de Ventas',
            status: 'error',
            message: `Error al verificar ventas: ${salesError}`,
            timestamp: new Date()
          });
        }
      }

      // 4. Authentication Status
      if (user) {
        results.push({
          component: 'Autenticación',
          status: 'healthy',
          message: `Usuario autenticado: ${user.email}`,
          timestamp: new Date()
        });
      } else {
        results.push({
          component: 'Autenticación',
          status: 'warning',
          message: 'Usuario no autenticado',
          timestamp: new Date()
        });
      }

      // 5. Local Storage Health
      try {
        const storageTest = 'diagnostic_test';
        localStorage.setItem(storageTest, 'test');
        localStorage.removeItem(storageTest);
        
        const cachedTenantId = localStorage.getItem('current_tenant_id');
        results.push({
          component: 'Almacenamiento Local',
          status: cachedTenantId ? 'healthy' : 'warning',
          message: cachedTenantId 
            ? `Tenant ID en cache: ${cachedTenantId}`
            : 'No hay respaldo de tenant ID',
          timestamp: new Date()
        });
      } catch (storageError) {
        results.push({
          component: 'Almacenamiento Local',
          status: 'error',
          message: 'Error en almacenamiento local',
          timestamp: new Date()
        });
      }

      // 6. Date/Time Validation
      const now = new Date();
      const currentYear = now.getFullYear();
      const isDateValid = currentYear >= 2024 && currentYear <= 2030;
      
      results.push({
        component: 'Fecha/Hora del Sistema',
        status: isDateValid ? 'healthy' : 'warning',
        message: isDateValid 
          ? `Fecha correcta: ${now.toLocaleString()}`
          : `Fecha sospechosa: ${now.toLocaleString()}`,
        timestamp: new Date()
      });

    } catch (error) {
      results.push({
        component: 'Sistema General',
        status: 'error',
        message: `Error en diagnóstico: ${error}`,
        timestamp: new Date()
      });
    }

    setDiagnostics(results);
    setLastRun(new Date());
    setLoading(false);
    
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    if (errorCount > 0) {
      // Removed excessive toast notifications
    }
  };

  const repairOrphanedSales = async () => {
    if (!tenantId) {
      toast.error('No se puede reparar sin tenant ID');
      return;
    }

    try {
      setLoading(true);
      
      // Find and delete orphaned sales
      const { data: orphanedSales, error: findError } = await supabase
        .from('sales')
        .select('id')
        .eq('tenant_id', tenantId)
        .not('id', 'in', `(SELECT sale_id FROM sale_items WHERE sale_id IS NOT NULL)`);

      if (findError) throw findError;

      if (orphanedSales && orphanedSales.length > 0) {
        const { error: deleteError } = await supabase
          .from('sales')
          .delete()
          .in('id', orphanedSales.map(s => s.id));

        if (deleteError) throw deleteError;

        toast.success(`${orphanedSales.length} ventas huérfanas reparadas`);
        runDiagnostics(); // Re-run diagnostics
      } else {
        toast.info('No se encontraron ventas huérfanas');
      }
    } catch (error) {
      toast.error(`Error al reparar ventas: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run initial diagnostics
    runDiagnostics();
  }, [tenantId]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Saludable</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Advertencia</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const healthyCount = diagnostics.filter(d => d.status === 'healthy').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;
  const errorCount = diagnostics.filter(d => d.status === 'error').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Panel de Diagnóstico del Sistema
          </CardTitle>
          <Button 
            onClick={runDiagnostics} 
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Actualizar
          </Button>
        </div>
        
        {lastRun && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Última verificación: {lastRun.toLocaleString()}
          </p>
        )}

        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {healthyCount} Saludables
          </Badge>
          {warningCount > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {warningCount} Advertencias
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge variant="destructive">
              {errorCount} Errores
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="diagnostics" className="w-full">
          <TabsList>
            <TabsTrigger value="diagnostics">Diagnósticos</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnostics" className="space-y-4">
            {diagnostics.map((diagnostic, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                {getStatusIcon(diagnostic.status)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{diagnostic.component}</h4>
                    {getStatusBadge(diagnostic.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {diagnostic.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {diagnostic.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {diagnostics.some(d => d.component === 'Integridad de Ventas' && d.status !== 'healthy') && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-yellow-800">Reparación Disponible</h4>
                    <p className="text-sm text-yellow-700">
                      Se detectaron problemas de integridad en las ventas
                    </p>
                  </div>
                  <Button
                    onClick={repairOrphanedSales}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    Reparar Ahora
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {salesAnalytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Total Ventas</span>
                    </div>
                    <p className="text-2xl font-bold">{salesAnalytics.totalSales}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Hoy</span>
                    </div>
                    <p className="text-2xl font-bold">{salesAnalytics.todaySales}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Huérfanas</span>
                    </div>
                    <p className="text-2xl font-bold">{salesAnalytics.orphanedSales}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-muted-foreground">Sin Tenant</span>
                    </div>
                    <p className="text-2xl font-bold">{salesAnalytics.salesWithoutTenant}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tenant ID:</span>
                  <span className="text-sm font-mono">{tenantId || 'No disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Usuario:</span>
                  <span className="text-sm">{user?.email || 'No autenticado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fecha del Sistema:</span>
                  <span className="text-sm">{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estado de Conexión:</span>
                  <span className="text-sm">{navigator.onLine ? 'En línea' : 'Sin conexión'}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};