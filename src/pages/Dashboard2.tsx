import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/ui/page-title';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Grid, Col } from '@/components/ui/grid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';
import {
  getSalesByDateRange,
  getRecentSales,
  getLowStockProducts,
  getTopSellingProducts
} from '@/utils/salesUtils';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard2 = () => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [recentSalesData, setRecentSalesData] = useState<any[]>([]);
  const [lowStockData, setLowStockData] = useState<any[]>([]);
  const [topProductsData, setTopProductsData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      
      // Convert tenantId to string for all function calls
      const [
        salesData,
        recentSalesData,
        lowStockData,
        topProductsData
      ] = await Promise.all([
        getSalesByDateRange(tenantId, format(subDays(new Date(), 30), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd')),
        getRecentSales(tenantId, 5),
        getLowStockProducts(tenantId),
        getTopSellingProducts(tenantId, 5)
      ]);

      setSalesData(salesData);
      setRecentSalesData(recentSalesData);
      setLowStockData(lowStockData);
      setTopProductsData(topProductsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [tenantId]);

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <PageTitle
          title="Panel de Control"
          description="Visión general del rendimiento de tu negocio"
        />

        <Grid numColsLg={3} numColsMd={2} numColsSm={1} gapSize={6}>
          <Col>
            <Card>
              <CardHeader>
                <CardTitle>Ventas Totales (30 días)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-bold">{formatCurrency(
                    salesData.reduce((acc, sale) => acc + sale.total_amount, 0)
                  )}</div>
                )}
              </CardContent>
            </Card>
          </Col>

          <Col>
            <Card>
              <CardHeader>
                <CardTitle>Ventas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <ul className="list-none space-y-2">
                    {recentSalesData.map((sale) => (
                      <li key={sale.id} className="flex justify-between items-center">
                        <span>Venta #{sale.id.substring(0, 8)}</span>
                        <span className="font-medium">{formatCurrency(sale.total_amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </Col>

          <Col>
            <Card>
              <CardHeader>
                <CardTitle>Productos con Bajo Stock</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <ul className="list-none space-y-2">
                    {lowStockData.map((product) => (
                      <li key={product.id} className="flex justify-between items-center">
                        <span>{product.name}</span>
                        <span className="font-medium">{product.stock}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </Col>
        </Grid>

        <Grid numColsSm={1} numColsMd={1} numColsLg={1} gapSize={6}>
          <Col>
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ScrollArea className="h-64">
                    <ul className="list-none space-y-2">
                      {topProductsData.map((product) => (
                        <li key={product.id} className="flex justify-between items-center">
                          <span>{product.name}</span>
                          <span className="font-medium">{product.total_sales}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </Col>
        </Grid>

        <Grid numColsSm={1} numColsMd={1} numColsLg={1} gapSize={6}>
          <Col>
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Día (Últimos 30 días)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                      <Tooltip formatter={(value) => [formatCurrency(value as number), 'Ventas']} />
                      <Bar dataKey="total_amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Col>
        </Grid>
      </div>
    </Layout>
  );
};

export default Dashboard2;
