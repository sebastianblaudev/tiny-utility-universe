
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, DollarSign, TrendingUp, Package, Users, BarChart3 } from 'lucide-react';
import { format, startOfDay, startOfMonth, startOfYear, endOfDay, endOfMonth, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { getSalesByDateRange } from '@/utils/salesUtils';
import { Badge } from '@/components/ui/badge';

interface SalesStats {
  count: number;
  total: number;
  averageTicket: number;
}

const MobileDashboard = () => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<SalesStats>({ count: 0, total: 0, averageTicket: 0 });
  const [monthlyStats, setMonthlyStats] = useState<SalesStats>({ count: 0, total: 0, averageTicket: 0 });
  const [yearlyStats, setYearlyStats] = useState<SalesStats>({ count: 0, total: 0, averageTicket: 0 });
  const [recentSales, setRecentSales] = useState<any[]>([]);

  const calculateStats = (sales: any[]): SalesStats => {
    const count = sales.length;
    const total = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const averageTicket = count > 0 ? total / count : 0;
    return { count, total, averageTicket };
  };

  const fetchSalesData = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const today = new Date();
      
      // Fechas para consultas
      const todayStart = format(startOfDay(today), 'yyyy-MM-dd HH:mm:ss');
      const todayEnd = format(endOfDay(today), 'yyyy-MM-dd HH:mm:ss');
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd HH:mm:ss');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd HH:mm:ss');
      const yearStart = format(startOfYear(today), 'yyyy-MM-dd HH:mm:ss');
      const yearEnd = format(endOfYear(today), 'yyyy-MM-dd HH:mm:ss');

      // Obtener datos de ventas
      const [dailySales, monthlySales, yearlySales] = await Promise.all([
        getSalesByDateRange(tenantId.toString(), todayStart, todayEnd),
        getSalesByDateRange(tenantId.toString(), monthStart, monthEnd),
        getSalesByDateRange(tenantId.toString(), yearStart, yearEnd)
      ]);

      // Calcular estadísticas
      setDailyStats(calculateStats(dailySales));
      setMonthlyStats(calculateStats(monthlySales));
      setYearlyStats(calculateStats(yearlySales));
      
      // Últimas 5 ventas del día
      setRecentSales(dailySales.slice(0, 5));

    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [tenantId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const StatCard = ({ 
    title, 
    icon: Icon, 
    stats, 
    period, 
    color 
  }: { 
    title: string; 
    icon: any; 
    stats: SalesStats; 
    period: string; 
    color: string; 
  }) => (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <div className="text-2xl font-bold">
            {loading ? '...' : formatCurrency(stats.total)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{loading ? '...' : `${stats.count} ventas`}</span>
            <span>{loading ? '...' : `Promedio: ${formatCurrency(stats.averageTicket)}`}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard Móvil</h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="space-y-4 mb-6">
        <StatCard
          title="Ventas de Hoy"
          icon={Calendar}
          stats={dailyStats}
          period="día"
          color="text-blue-500"
        />
        
        <StatCard
          title="Ventas del Mes"
          icon={TrendingUp}
          stats={monthlyStats}
          period="mes"
          color="text-green-500"
        />
        
        <StatCard
          title="Ventas del Año"
          icon={BarChart3}
          stats={yearlyStats}
          period="año"
          color="text-purple-500"
        />
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Ticket Promedio
                </p>
                <p className="text-lg font-bold">
                  {loading ? '...' : formatCurrency(dailyStats.averageTicket)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Ventas Hoy
                </p>
                <p className="text-lg font-bold">
                  {loading ? '...' : dailyStats.count}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ventas recientes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Últimas Ventas de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando ventas...</p>
          ) : recentSales.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay ventas registradas hoy</p>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Venta #{sale.id.substring(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sale.date ? format(new Date(sale.date), 'HH:mm', { locale: es }) : 'Sin hora'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-sm font-bold">
                      {formatCurrency(sale.total || 0)}
                    </Badge>
                    {sale.cashier_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {sale.cashier_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón de actualización */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchSalesData}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar datos'}
        </button>
      </div>
    </div>
  );
};

export default MobileDashboard;
