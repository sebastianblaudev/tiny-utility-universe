import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, Package, Calendar, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface DailySalesData {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  salesCount: number;
}

const AdminDashboard = () => {
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailySalesData>({
    totalSales: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
    salesCount: 0
  });

  useEffect(() => {
    if (tenantId) {
      fetchDailyData();
    }
  }, [tenantId]);

  const fetchDailyData = async () => {
    try {
      setLoading(true);
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Fetch today's sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          date,
          sale_items (
            quantity,
            price,
            product_id,
            products (
              cost_price,
              name
            )
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .gte('date', startOfDay.toISOString())
        .lt('date', endOfDay.toISOString());

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        toast.error('Error al cargar datos de ventas');
        return;
      }

      let totalRevenue = 0;
      let totalCost = 0;
      let salesCount = sales?.length || 0;

      sales?.forEach(sale => {
        totalRevenue += Number(sale.total);
        
        sale.sale_items?.forEach(item => {
          const costPrice = Number(item.products?.cost_price || 0);
          const quantity = Number(item.quantity);
          totalCost += costPrice * quantity;
        });
      });

      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      setDailyData({
        totalSales: salesCount,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin,
        salesCount
      });

    } catch (error) {
      console.error('Error loading daily data:', error);
      toast.error('Error al cargar información del día');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return 'bg-green-100 text-green-800';
    if (margin >= 15) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString('es-CL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <Button 
            onClick={() => navigate('/products')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <Package className="h-5 w-5 mr-2" />
            Inventario Rápido
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <Separator />

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Sales Count */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Ventas del Día</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {loading ? '...' : dailyData.salesCount}
              </div>
              <p className="text-xs text-blue-600 mt-1">transacciones completadas</p>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {loading ? '...' : formatCurrency(dailyData.totalRevenue)}
              </div>
              <p className="text-xs text-green-600 mt-1">ventas del día</p>
            </CardContent>
          </Card>

          {/* Total Profit */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Ganancia Neta</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getProfitColor(dailyData.totalProfit)}`}>
                {loading ? '...' : formatCurrency(dailyData.totalProfit)}
              </div>
              <p className="text-xs text-purple-600 mt-1">ingresos - costos</p>
            </CardContent>
          </Card>

          {/* Profit Margin */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Margen de Ganancia</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-orange-900">
                  {loading ? '...' : `${dailyData.profitMargin.toFixed(1)}%`}
                </div>
                <Badge className={getMarginColor(dailyData.profitMargin)}>
                  {dailyData.profitMargin >= 30 ? 'Excelente' : 
                   dailyData.profitMargin >= 15 ? 'Bueno' : 'Bajo'}
                </Badge>
              </div>
              <p className="text-xs text-orange-600 mt-1">ganancia / ingresos</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Desglose Financiero del Día</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Ingresos Totales</p>
                <p className="text-xl font-bold text-blue-900">
                  {formatCurrency(dailyData.totalRevenue)}
                </p>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Costos Totales</p>
                <p className="text-xl font-bold text-red-900">
                  {formatCurrency(dailyData.totalCost)}
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Ganancia Neta</p>
                <p className={`text-xl font-bold ${getProfitColor(dailyData.totalProfit)}`}>
                  {formatCurrency(dailyData.totalProfit)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Resumen del Rendimiento</h3>
                <p className="text-sm text-muted-foreground">
                  Análisis de rentabilidad basado en costos y precios de venta
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={fetchDailyData}
                disabled={loading}
              >
                {loading ? 'Actualizando...' : 'Actualizar Datos'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;