
import React, { useState, useEffect } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { useBarber } from '../contexts/BarberContext';
import { DailyFinancialReport, WeeklyFinancialReport } from '../types/financial';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, isSaturday, endOfWeek, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Download, DollarSign, Scissors, FileText, TrendingUp, BarChart4 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const COLORS = ['#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4', '#3b82f6', '#10b981', '#a855f7'];

const FinancialReportsPage = () => {
  const { 
    generateDailyReport,
    generateWeeklyReport,
    exportReportToTxt
  } = useFinancial();
  
  const { barbers } = useBarber();
  const { toast } = useToast();
  
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [report, setReport] = useState<DailyFinancialReport | WeeklyFinancialReport | null>(null);
  
  // Generate report when date or type changes
  useEffect(() => {
    if (reportType === 'daily') {
      const dailyReport = generateDailyReport(selectedDate);
      setReport(dailyReport);
    } else {
      // For weekly reports, we want the end of the week (Saturday)
      let reportDate = selectedDate;
      if (!isSaturday(selectedDate)) {
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
        reportDate = weekEnd;
      }
      
      const weeklyReport = generateWeeklyReport(reportDate);
      setReport(weeklyReport);
    }
  }, [reportType, selectedDate, generateDailyReport, generateWeeklyReport]);
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  const handleExportReport = () => {
    if (report) {
      exportReportToTxt(report, reportType);
    } else {
      toast({
        title: "Error de exportación",
        description: "No hay un informe para exportar",
        variant: "destructive"
      });
    }
  };
  
  const formattedDate = () => {
    if (reportType === 'daily') {
      return format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } else {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
      return `${format(weekStart, "d 'de' MMMM", { locale: es })} - ${format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
    }
  };
  
  // Prepare chart data for barber commissions
  const barberCommissionsData = report?.barberSummaries.map(summary => ({
    name: summary.barberName,
    comisión: summary.commissionsAmount,
    ventas: summary.totalAmount,
    servicios: summary.serviceCount,
    adelantos: summary.advancesAmount,
    pendiente: summary.pendingPayment
  })) || [];
  
  // Prepare data for payment method breakdown pie chart
  // (This would need to be implemented with actual data from the context)
  const paymentMethodData = [
    { name: 'Efectivo', value: 5000 },
    { name: 'Tarjeta', value: 3000 },
    { name: 'Transferencia', value: 2000 },
  ];
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Informes Financieros</h1>
        <Button onClick={handleExportReport} disabled={!report}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Informe
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full md:w-auto">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <Tabs defaultValue={reportType} onValueChange={(value) => setReportType(value as 'daily' | 'weekly')}>
                <TabsList>
                  <TabsTrigger value="daily">Diario</TabsTrigger>
                  <TabsTrigger value="weekly">Semanal</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? formattedDate()
                      : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                  <div className="text-2xl font-bold">${report.totalSales.toLocaleString()}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ventas {reportType === 'daily' ? 'del día' : 'de la semana'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Comisiones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Scissors className="mr-2 h-4 w-4 text-blue-500" />
                  <div className="text-2xl font-bold">${report.totalCommissions.toLocaleString()}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((report.totalCommissions / (report.totalSales || 1)) * 100).toFixed(1)}% de las ventas
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gastos Operacionales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-red-500" />
                  <div className="text-2xl font-bold">${report.totalExpenses.toLocaleString()}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((report.totalExpenses / (report.totalSales || 1)) * 100).toFixed(1)}% de las ventas
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-purple-500" />
                  <div className="text-2xl font-bold">${report.netProfit.toLocaleString()}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((report.netProfit / (report.totalSales || 1)) * 100).toFixed(1)}% de margen de ganancia
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="barbers">
            <TabsList>
              <TabsTrigger value="barbers">Barberos</TabsTrigger>
              <TabsTrigger value="details">Detalles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="barbers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento por Barbero</CardTitle>
                  <CardDescription>
                    {reportType === 'daily' 
                      ? 'Comisiones y servicios de cada barbero para el día seleccionado' 
                      : 'Comisiones y servicios de cada barbero para la semana seleccionada'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barberCommissionsData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="comisión" fill="#8b5cf6" />
                        <Bar dataKey="adelantos" fill="#f43f5e" />
                        <Bar dataKey="pendiente" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Barberos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barbero</TableHead>
                        <TableHead>Servicios</TableHead>
                        <TableHead>Ventas</TableHead>
                        <TableHead>Comisión (%)</TableHead>
                        <TableHead>Comisión ($)</TableHead>
                        <TableHead>Adelantos</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.barberSummaries.map((summary) => (
                        <TableRow key={summary.barberId}>
                          <TableCell className="font-medium">{summary.barberName}</TableCell>
                          <TableCell>{summary.serviceCount}</TableCell>
                          <TableCell>${summary.totalAmount.toLocaleString()}</TableCell>
                          <TableCell>{summary.commissionsPercentage.toFixed(1)}%</TableCell>
                          <TableCell>${summary.commissionsAmount.toLocaleString()}</TableCell>
                          <TableCell>${summary.advancesAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <span className={summary.pendingPayment >= 0 ? "text-green-500" : "text-red-500"}>
                              ${Math.abs(summary.pendingPayment).toLocaleString()}
                              {summary.pendingPayment >= 0 ? " a favor" : " en contra"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Servicios y Ventas</CardTitle>
                    <CardDescription>
                      Total de servicios y ventas por barbero
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={barberCommissionsData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="servicios" fill="#8884d8" name="Servicios" />
                          <Bar yAxisId="right" dataKey="ventas" fill="#82ca9d" name="Ventas ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Métodos de Pago</CardTitle>
                    <CardDescription>
                      Distribución de las ventas por método de pago
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentMethodData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {paymentMethodData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Resumen General</CardTitle>
                  <CardDescription>
                    {reportType === 'daily' 
                      ? `Informe financiero del ${format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}` 
                      : `Informe financiero semanal: ${format(
                          'startDate' in report ? report.startDate : selectedDate, 
                          "d 'de' MMMM", 
                          { locale: es }
                        )} - ${format(
                          'endDate' in report ? report.endDate : selectedDate, 
                          "d 'de' MMMM 'de' yyyy", 
                          { locale: es }
                        )}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Ventas Totales</p>
                        <p className="text-2xl font-bold">${report.totalSales.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Comisiones Totales</p>
                        <p className="text-2xl font-bold">${report.totalCommissions.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Gastos Operacionales</p>
                        <p className="text-2xl font-bold">${report.totalExpenses.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Ganancia Neta</p>
                        <p className="text-2xl font-bold">${report.netProfit.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold">Indicadores Clave</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                          <BarChart4 className="h-10 w-10 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Margen de Ganancia</p>
                            <p className="text-2xl font-bold">
                              {((report.netProfit / (report.totalSales || 1)) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                          <Scissors className="h-10 w-10 text-purple-500" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Ratio de Comisiones</p>
                            <p className="text-2xl font-bold">
                              {((report.totalCommissions / (report.totalSales || 1)) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                          <FileText className="h-10 w-10 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Gastos vs Ventas</p>
                            <p className="text-2xl font-bold">
                              {((report.totalExpenses / (report.totalSales || 1)) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default FinancialReportsPage;
