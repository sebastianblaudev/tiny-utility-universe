import React, { useState, useEffect } from 'react';
import { useBarber } from '../contexts/BarberContext';
import { useAuth } from '../contexts/AuthContext';
import { format, isSameDay, startOfWeek, endOfWeek, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  PieChart,
  Pie,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  Calendar as CalendarIcon,
  Download,
  DollarSign,
  UserRound,
  Scissors,
  Package,
  CreditCard,
  Wallet,
  Receipt,
  HeartHandshake,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethod, BarberSalesReport, ProductSalesReport, ServiceSalesReport, Sale, SplitPayment } from '../types';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const ReportsPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reportType, setReportType] = useState("daily");
  const { sales, barbers, cashAdvances, getCashAdvancesWithBarberNames } = useBarber();
  const { toast } = useToast();
  
  const cashAdvancesWithNames = getCashAdvancesWithBarberNames();
  
  useEffect(() => {
    console.log("Current barbers:", barbers);
    console.log("Current sales:", sales);
    console.log("Current cash advances:", cashAdvances);
  }, [barbers, sales, cashAdvances]);
  
  const formattedDate = date ? format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : "";
  
  const filteredSales = sales.filter((sale) => {
    if (!date) return false;
    
    const saleDate = new Date(sale.date);
    
    if (reportType === "daily") {
      return isSameDay(saleDate, date);
    } else if (reportType === "weekly") {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      return isWithinInterval(saleDate, { start: weekStart, end: weekEnd });
    } else if (reportType === "monthly") {
      return (
        saleDate.getMonth() === date.getMonth() &&
        saleDate.getFullYear() === date.getFullYear()
      );
    }
    return false;
  });
  
  const filteredCashAdvances = cashAdvancesWithNames.filter((advance) => {
    if (!date) return false;
    
    const advanceDate = new Date(advance.date);
    
    if (reportType === "daily") {
      return isSameDay(advanceDate, date);
    } else if (reportType === "weekly") {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      return isWithinInterval(advanceDate, { start: weekStart, end: weekEnd });
    } else if (reportType === "monthly") {
      return (
        advanceDate.getMonth() === date.getMonth() &&
        advanceDate.getFullYear() === advanceDate.getFullYear()
      );
    }
    return false;
  });
  
  useEffect(() => {
    console.log("Filtered sales:", filteredSales);
    console.log("Filtered cash advances:", filteredCashAdvances);
  }, [filteredSales, filteredCashAdvances]);
  
  const totalSales = filteredSales.reduce((total, sale) => total + sale.total, 0);
  const totalServices = filteredSales.reduce((total, sale) => {
    return total + sale.items.filter(item => item.type === 'service').reduce((sum, item) => sum + item.quantity, 0);
  }, 0);
  const totalProducts = filteredSales.reduce((total, sale) => {
    return total + sale.items.filter(item => item.type === 'product').reduce((sum, item) => sum + item.quantity, 0);
  }, 0);
  
  const totalTips = filteredSales.reduce((total, sale) => {
    return total + (sale.tip ? sale.tip.amount : 0);
  }, 0);
  
  const totalPendingAdvances = filteredCashAdvances
    .filter(advance => advance.status === "pending" || !advance.status)
    .reduce((total, advance) => total + advance.amount, 0);
    
  const totalSettledAdvances = filteredCashAdvances
    .filter(advance => advance.status === "settled")
    .reduce((total, advance) => total + advance.amount, 0);
  
  const getPaymentAmounts = (sale: Sale) => {
    let cashAmount = 0;
    let cardAmount = 0;
    let transferAmount = 0;
    
    if (sale.paymentMethod === PaymentMethod.MIXED && sale.splitPayments) {
      sale.splitPayments.forEach(split => {
        if (split.method === PaymentMethod.CASH) {
          cashAmount += split.amount;
        } else if (split.method === PaymentMethod.CARD) {
          cardAmount += split.amount;
        } else if (split.method === PaymentMethod.TRANSFER) {
          transferAmount += split.amount;
        }
      });
    } else {
      if (sale.paymentMethod === PaymentMethod.CASH) {
        cashAmount = sale.total;
      } else if (sale.paymentMethod === PaymentMethod.CARD) {
        cardAmount = sale.total;
      } else if (sale.paymentMethod === PaymentMethod.TRANSFER) {
        transferAmount = sale.total;
      }
    }
    
    return { cashAmount, cardAmount, transferAmount };
  };
  
  const getTipInfo = (sale: Sale) => {
    if (!sale.tip) return { hasTip: false, amount: 0, method: null };
    
    return {
      hasTip: true,
      amount: sale.tip.amount,
      method: sale.tip.paymentMethod
    };
  };
  
  const salesByDateMap = new Map();
  
  if (reportType === "daily" && date) {
    for (let i = 8; i <= 20; i++) {
      const hour = i < 10 ? `0${i}:00` : `${i}:00`;
      salesByDateMap.set(hour, {
        date: hour,
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        propina: 0
      });
    }
    
    filteredSales.forEach(sale => {
      const saleHour = format(new Date(sale.date), "HH:00");
      if (salesByDateMap.has(saleHour)) {
        const current = salesByDateMap.get(saleHour);
        const { cashAmount, cardAmount, transferAmount } = getPaymentAmounts(sale);
        const tipInfo = getTipInfo(sale);
        
        current.efectivo += cashAmount;
        current.tarjeta += cardAmount;
        current.transferencia += transferAmount;
        current.propina += tipInfo.amount;
        
        salesByDateMap.set(saleHour, current);
      }
    });
  } else if (reportType === "weekly" && date) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    days.forEach(day => {
      const dayStr = format(day, "EEE", { locale: es });
      salesByDateMap.set(dayStr, {
        date: dayStr,
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        propina: 0
      });
    });
    
    filteredSales.forEach(sale => {
      const saleDay = format(new Date(sale.date), "EEE", { locale: es });
      if (salesByDateMap.has(saleDay)) {
        const current = salesByDateMap.get(saleDay);
        const { cashAmount, cardAmount, transferAmount } = getPaymentAmounts(sale);
        const tipInfo = getTipInfo(sale);
        
        current.efectivo += cashAmount;
        current.tarjeta += cardAmount;
        current.transferencia += transferAmount;
        current.propina += tipInfo.amount;
        
        salesByDateMap.set(saleDay, current);
      }
    });
  } else if (reportType === "monthly" && date) {
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i += 7) {
      const weekLabel = `${i}-${Math.min(i + 6, daysInMonth)}`;
      salesByDateMap.set(weekLabel, {
        date: weekLabel,
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        propina: 0
      });
    }
    
    filteredSales.forEach(sale => {
      const saleDay = new Date(sale.date).getDate();
      const weekIndex = Math.floor((saleDay - 1) / 7) * 7 + 1;
      const weekEnd = Math.min(weekIndex + 6, daysInMonth);
      const weekLabel = `${weekIndex}-${weekEnd}`;
      
      if (salesByDateMap.has(weekLabel)) {
        const current = salesByDateMap.get(weekLabel);
        const { cashAmount, cardAmount, transferAmount } = getPaymentAmounts(sale);
        const tipInfo = getTipInfo(sale);
        
        current.efectivo += cashAmount;
        current.tarjeta += cardAmount;
        current.transferencia += transferAmount;
        current.propina += tipInfo.amount;
        
        salesByDateMap.set(weekLabel, current);
      }
    });
  }
  
  const salesData = Array.from(salesByDateMap.values());
  
  const tipsByMethodMap = new Map();
  tipsByMethodMap.set(PaymentMethod.CASH, 0);
  tipsByMethodMap.set(PaymentMethod.CARD, 0);
  tipsByMethodMap.set(PaymentMethod.TRANSFER, 0);
  
  filteredSales.forEach(sale => {
    if (sale.tip) {
      const currentAmount = tipsByMethodMap.get(sale.tip.paymentMethod) || 0;
      tipsByMethodMap.set(sale.tip.paymentMethod, currentAmount + sale.tip.amount);
    }
  });
  
  const tipsByMethod = {
    efectivo: tipsByMethodMap.get(PaymentMethod.CASH) || 0,
    tarjeta: tipsByMethodMap.get(PaymentMethod.CARD) || 0,
    transferencia: tipsByMethodMap.get(PaymentMethod.TRANSFER) || 0
  };
  
  const serviceTypesMap = new Map();
  
  filteredSales.forEach(sale => {
    sale.items.filter(item => item.type === 'service').forEach(item => {
      const serviceName = item.name;
      const currentCount = serviceTypesMap.get(serviceName) || 0;
      serviceTypesMap.set(serviceName, currentCount + item.quantity);
    });
  });
  
  const servicesPieData = Array.from(serviceTypesMap.entries()).map(([name, value], index) => {
    const colors = ["#8b5cf6", "#ec4899", "#f43f5e", "#06b6d4", "#3b82f6", "#10b981", "#a855f7"];
    return {
      name,
      value,
      color: colors[index % colors.length]
    };
  });
  
  const getBarberName = (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    if (barber && barber.name) {
      return barber.name;
    }
    
    return `Barbero ${barberId}`;
  };
  
  const barberData = barbers
    .map(barber => {
      const barberSales = filteredSales.filter(
        sale => sale.barberId === barber.id || 
        sale.items.some(item => item.barberId === barber.id)
      );
      
      const totalCount = barberSales.reduce((total, sale) => 
        total + sale.items.filter(item => item.type === 'service').reduce((sum, item) => sum + item.quantity, 0), 0);
      const totalAmount = barberSales.reduce((total, sale) => total + sale.total, 0);
      const totalBarberTips = barberSales.reduce((total, sale) => total + (sale.tip ? sale.tip.amount : 0), 0);
      
      return {
        id: barber.id,
        name: barber.name || `Barbero ${barber.id}`,
        ventas: totalCount,
        monto: totalAmount,
        propinas: totalBarberTips
      };
    })
    .filter(barber => barber.ventas > 0 || filteredSales.some(
      sale => sale.barberId === barber.id || 
      sale.items.some(item => item.barberId === barber.id)
    ));
  
  const unknownBarberIds = new Set(
    filteredSales
      .filter(sale => !barbers.some(b => 
        b.id === sale.barberId || 
        sale.items.some(item => item.barberId === b.id)
      ))
      .map(sale => sale.barberId)
  );
  
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      if (item.barberId && !barbers.some(b => b.id === item.barberId)) {
        unknownBarberIds.add(item.barberId);
      }
    });
  });
  
  unknownBarberIds.forEach(barberId => {
    if (!barberId) return;
    
    const barberSales = filteredSales.filter(sale => 
      sale.barberId === barberId || 
      sale.items.some(item => item.barberId === barberId)
    );
    
    const totalCount = barberSales.reduce((total, sale) => 
      total + sale.items.filter(item => item.type === 'service').reduce((sum, item) => sum + item.quantity, 0), 0);
    const totalAmount = barberSales.reduce((total, sale) => total + sale.total, 0);
    const totalBarberTips = barberSales.reduce((total, sale) => total + (sale.tip ? sale.tip.amount : 0), 0);
    
    barberData.push({
      id: barberId,
      name: getBarberName(barberId),
      ventas: totalCount,
      monto: totalAmount,
      propinas: totalBarberTips
    });
  });
  
  useEffect(() => {
    console.log("Barber data:", barberData);
  }, [barberData]);
  
  const branchSalesMap = new Map();
  
  filteredSales.forEach(sale => {
    const branchId = "1"; // Single branch operation
    if (!branchSalesMap.has(branchId)) {
      branchSalesMap.set(branchId, {
        branchId,
        ventas: 0,
        monto: 0,
        propinas: 0
      });
    }
    
    const current = branchSalesMap.get(branchId);
    current.ventas += sale.items.length;
    current.monto += sale.total;
    current.propinas += sale.tip ? sale.tip.amount : 0;
    branchSalesMap.set(branchId, current);
  });
  
  const branchData = Array.from(branchSalesMap.values()).map(branch => {
    const branchInfo = "Sucursal Principal"; // Single branch name
    return {
      name: branchInfo,
      ventas: branch.ventas,
      monto: branch.monto,
      propinas: branch.propinas
    };
  });
  
  const cashTotal = filteredSales.reduce((total, sale) => {
    const { cashAmount } = getPaymentAmounts(sale);
    return total + cashAmount;
  }, 0);
  
  const cardTotal = filteredSales.reduce((total, sale) => {
    const { cardAmount } = getPaymentAmounts(sale);
    return total + cardAmount;
  }, 0);
  
  const transferTotal = filteredSales.reduce((total, sale) => {
    const { transferAmount } = getPaymentAmounts(sale);
    return total + transferAmount;
  }, 0);
  
  const advancesByDateMap = new Map();
  
  if (reportType === "daily" && date) {
    for (let i = 8; i <= 20; i++) {
      const hour = i < 10 ? `0${i}:00` : `${i}:00`;
      advancesByDateMap.set(hour, {
        date: hour,
        pendientes: 0,
        liquidados: 0
      });
    }
  } else if (reportType === "weekly" && date) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    days.forEach(day => {
      const dayStr = format(day, "EEE", { locale: es });
      advancesByDateMap.set(dayStr, {
        date: dayStr,
        pendientes: 0,
        liquidados: 0
      });
    });
  } else if (reportType === "monthly" && date) {
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i += 7) {
      const weekLabel = `${i}-${Math.min(i + 6, daysInMonth)}`;
      advancesByDateMap.set(weekLabel, {
        date: weekLabel,
        pendientes: 0,
        liquidados: 0
      });
    }
  }
  
  const advancesChartData = Array.from(advancesByDateMap.values());
  
  const barberAdvancesMap = new Map();
  
  filteredCashAdvances.forEach(advance => {
    if (!barberAdvancesMap.has(advance.barberId)) {
      barberAdvancesMap.set(advance.barberId, {
        barberId: advance.barberId,
        barberName: advance.barberName || getBarberName(advance.barberId),
        advanceCount: 0,
        pendingAmount: 0,
        settledAmount: 0,
        totalAmount: 0
      });
    }
    
    const current = barberAdvancesMap.get(advance.barberId);
    current.advanceCount += 1;
    current.totalAmount += advance.amount;
    
    if (advance.status === "settled") {
      current.settledAmount += advance.amount;
    } else {
      current.pendingAmount += advance.amount;
    }
    
    barberAdvancesMap.set(advance.barberId, current);
  });
  
  const barberAdvancesData = Array.from(barberAdvancesMap.values());
  
  const handleExportReport = () => {
    toast({
      title: "Exportar reporte",
      description: "Funcionalidad de exportación pendiente de implementar"
    });
  };
  
  const renderFilterControls = () => {
    return (
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Card className="w-full md:w-auto">
          <CardContent className="py-4 px-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-barber-600" />
              <span className="font-semibold">{formattedDate}</span>
            </div>
          </CardContent>
        </Card>
        
        <Select defaultValue={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Tipo de reporte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Diario</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="w-full md:w-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            initialFocus
          />
        </div>
      </div>
    );
  };
  
  const renderPaymentMethodData = () => {
    const paymentMethodsSummary = {
      [PaymentMethod.CASH]: cashTotal,
      [PaymentMethod.CARD]: cardTotal,
      [PaymentMethod.TRANSFER]: transferTotal
    };
    
    const total = Object.values(paymentMethodsSummary).reduce((acc, val) => acc + Number(val), 0);
    
    const pieData = [
      { name: 'Efectivo', value: paymentMethodsSummary[PaymentMethod.CASH], color: '#4ade80' },
      { name: 'Tarjeta', value: paymentMethodsSummary[PaymentMethod.CARD], color: '#60a5fa' },
      { name: 'Transferencia', value: paymentMethodsSummary[PaymentMethod.TRANSFER], color: '#f87171' },
    ];
    
    const tipsPieData = [
      { name: 'Efectivo', value: tipsByMethod.efectivo, color: '#4ade80' },
      { name: 'Tarjeta', value: tipsByMethod.tarjeta, color: '#60a5fa' },
      { name: 'Transferencia', value: tipsByMethod.transferencia, color: '#f87171' },
    ].filter(item => item.value > 0);
    
    const barData = [
      { name: 'Efectivo', amount: paymentMethodsSummary[PaymentMethod.CASH] },
      { name: 'Tarjeta', amount: paymentMethodsSummary[PaymentMethod.CARD] },
      { name: 'Transferencia', amount: paymentMethodsSummary[PaymentMethod.TRANSFER] },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Wallet className="mr-2 h-4 w-4 text-green-500" />
                <div className="text-2xl font-bold">${Math.round(paymentMethodsSummary[PaymentMethod.CASH]).toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {total > 0 ? ((paymentMethodsSummary[PaymentMethod.CASH] / total) * 100).toFixed(1) : "0"}% del total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tarjeta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4 text-blue-500" />
                <div className="text-2xl font-bold">${Math.round(paymentMethodsSummary[PaymentMethod.CARD]).toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {total > 0 ? ((paymentMethodsSummary[PaymentMethod.CARD] / total) * 100).toFixed(1) : "0"}% del total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transferencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Receipt className="mr-2 h-4 w-4 text-red-500" />
                <div className="text-2xl font-bold">${Math.round(paymentMethodsSummary[PaymentMethod.TRANSFER]).toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {total > 0 ? ((paymentMethodsSummary[PaymentMethod.TRANSFER] / total) * 100).toFixed(1) : "0"}% del total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Propinas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <HeartHandshake className="mr-2 h-4 w-4 text-purple-500" />
                <div className="text-2xl font-bold">${Math.round(totalTips).toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalSales > 0 ? ((totalTips / totalSales) * 100).toFixed(1) : "0"}% de las ventas
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de pagos</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Math.round(Number(value)).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Propinas por método de pago</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80">
                {tipsPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tipsPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {tipsPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${Math.round(Number(value)).toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No hay propinas para mostrar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Barbero</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Propina</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => {
                    let barberName = getBarberName(sale.barberId);
                    
                    if (sale.items && sale.items.length > 0 && sale.items[0].barberId) {
                      const barberItem = sale.items.find(item => item.barberId);
                      if (barberItem) {
                        const barber = barbers.find(b => b.id === barberItem.barberId);
                        if (barber && barber.name) {
                          barberName = barber.name;
                        }
                      }
                    }
                    
                    let paymentMethodDisplay = "";
                    if (sale.paymentMethod === PaymentMethod.MIXED) {
                      paymentMethodDisplay = "Mixto";
                    } else if (sale.paymentMethod === PaymentMethod.CASH) {
                      paymentMethodDisplay = "Efectivo";
                    } else if (sale.paymentMethod === PaymentMethod.CARD) {
                      paymentMethodDisplay = "Tarjeta";
                    } else if (sale.paymentMethod === PaymentMethod.TRANSFER) {
                      paymentMethodDisplay = "Transferencia";
                    }
                    
                    const tipInfo = getTipInfo(sale);
                    let tipDisplay = "No";
                    if (tipInfo.hasTip) {
                      let tipMethodDisplay = "";
                      if (tipInfo.method === PaymentMethod.CASH) {
                        tipMethodDisplay = "Efectivo";
                      } else if (tipInfo.method === PaymentMethod.CARD) {
                        tipMethodDisplay = "Tarjeta";
                      } else if (tipInfo.method === PaymentMethod.TRANSFER) {
                        tipMethodDisplay = "Transferencia";
                      }
                      tipDisplay = `$${tipInfo.amount.toFixed(2)} (${tipMethodDisplay})`;
                    }
                    
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {format(new Date(sale.date), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{barberName}</TableCell>
                        <TableCell>
                          {paymentMethodDisplay}
                          {sale.paymentMethod === PaymentMethod.MIXED && sale.splitPayments && (
                            <div className="text-xs text-gray-500 mt-1">
                              {sale.splitPayments.map((split, idx) => (
                                <div key={idx}>
                                  {split.method === PaymentMethod.CASH ? "Efectivo: " : 
                                   split.method === PaymentMethod.CARD ? "Tarjeta: " : 
                                   "Transferencia: "}
                                  ${split.amount.toFixed(2)}
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={tipInfo.hasTip ? "text-purple-600 font-medium" : "text-gray-500"}>
                            {tipDisplay}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${sale.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-gray-500">
                No hay ventas para mostrar en el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderBarberData = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Desempeño de Barberos</CardTitle>
              <CardDescription>Venta total por barbero</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80">
                {barberData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barberData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Math.round(Number(value)).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="monto" name="Venta Total" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No hay datos para mostrar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Propinas por Barbero</CardTitle>
              <CardDescription>Total de propinas recibidas</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80">
                {barberData.filter(b => b.propinas > 0).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barberData.filter(b => b.propinas > 0)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Math.round(Number(value)).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="propinas" name="Propinas" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No hay propinas para mostrar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Barberos</CardTitle>
            <CardDescription>Rendimiento de cada barbero en el período seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            {barberData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barbero</TableHead>
                    <TableHead>Servicios</TableHead>
                    <TableHead>Propinas</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barberData.map((barber) => (
                    <TableRow key={barber.id}>
                      <TableCell className="font-medium">{barber.name}</TableCell>
                      <TableCell>{barber.ventas}</TableCell>
                      <TableCell>${Math.round(barber.propinas).toLocaleString()}</TableCell>
                      <TableCell className="text-right">${Math.round(barber.monto).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-gray-500">
                No hay datos de barberos para mostrar en el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderServicesData = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Servicios más populares</CardTitle>
              <CardDescription>Distribución de servicios</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80">
                {servicesPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={servicesPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {servicesPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} servicios`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No hay servicios para mostrar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <div className="text-2xl font-bold">{totalServices}</div>
                  <div className="text-sm text-muted-foreground">Servicios totales</div>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="text-2xl font-bold">{totalProducts}</div>
                  <div className="text-sm text-muted-foreground">Productos vendidos</div>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="text-2xl font-bold">${Math.round(totalSales).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Venta total</div>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="text-2xl font-bold">${Math.round(totalTips).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Propinas totales</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            {servicesPieData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicesPieData.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="text-right">{service.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-gray-500">
                No hay servicios para mostrar en el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderAdvancesData = () => {
    const pendingAdvances = filteredCashAdvances.filter(
      advance => !advance.settled && (!advance.status || advance.status === "pending")
    );
    
    const settledAdvances = filteredCashAdvances.filter(
      advance => advance.settled || advance.status === "settled"
    );
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Adelantos Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-yellow-500" />
                <div className="text-2xl font-bold">${Math.round(totalPendingAdvances).toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de adelantos pendientes de liquidar
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Adelantos Liquidados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                <div className="text-2xl font-bold">${Math.round(totalSettledAdvances).toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de adelantos ya liquidados
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="settled">Liquidados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Adelantos</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredCashAdvances.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Barbero</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCashAdvances.map((advance) => (
                        <TableRow key={advance.id}>
                          <TableCell>
                            {format(new Date(advance.date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>{advance.barberName || getBarberName(advance.barberId)}</TableCell>
                          <TableCell>${advance.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            {advance.status === "settled" || advance.settled ? (
                              <Badge className="bg-green-500">Liquidado</Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pendiente</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    No hay adelantos para mostrar en el período seleccionado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Adelantos Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingAdvances.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Barbero</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAdvances.map((advance) => (
                        <TableRow key={advance.id}>
                          <TableCell>
                            {format(new Date(advance.date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>{advance.barberName || getBarberName(advance.barberId)}</TableCell>
                          <TableCell>${advance.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pendiente</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    No hay adelantos pendientes para mostrar en el período seleccionado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settled">
            <Card>
              <CardHeader>
                <CardTitle>Adelantos Liquidados</CardTitle>
              </CardHeader>
              <CardContent>
                {settledAdvances.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Barbero</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settledAdvances.map((advance) => (
                        <TableRow key={advance.id}>
                          <TableCell>
                            {format(new Date(advance.date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>{advance.barberName || getBarberName(advance.barberId)}</TableCell>
                          <TableCell>${advance.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">Liquidado</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    No hay adelantos liquidados para mostrar en el período seleccionado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Informes y Reportes</h1>
        <Button variant="outline" onClick={handleExportReport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>
      
      {renderFilterControls()}
      
      <Tabs defaultValue="payments" className="w-full">
        <TabsList>
          <TabsTrigger value="payments">Métodos de Pago</TabsTrigger>
          <TabsTrigger value="barbers">Barberos</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="advances">Adelantos</TabsTrigger>
        </TabsList>
        <TabsContent value="payments" className="space-y-4">
          {renderPaymentMethodData()}
        </TabsContent>
        <TabsContent value="barbers">
          {renderBarberData()}
        </TabsContent>
        <TabsContent value="services">
          {renderServicesData()}
        </TabsContent>
        <TabsContent value="advances">
          {renderAdvancesData()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
