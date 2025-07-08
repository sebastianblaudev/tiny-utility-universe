import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/ui/page-title';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, CalendarDays, PackageOpen, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getSalesByDateRange,
  getRecentSales,
  getLowStockProducts,
  getTopSellingProducts
} from '@/utils/salesUtils';

const Dashboard = () => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [recentSalesData, setRecentSalesData] = useState<any[]>([]);
  const [lowStockData, setLowStockData] = useState<any[]>([]);
  const [topProductsData, setTopProductsData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    console.log("Dashboard - Starting data fetch with tenantId:", tenantId);
    
    if (!tenantId) {
      console.error("Dashboard - No tenant ID available");
      setError("No se pudo identificar el negocio. Por favor, inicia sesión nuevamente.");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Dashboard - Fetching data for tenant:", tenantId);
      
      const results = await Promise.allSettled([
        getSalesByDateRange(tenantId.toString(), format(subDays(new Date(), 30), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd')),
        getRecentSales(tenantId.toString(), 5),
        getLowStockProducts(tenantId.toString()),
        getTopSellingProducts(tenantId.toString(), 5)
      ]);

      // Handle results with better error management
      const salesResult = results[0];
      if (salesResult.status === 'fulfilled') {
        setSalesData(Array.isArray(salesResult.value) ? salesResult.value : []);
        console.log("Dashboard - Sales data loaded:", salesResult.value?.length || 0, "records");
      } else {
        console.error("Dashboard - Sales data error:", salesResult.reason);
        setSalesData([]);
      }

      const recentSalesResult = results[1];
      if (recentSalesResult.status === 'fulfilled') {
        setRecentSalesData(Array.isArray(recentSalesResult.value) ? recentSalesResult.value : []);
        console.log("Dashboard - Recent sales loaded:", recentSalesResult.value?.length || 0, "records");
      } else {
        console.error("Dashboard - Recent sales error:", recentSalesResult.reason);
        setRecentSalesData([]);
      }

      const lowStockResult = results[2];
      if (lowStockResult.status === 'fulfilled') {
        setLowStockData(Array.isArray(lowStockResult.value) ? lowStockResult.value : []);
        console.log("Dashboard - Low stock data loaded:", lowStockResult.value?.length || 0, "records");
      } else {
        console.error("Dashboard - Low stock error:", lowStockResult.reason);
        setLowStockData([]);
      }

      const topProductsResult = results[3];
      if (topProductsResult.status === 'fulfilled') {
        setTopProductsData(Array.isArray(topProductsResult.value) ? topProductsResult.value : []);
        console.log("Dashboard - Top products loaded:", topProductsResult.value?.length || 0, "records");
      } else {
        console.error("Dashboard - Top products error:", topProductsResult.reason);
        setTopProductsData([]);
      }

    } catch (error) {
      console.error('Dashboard - Unexpected error fetching data:', error);
      setError("Error al cargar los datos del panel. Por favor, intenta nuevamente.");
      // Set empty arrays on error
      setSalesData([]);
      setRecentSalesData([]);
      setLowStockData([]);
      setTopProductsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [tenantId]);

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p className="text-lg font-semibold mb-2">Error al cargar el panel</p>
                <p>{error}</p>
                <button 
                  onClick={fetchDashboardData}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Reintentar
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <PageTitle
          title="Panel de Control"
          description="Visión general del rendimiento de tu negocio"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventas Totales
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? 'Cargando...' : `$${salesData.reduce((acc, sale) => acc + (sale.total || 0), 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 días ({salesData.length} ventas)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventas Recientes
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? 'Cargando...' : recentSalesData.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimas ventas registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Stock Bajo
              </CardTitle>
              <PackageOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? 'Cargando...' : lowStockData.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Productos con stock bajo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Productos
              </CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? 'Cargando...' : topProductsData.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Más vendidos
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ventas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando ventas...</p>
              ) : recentSalesData.length === 0 ? (
                <p className="text-muted-foreground">No hay ventas recientes registradas</p>
              ) : (
                <div className="space-y-4">
                  {recentSalesData.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Venta #{sale.id.substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.date ? format(new Date(sale.date), 'dd MMM yyyy', { locale: es }) : 'Fecha no disponible'}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        ${(sale.total || 0).toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos con Stock Bajo</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando productos...</p>
              ) : lowStockData.length === 0 ? (
                <p className="text-muted-foreground">No hay productos con stock bajo</p>
              ) : (
                <div className="space-y-4">
                  {lowStockData.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Código: {product.code}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {product.stock} unidades
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
