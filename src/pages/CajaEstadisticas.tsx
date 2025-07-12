
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCashRegisterStatistics } from '@/utils/cashRegisterUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TurnoStats {
  id: string;
  fecha_apertura: string;
  fecha_cierre: string;
  estado: string;
  monto_inicial: number;
  nombre_cajero: string;
  salesStats: Record<string, { total: number; count: number }>;
  cashiers: Record<string, number>;
  totalSales: number;
  totalCount: number;
}

interface StatsResult {
  totalTurnos?: number;
  totalSales?: number;
  salesByPaymentMethod?: Record<string, number>;
  salesByCashier?: any[];
}

const CajaEstadisticas = () => {
  const [activeTab, setActiveTab] = useState('day');
  const [turnoStats, setTurnoStats] = useState<TurnoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const stats = await getCashRegisterStatistics(activeTab);
        
        if (Array.isArray(stats)) {
          setTurnoStats(stats as TurnoStats[]);
        } else {
          console.error("Expected array of stats, got:", stats);
          setTurnoStats([]);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setTurnoStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [activeTab]);

  useEffect(() => {
    // Prepare chart data
    if (turnoStats.length === 0) return;

    // Aggregate payment methods across all turnos
    const paymentMethodTotals: Record<string, number> = {};
    const cashierTotals: Record<string, number> = {};

    turnoStats.forEach(turno => {
      // Payment methods
      Object.entries(turno.salesStats || {}).forEach(([method, data]) => {
        if (!paymentMethodTotals[method]) paymentMethodTotals[method] = 0;
        paymentMethodTotals[method] += data.total;
      });

      // Cashiers
      Object.entries(turno.cashiers || {}).forEach(([cashier, count]) => {
        if (!cashierTotals[cashier]) cashierTotals[cashier] = 0;
        cashierTotals[cashier] += count;
      });
    });

    // Convert to array for chart
    const paymentMethodData = Object.entries(paymentMethodTotals).map(([name, value]) => ({
      name,
      value
    }));

    const cashierData = Object.entries(cashierTotals).map(([name, value]) => ({
      name,
      value
    }));

    setChartData([{ paymentMethods: paymentMethodData, cashiers: cashierData }]);
  }, [turnoStats]);

  // COLORS for the charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF', '#FF6B6B'];

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Estadísticas de Caja</h2>
        <Card>
          <CardContent className="py-10 text-center">
            Cargando estadísticas...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Estadísticas de Caja</h2>

      <Tabs defaultValue="day" className="w-full mb-8" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="day">Hoy</TabsTrigger>
          <TabsTrigger value="week">Esta Semana</TabsTrigger>
          <TabsTrigger value="month">Este Mes</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="space-y-4">
          {renderStatsContent()}
        </TabsContent>
        
        <TabsContent value="week" className="space-y-4">
          {renderStatsContent()}
        </TabsContent>
        
        <TabsContent value="month" className="space-y-4">
          {renderStatsContent()}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderStatsContent() {
    if (turnoStats.length === 0) {
      return (
        <Card>
          <CardContent className="py-10 text-center">
            No hay datos para el periodo seleccionado.
          </CardContent>
        </Card>
      );
    }

    const totalVentas = turnoStats.reduce((sum, turno) => sum + (turno.totalSales || 0), 0);
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Turnos</p>
                  <p className="text-2xl font-bold">{turnoStats.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Ventas</p>
                  <p className="text-2xl font-bold">${totalVentas.toLocaleString('es-CL')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {chartData.length > 0 && chartData[0].paymentMethods && (
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Método de Pago</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData[0].paymentMethods}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData[0].paymentMethods.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-CL')}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalle de Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cajero</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total Ventas</TableHead>
                    <TableHead>Métodos de Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turnoStats.map((turno, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {format(new Date(turno.fecha_apertura), 'dd/MM/yyyy HH:mm', { locale: es })}
                        {turno.fecha_cierre && (
                          <div className="text-xs text-gray-500">
                            hasta {format(new Date(turno.fecha_cierre), 'HH:mm')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{turno.nombre_cajero}</TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            turno.estado === 'cerrado'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {turno.estado}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${turno.totalSales?.toLocaleString('es-CL') || '0'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {Object.entries(turno.salesStats || {}).map(([method, data], i) => (
                            <div key={i} className="flex justify-between text-xs mb-1">
                              <span>{method}:</span>
                              <span>${data.total.toLocaleString('es-CL')}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }
};

export default CajaEstadisticas;
