import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Sidebar from '@/components/Sidebar';
import TenantSecurityAlert from '@/components/TenantSecurityAlert';
import { BarChart3, PieChart as PieChartIcon, Receipt, CreditCard, Banknote, Shuffle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from "@/contexts/AuthContext";
import { PageTitle } from "@/components/ui/page-title";

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface MixedPaymentDetail {
  sale_id: string;
  sale_date: string;
  sale_total: number;
  payment_method: string;
  amount: number;
  cashier_name?: string;
}

interface PaymentMethodSummary {
  payment_method: string;
  total_amount: number;
  transaction_count: number;
}

const EstadisticasMixtos = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("hoy");
  const { tenantId } = useAuth();

  // Function to get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case "hoy":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case "semana":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "mes":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case "año":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = now;
    }

    return { startDate, endDate };
  };

  // Fetch mixed payment details
  const { data: mixedPayments = [], isLoading: isLoadingMixed } = useQuery({
    queryKey: ['mixed-payments', tenantId, selectedPeriod],
    queryFn: async () => {
      if (!tenantId) return [];

      const { startDate, endDate } = getDateRange();

      const { data, error } = await supabase
        .from('sale_payment_methods')
        .select(`
          sale_id,
          payment_method,
          amount,
          sales!inner(
            id,
            date,
            total,
            cashier_name
          )
        `)
        .eq('tenant_id', tenantId)
        .gte('sales.date', startDate.toISOString())
        .lte('sales.date', endDate.toISOString())
        .order('sales.date', { ascending: false });

      if (error) {
        console.error('Error fetching mixed payments:', error);
        return [];
      }

      return data.map((item: any) => ({
        sale_id: item.sale_id,
        sale_date: item.sales.date,
        sale_total: item.sales.total,
        payment_method: item.payment_method,
        amount: item.amount,
        cashier_name: item.sales.cashier_name
      })) as MixedPaymentDetail[];
    },
    enabled: !!tenantId
  });

  // Process data for charts and summaries
  const processedData = React.useMemo(() => {
    if (!mixedPayments.length) return { summary: [], salesWithMixed: [], chartData: [] };

    // Group by sale to identify mixed payment sales
    const salesGrouped = mixedPayments.reduce((acc, payment) => {
      if (!acc[payment.sale_id]) {
        acc[payment.sale_id] = {
          sale_id: payment.sale_id,
          sale_date: payment.sale_date,
          sale_total: payment.sale_total,
          cashier_name: payment.cashier_name,
          payments: []
        };
      }
      acc[payment.sale_id].payments.push({
        method: payment.payment_method,
        amount: payment.amount
      });
      return acc;
    }, {} as any);

    // Filter only sales with multiple payment methods (mixed payments)
    const salesWithMixed = Object.values(salesGrouped).filter((sale: any) => sale.payments.length > 1);

    // Create summary by payment method
    const summary = mixedPayments.reduce((acc, payment) => {
      const existing = acc.find(item => item.payment_method === payment.payment_method);
      if (existing) {
        existing.total_amount += payment.amount;
        existing.transaction_count += 1;
      } else {
        acc.push({
          payment_method: payment.payment_method,
          total_amount: payment.amount,
          transaction_count: 1
        });
      }
      return acc;
    }, [] as PaymentMethodSummary[]);

    // Prepare chart data
    const chartData = summary.map(item => ({
      name: item.payment_method === 'cash' ? 'Efectivo' : 
            item.payment_method === 'card' ? 'Tarjeta' : 
            item.payment_method === 'transfer' ? 'Transferencia' : item.payment_method,
      value: item.total_amount,
      count: item.transaction_count
    }));

    return { summary, salesWithMixed, chartData };
  }, [mixedPayments]);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      default: return method;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'transfer': return <Shuffle className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <TenantSecurityAlert />
        
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <PageTitle 
              title="Estadísticas de Pagos Mixtos" 
              description="Análisis detallado de ventas con múltiples métodos de pago"
            />
          </div>

          {/* Period Selector */}
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hoy">Hoy</TabsTrigger>
              <TabsTrigger value="semana">Semana</TabsTrigger>
              <TabsTrigger value="mes">Mes</TabsTrigger>
              <TabsTrigger value="año">Año</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedPeriod} className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventas con Pagos Mixtos</CardTitle>
                    <Shuffle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{processedData.salesWithMixed.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Ventas que utilizaron múltiples métodos de pago
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total en Pagos Mixtos</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(processedData.summary.reduce((sum, item) => sum + item.total_amount, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Suma de todos los métodos de pago mixtos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transacciones Mixtas</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {processedData.summary.reduce((sum, item) => sum + item.transaction_count, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total de transacciones individuales
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Distribución por Método de Pago
                    </CardTitle>
                    <CardDescription>
                      Montos totales por método de pago en ventas mixtas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={processedData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <Tooltip 
                          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Monto']}
                          labelFormatter={(label) => `Método: ${label}`}
                        />
                        <Bar dataKey="value" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Proporción de Métodos de Pago
                    </CardTitle>
                    <CardDescription>
                      Distribución porcentual de los métodos de pago mixtos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={processedData.chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {processedData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Monto']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Ventas con Pagos Mixtos</CardTitle>
                  <CardDescription>
                    Lista completa de todas las ventas que utilizaron múltiples métodos de pago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingMixed ? (
                    <div className="text-center py-4">Cargando datos...</div>
                  ) : processedData.salesWithMixed.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No se encontraron ventas con pagos mixtos en el período seleccionado
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>ID Venta</TableHead>
                          <TableHead>Total Venta</TableHead>
                          <TableHead>Métodos de Pago</TableHead>
                          <TableHead>Cajero</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedData.salesWithMixed.map((sale: any) => (
                          <TableRow key={sale.sale_id}>
                            <TableCell>
                              {new Date(sale.sale_date).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {sale.sale_id.slice(-8)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(sale.sale_total)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {sale.payments.map((payment: any, index: number) => (
                                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                                    {getPaymentMethodIcon(payment.method)}
                                    {getPaymentMethodLabel(payment.method)}: {formatCurrency(payment.amount)}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {sale.cashier_name || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumen por Método de Pago</CardTitle>
                  <CardDescription>
                    Totales consolidados de cada método de pago en ventas mixtas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método de Pago</TableHead>
                        <TableHead>Cantidad de Transacciones</TableHead>
                        <TableHead>Monto Total</TableHead>
                        <TableHead>Promedio por Transacción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.summary.map((item) => (
                        <TableRow key={item.payment_method}>
                          <TableCell className="flex items-center gap-2">
                            {getPaymentMethodIcon(item.payment_method)}
                            {getPaymentMethodLabel(item.payment_method)}
                          </TableCell>
                          <TableCell>{item.transaction_count}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(item.total_amount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(item.total_amount / item.transaction_count)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasMixtos;