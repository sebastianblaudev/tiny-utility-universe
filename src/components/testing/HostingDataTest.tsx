
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHostingBackupData } from '@/hooks/useHostingBackupData';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react';

const HostingDataTest = () => {
  const { 
    data, 
    loading, 
    error, 
    lastUpdated, 
    refreshData, 
    getStats, 
    isConnected 
  } = useHostingBackupData();

  const stats = getStats();

  const getConnectionStatus = () => {
    if (loading) return { icon: RefreshCw, color: 'text-blue-500', label: 'Conectando...', variant: 'secondary' as const };
    if (error) return { icon: XCircle, color: 'text-red-500', label: 'Error', variant: 'destructive' as const };
    if (isConnected) return { icon: CheckCircle, color: 'text-green-500', label: 'Conectado', variant: 'default' as const };
    return { icon: AlertCircle, color: 'text-yellow-500', label: 'Sin datos', variant: 'secondary' as const };
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Estado de Conexión con Hosting
            </CardTitle>
            <Button 
              onClick={refreshData} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refrescar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <StatusIcon className={`h-6 w-6 ${status.color} ${loading ? 'animate-spin' : ''}`} />
            <Badge variant={status.variant}>{status.label}</Badge>
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Última actualización: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-red-800 mb-2">Error de Conexión:</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="text-sm text-blue-600">Usuarios</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalSales}</div>
                <div className="text-sm text-green-600">Ventas</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.totalServices}</div>
                <div className="text-sm text-purple-600">Servicios</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.totalProducts}</div>
                <div className="text-sm text-orange-600">Productos</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs font-medium text-gray-600 truncate">
                  {stats.lastBackup ? new Date(stats.lastBackup).toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Último Backup</div>
              </div>
            </div>
          )}

          {data && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">✅ Conexión Exitosa</h3>
              <p className="text-sm text-green-700">
                Los datos se están cargando correctamente desde el hosting usando archivos JavaScript.
              </p>
              <div className="mt-2 text-xs text-green-600">
                Formato: backup_{'{email-sanitizado}'}.js
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de depuración detallado */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Datos Detallados (Depuración)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Timestamp:</strong> {data.timestamp}</div>
              <div><strong>Usuarios:</strong> {data.users.length} registros</div>
              <div><strong>Ventas:</strong> {data.sales.length} registros</div>
              <div><strong>Servicios:</strong> {data.services.length} registros</div>
              <div><strong>Productos:</strong> {data.products.length} registros</div>
              <div><strong>Adelantos:</strong> {data.advances.length} registros</div>
              <div><strong>Comisiones:</strong> {data.commissions.length} registros</div>
              <div><strong>Gastos:</strong> {data.expenses.length} registros</div>
              <div><strong>Propinas:</strong> {data.tips.length} registros</div>
              <div><strong>Promociones:</strong> {data.promotions.length} registros</div>
              <div><strong>Configuraciones:</strong> {Object.keys(data.settings).length} elementos</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HostingDataTest;
