
import React, { useState, useEffect } from 'react';
import { getTurnoStats } from '@/utils/cashRegisterUtils';
import { getTurnoById, getTurnoTransacciones } from '@/utils/turnosUtils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowDown, ArrowUp, Coins, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormat';

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
  ventasPorMetodo: Record<string, number>;
}

const TurnoStatsTab: React.FC<TurnoStatsTabProps> = ({ turnoId }) => {
  const [stats, setStats] = useState<TurnoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      if (!turnoId) {
        setLoading(false);
        return;
      }

      try {
        // Get turno details
        const turno = await getTurnoById(turnoId);
        if (!turno) {
          setLoading(false);
          return;
        }

        // Get turno transactions
        const transactions = await getTurnoTransacciones(turnoId);
        
        // Calculate stats
        let totalIngresos = 0;
        let totalEgresos = 0;
        const ventasPorMetodo: Record<string, number> = {};

        transactions.forEach(trans => {
          const monto = Number(trans.monto);
          const metodoPago = trans.metodo_pago || 'efectivo';
          
          if (trans.tipo === 'ingreso' || trans.tipo === 'venta') {
            totalIngresos += monto;
            if (trans.tipo === 'venta') {
              ventasPorMetodo[metodoPago] = (ventasPorMetodo[metodoPago] || 0) + monto;
            }
          } else if (trans.tipo === 'egreso') {
            totalEgresos += monto;
          }
        });

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

        setStats(turnoStats);

        // Prepare chart data for payment methods
        if (ventasPorMetodo && Object.keys(ventasPorMetodo).length > 0) {
          const data = Object.entries(ventasPorMetodo).map(([name, value]) => ({
            name,
            value: Number(value),
          }));
          setChartData(data);
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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
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
