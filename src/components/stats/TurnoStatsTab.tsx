
import React, { useState, useEffect } from 'react';
import { getTurnoById } from '@/utils/turnosUtils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowDown, ArrowUp, Coins, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormat';
import { supabase } from "@/integrations/supabase/client";

interface TurnoStatsTabProps {
  turnoId: string;
}

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
};

const StatCard = ({ title, value, icon, description, trend }: StatCardProps) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <div className="flex items-center pt-2">
          {trend === 'up' && <ArrowUp className="mr-1 h-4 w-4 text-emerald-500" />}
          {trend === 'down' && <ArrowDown className="mr-1 h-4 w-4 text-red-500" />}
          <p className={`text-xs ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
            {description}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Define the type for chart data
interface ChartDataItem {
  name: string;
  value: number;
  displayName: string;
}

// Define the type for turno stats
interface TurnoStats {
  montoInicial: number;
  totalIngresos: number;
  totalEgresos: number;
  balanceFinal: number;
  cajero: string;
  estado: string;
  fechaApertura: string;
  fechaCierre: string;
  ventasPorMetodo: Record<string, { total: number; count: number }>;
}

const TurnoStatsTab: React.FC<TurnoStatsTabProps> = ({ turnoId }) => {
  const [stats, setStats] = useState<TurnoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);

  // Helper function to translate payment methods
  const translatePaymentMethod = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'Efectivo';
      case 'efectivo': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'tarjeta': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'transferencia': return 'Transferencia';
      case 'mixed': return 'Pago Mixto';
      default: return method;
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      if (!turnoId) {
        setLoading(false);
        return;
      }

      try {
        console.log('Loading turno stats for turno ID:', turnoId);
        
        // Get turno details
        const turno = await getTurnoById(turnoId);
        if (!turno) {
          console.log('No turno found for ID:', turnoId);
          setLoading(false);
          return;
        }

        console.log('Turno found:', turno);

        // Use the detailed function that properly distributes mixed payments
        const { data: paymentMethodData, error: paymentError } = await supabase
          .rpc('get_turno_sales_by_payment_method_detailed', {
            turno_id_param: turnoId
          });

        if (paymentError) {
          console.error('Error fetching payment method data:', paymentError);
          setLoading(false);
          return;
        }

        console.log('Payment method data from DB (with mixed payments distributed):', paymentMethodData);

        // Process payment method data - this should now include distributed mixed payments
        const ventasPorMetodo: Record<string, { total: number; count: number }> = {};
        let totalIngresos = 0;

        if (paymentMethodData && paymentMethodData.length > 0) {
          paymentMethodData.forEach((item: any) => {
            const method = item.payment_method || 'cash';
            const amount = Number(item.total);
            const count = Number(item.count);
            ventasPorMetodo[method] = { total: amount, count: count };
            totalIngresos += amount;
          });
        }

        console.log('Processed payment methods (mixed payments now distributed):', ventasPorMetodo);
        console.log('Total ingresos from distributed sales:', totalIngresos);

        // Get other transactions (ingresos/egresos that are not sales)
        const { data: otherTransactions, error: transError } = await supabase
          .from('turno_transacciones')
          .select('*')
          .eq('turno_id', turnoId)
          .neq('tipo', 'venta');

        let totalEgresos = 0;
        let otherIngresos = 0;

        if (otherTransactions) {
          otherTransactions.forEach(trans => {
            const monto = Number(trans.monto);
            if (trans.tipo === 'egreso') {
              totalEgresos += monto;
            } else if (trans.tipo === 'ingreso') {
              otherIngresos += monto;
            }
          });
        }

        console.log('Other transactions - Egresos:', totalEgresos, 'Other ingresos:', otherIngresos);

        // Add other ingresos to total
        totalIngresos += otherIngresos;

        const turnoStats: TurnoStats = {
          montoInicial: Number(turno.monto_inicial) || 0,
          totalIngresos,
          totalEgresos,
          balanceFinal: (Number(turno.monto_inicial) || 0) + totalIngresos - totalEgresos,
          cajero: turno.cajero_nombre,
          estado: turno.estado,
          fechaApertura: turno.fecha_apertura,
          fechaCierre: turno.fecha_cierre || '',
          ventasPorMetodo
        };

        console.log('Final turno stats with distributed mixed payments:', turnoStats);
        setStats(turnoStats);

        // Prepare chart data for payment methods
        if (ventasPorMetodo && Object.keys(ventasPorMetodo).length > 0) {
          const data = Object.entries(ventasPorMetodo).map(([name, data]) => ({
            name,
            value: Number(data.total),
            displayName: translatePaymentMethod(name),
          }));
          setChartData(data);
          console.log('Chart data prepared with distributed mixed payments:', data);
        } else {
          console.log('No payment method data for chart');
          setChartData([]);
        }
      } catch (error) {
        console.error('Error loading turno stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [turnoId]);

  if (loading) {
    return <div className="p-4 text-center">Cargando estadísticas del turno...</div>;
  }

  if (!stats) {
    return <div className="p-4 text-center">No se encontraron estadísticas para este turno.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monto Inicial"
          value={formatCurrency(stats.montoInicial)}
          icon={<Coins className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Ingresos"
          value={formatCurrency(stats.totalIngresos)}
          icon={<ArrowUp className="h-4 w-4 text-emerald-500" />}
          description="Incluye pagos mixtos distribuidos"
        />
        <StatCard
          title="Total Egresos"
          value={formatCurrency(stats.totalEgresos)}
          icon={<ArrowDown className="h-4 w-4 text-red-500" />}
        />
        <StatCard
          title="Balance Final"
          value={formatCurrency(stats.balanceFinal)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventas por Método de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="space-y-4">
              {/* Chart */}
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ displayName, percent }) => `${displayName} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(Number(value)), 'Monto']} 
                      labelFormatter={(label) => translatePaymentMethod(label)}
                    />
                    <Legend 
                      formatter={(value) => translatePaymentMethod(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Details Table */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Detalle por Método (Pagos Mixtos Distribuidos)</h4>
                {Object.entries(stats.ventasPorMetodo).map(([method, data]) => (
                  <div key={method} className="flex justify-between items-center p-3 border border-border rounded-lg bg-card">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{translatePaymentMethod(method)}</span>
                      <span className="text-xs text-muted-foreground">
                        {data.count} transacción{data.count !== 1 ? 'es' : ''}
                      </span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(data.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No hay datos de ventas para mostrar
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del Turno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Cajero:</span>
              <span className="font-medium">{stats.cajero}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Estado:</span>
              <span className="font-medium">{stats.estado}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Fecha Apertura:</span>
              <span className="font-medium">{new Date(stats.fechaApertura).toLocaleString()}</span>
            </div>
            {stats.fechaCierre && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Fecha Cierre:</span>
                <span className="font-medium">{new Date(stats.fechaCierre).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TurnoStatsTab;
