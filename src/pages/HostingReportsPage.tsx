
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHostingBackupData } from '@/hooks/useHostingBackupData';
import { RefreshCw, DollarSign, Users, ShoppingBag, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const HostingReportsPage = () => {
  const { data, loading, error, refreshData, userEmail } = useHostingBackupData();
  const { toast } = useToast();

  const handleRefresh = async () => {
    refreshData();
    toast({
      title: "Datos actualizados",
      description: "Los reportes han sido actualizados desde el hosting",
    });
  };

  // Calcular estadísticas básicas
  const calculateStats = () => {
    if (!data) return null;

    const totalSales = data.sales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
    const totalServices = data.sales?.reduce((sum, sale) => sum + (sale.items?.filter((item: any) => item.type === 'service').length || 0), 0) || 0;
    const totalProducts = data.sales?.reduce((sum, sale) => sum + (sale.items?.filter((item: any) => item.type === 'product').length || 0), 0) || 0;
    const totalTips = data.tips?.reduce((sum, tip) => sum + (tip.amount || 0), 0) || 0;

    return {
      totalSales,
      totalServices,
      totalProducts,
      totalTips,
      salesCount: data.sales?.length || 0,
      barbersCount: data.barbers?.length || 0,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reportes desde Hosting</h1>
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
        <div className="text-center py-8">
          <p>Cargando datos desde el hosting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reportes desde Hosting</h1>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="text-red-500" size={24} />
            <div>
              <p className="font-medium text-red-700">Error al cargar datos</p>
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-xs text-gray-500 mt-1">Usuario: {userEmail}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reportes desde Hosting</h1>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Estado de la conexión */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle className="text-green-500" size={20} />
          <div className="flex-1">
            <p className="font-medium text-green-700">Conectado al hosting</p>
            <p className="text-sm text-green-600">
              Última actualización: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
            </p>
            <p className="text-xs text-gray-500">Usuario: {userEmail}</p>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.salesCount} transacciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Barberos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.barbersCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalServices} servicios realizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                productos vendidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propinas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalTips.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {data?.tips?.length || 0} propinas registradas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ventas recientes */}
      {data?.sales && data.sales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Barbero</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Método de Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sales.slice(0, 10).map((sale: any, index: number) => (
                  <TableRow key={sale.id || index}>
                    <TableCell>
                      {sale.date ? new Date(sale.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{sale.customerName || 'Cliente'}</TableCell>
                    <TableCell>{sale.barberName || 'N/A'}</TableCell>
                    <TableCell>${(sale.total || 0).toFixed(2)}</TableCell>
                    <TableCell className="capitalize">
                      {sale.paymentMethod || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Información del respaldo */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Respaldo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Email del negocio:</span>
                <p>{data.businessEmail}</p>
              </div>
              <div>
                <span className="font-medium">Versión:</span>
                <p>{data.version}</p>
              </div>
              <div>
                <span className="font-medium">Tipo de respaldo:</span>
                <p className="capitalize">{data.backupType}</p>
              </div>
              <div>
                <span className="font-medium">Fecha de exportación:</span>
                <p>{data.exportDate ? new Date(data.exportDate).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HostingReportsPage;
