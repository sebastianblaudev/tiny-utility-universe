import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Sidebar from '@/components/Sidebar';
import TenantSecurityAlert from '@/components/TenantSecurityAlert';
import { BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Download, Calendar as CalendarIcon, Receipt, RefreshCwIcon } from 'lucide-react';
import { toast } from "sonner";
import { formatCurrency } from '@/lib/utils';
import { useAuth } from "@/contexts/AuthContext";
import { updateMissingSaleTenantIds } from "@/utils/salesUtils";
import { getSalesByPaymentMethod } from "@/utils/salesUtils";
import { getSalesByCashier } from "@/utils/cashRegisterUtils";
import { getAllTurnos } from '@/utils/turnosUtils';
import { format, subDays, eachDayOfInterval, eachHourOfInterval, startOfDay, endOfDay, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import CashBalanceCard from '@/components/stats/CashBalanceCard';
import { cn } from "@/lib/utils";

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

// Type for top product data
interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_sales: number;
}

// Type for cashier stats
interface PaymentMethodStat {
  count: number;
  total: number;
}

interface CashierStats {
  [paymentMethod: string]: PaymentMethodStat;
}

const Estadisticas = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("hoy");
  const [selectedTurno, setSelectedTurno] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { tenantId } = useAuth();
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);

  // Función para actualizar ventas con autoactualización controlada
  const handleUpdateSales = async () => {
    if (isAutoUpdating || !tenantId) return;
    
    setIsAutoUpdating(true);
    await updateMissingSaleTenantIds(tenantId, () => {
      refetchSales();
      refetchProducts();
      refetchCashierStats();
      refetchPaymentStats();
    });
    setIsAutoUpdating(false);
  };

  // Ejecutar la actualización automáticamente al cargar el componente
  useEffect(() => {
    if (tenantId) {
      handleUpdateSales();
    }
  }, [tenantId]);

  // Get turnos for the filter dropdown
  const { 
    data: turnosData = [], 
    isLoading: isLoadingTurnos 
  } = useQuery({
    queryKey: ['turnos-filter', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      return await getAllTurnos();
    }
  });

  // Filter sales based on turno if one is selected
  const filterSalesByTurno = useCallback((sales: any[]) => {
    if (!selectedTurno) return sales;
    
    const selectedTurnoData = turnosData.find(turno => turno.id === selectedTurno);
    if (!selectedTurnoData) return sales;

    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const turnoStart = new Date(selectedTurnoData.fecha_apertura);
      const turnoEnd = selectedTurnoData.fecha_cierre 
        ? new Date(selectedTurnoData.fecha_cierre)
        : new Date();

      return saleDate >= turnoStart && saleDate <= turnoEnd;
    });
  }, [selectedTurno, turnosData]);

  // Productos más vendidos con datos corregidos
  const { 
    data: topProducts = [], 
    isLoading: isLoadingProducts,
    refetch: refetchProducts
  } = useQuery<TopProduct[]>({
    queryKey: ['topProducts', tenantId, selectedPeriod, selectedTurno, customDateRange],
    queryFn: async () => {
      if (!tenantId) return [];
      
      console.log('Fetching top products for tenant:', tenantId);
      
      try {
        // Obtener todas las ventas del tenant con sus items
        let salesQuery = supabase
          .from('sales')
          .select(`
            id,
            date,
            tenant_id,
            turno_id,
            sale_items (
              product_id,
              quantity,
              price,
              subtotal,
              products (
                id,
                name,
                user_id
              )
            )
          `)
          .eq('tenant_id', tenantId)
          .eq('status', 'completed');

        // Aplicar filtros de período si no hay turno seleccionado
        if (!selectedTurno) {
          if (selectedPeriod === "custom" && customDateRange?.from) {
            // Usar filtro personalizado de fechas
            const startDate = startOfDay(customDateRange.from);
            const endDate = customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from);
            salesQuery = salesQuery.gte('date', startDate.toISOString()).lte('date', endDate.toISOString());
          } else {
            // Usar filtros de período predefinidos
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (selectedPeriod) {
              case "hoy":
                salesQuery = salesQuery.gte('date', today.toISOString());
                break;
              case "semana":
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);
                salesQuery = salesQuery.gte('date', lastWeek.toISOString());
                break;
              case "mes":
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                salesQuery = salesQuery.gte('date', lastMonth.toISOString());
                break;
              case "anio":
                const lastYear = new Date();
                lastYear.setFullYear(lastYear.getFullYear() - 1);
                salesQuery = salesQuery.gte('date', lastYear.toISOString());
                break;
            }
          }
        }

        const { data: salesData, error: salesError } = await salesQuery;
        
        if (salesError) {
          console.error('Error fetching sales for top products:', salesError);
          throw salesError;
        }

        console.log('Raw sales data:', salesData?.length || 0, 'sales found');

        if (!salesData || salesData.length === 0) return [];

        // Filtrar por turno si es necesario
        const filteredSales = selectedTurno ? filterSalesByTurno(salesData) : salesData;
        console.log('Filtered sales:', filteredSales.length, 'after turno filter');

        // Agregar productos por cantidad y ventas
        const productStats: { [key: string]: TopProduct } = {};

        filteredSales.forEach(sale => {
          if (sale.sale_items && Array.isArray(sale.sale_items)) {
            sale.sale_items.forEach((item: any) => {
              if (item.product_id && item.products) {
                const productId = item.product_id;
                const productName = item.products.name || `Producto ${productId}`;
                const quantity = Number(item.quantity) || 0;
                const subtotal = Number(item.subtotal) || 0;

                if (!productStats[productId]) {
                  productStats[productId] = {
                    product_id: productId,
                    product_name: productName,
                    total_quantity: 0,
                    total_sales: 0
                  };
                }

                productStats[productId].total_quantity += quantity;
                productStats[productId].total_sales += subtotal;
              }
            });
          }
        });

        // Convertir a array y ordenar por cantidad vendida
        const topProductsArray = Object.values(productStats)
          .sort((a, b) => b.total_quantity - a.total_quantity)
          .slice(0, 10);

        console.log('Top products processed:', topProductsArray.length);
        return topProductsArray;
      } catch (error) {
        console.error('Error in top products query:', error);
        return [];
      }
    },
    enabled: !!tenantId
  });

  // Consulta de estadísticas por cajero y método de pago
  const { 
    data: cashierStats = {},
    isLoading: isLoadingCashierStats,
    refetch: refetchCashierStats
  } = useQuery({
    queryKey: ['cashierStats', tenantId, selectedPeriod],
    queryFn: async () => {
      if (!tenantId) return {};
      return await getSalesByCashier(tenantId, selectedPeriod);
    }
  });

  // Update the Consulta de ventas hook to filter by turno
  const { 
    data: salesData = [], 
    isLoading: isLoadingSales,
    refetch: refetchSales
  } = useQuery({
    queryKey: ['sales', selectedPeriod, selectedTurno, tenantId, customDateRange],
    queryFn: async () => {
      if (!tenantId) return [];
      
      let query = supabase.from('sales').select(`
        *,
        sale_payment_methods (
          payment_method,
          amount
        )
      `);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!selectedTurno) {
        if (selectedPeriod === "custom" && customDateRange?.from) {
          // Usar filtro personalizado de fechas
          const startDate = startOfDay(customDateRange.from);
          const endDate = customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from);
          query = query.gte('date', startDate.toISOString()).lte('date', endDate.toISOString());
        } else {
          // Apply regular time period filter
          switch (selectedPeriod) {
            case "hoy":
              query = query.gte('date', today.toISOString());
              break;
            case "semana":
              const lastWeek = new Date();
              lastWeek.setDate(lastWeek.getDate() - 7);
              query = query.gte('date', lastWeek.toISOString());
              break;
            case "mes":
              const lastMonth = new Date();
              lastMonth.setMonth(lastMonth.getMonth() - 1);
              query = query.gte('date', lastMonth.toISOString());
              break;
            case "anio":
              const lastYear = new Date();
              lastYear.setFullYear(lastYear.getFullYear() - 1);
              query = query.gte('date', lastYear.toISOString());
              break;
          }
        }
      } else {
        // If a turno is selected, we'll filter the results in memory after fetching
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        query = query.gte('date', lastMonth.toISOString());
      }
      
      // Filtrar por tenant_id para asegurar que solo vemos ventas de este negocio
      query = query.eq('tenant_id', tenantId);
      query = query.eq('status', 'completed').order('date', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching sales:', error);
        throw error;
      }
      
      console.log('Raw sales data:', data?.length || 0, 'sales found');
      
      // Apply turno filter if one is selected
      if (selectedTurno && data) {
        const filteredData = filterSalesByTurno(data);
        console.log('Filtered by turno:', filteredData.length, 'sales after filter');
        return filteredData;
      }
      
      return data || [];
    }
  });

  // Los datos de paymentMethodStats ya incluyen los pagos mixtos distribuidos automáticamente
  const calcularTotalEfectivo = () => {
    const cashStats = paymentMethodStats['cash'] || paymentMethodStats['efectivo'];
    return cashStats ? cashStats.total : 0;
  };

  const calcularTotalTarjeta = () => {
    const cardStats = paymentMethodStats['card'] || paymentMethodStats['tarjeta'];
    return cardStats ? cardStats.total : 0;
  };

  const calcularTotalTransferencia = () => {
    const transferStats = paymentMethodStats['transfer'] || paymentMethodStats['transferencia'];
    return transferStats ? transferStats.total : 0;
  };

  // Contar solo los pagos mixtos (para mostrar como referencia)
  const calcularCantidadPagosMixtos = () => {
    if (!salesData) return 0;
    return salesData.filter(sale => sale.payment_method === 'mixed').length;
  };

  const calcularCantidadEfectivo = () => {
    const cashStats = paymentMethodStats['cash'] || paymentMethodStats['efectivo'];
    return cashStats ? cashStats.count : 0;
  };

  const calcularCantidadTarjeta = () => {
    const cardStats = paymentMethodStats['card'] || paymentMethodStats['tarjeta'];
    return cardStats ? cardStats.count : 0;
  };

  const calcularCantidadTransferencia = () => {
    const transferStats = paymentMethodStats['transfer'] || paymentMethodStats['transferencia'];
    return transferStats ? transferStats.count : 0;
  };

  // Consulta para obtener datos de métodos de pago usando la función de base de datos
  const { 
    data: paymentMethodStats = {}, 
    isLoading: isLoadingPaymentStats,
    refetch: refetchPaymentStats
  } = useQuery({
    queryKey: ['paymentMethodStats', tenantId, selectedPeriod, selectedTurno, customDateRange],
    queryFn: async () => {
      if (!tenantId) return {};
      
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      if (!selectedTurno) {
        if (selectedPeriod === "custom" && customDateRange?.from) {
          // Usar filtro personalizado de fechas
          const customStartDate = startOfDay(customDateRange.from);
          const customEndDate = customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from);
          startDate = customStartDate.toISOString();
          endDate = customEndDate.toISOString();
        } else {
          // Usar filtros de período predefinidos
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          switch (selectedPeriod) {
            case "hoy":
              startDate = today.toISOString();
              endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
              break;
            case "semana":
              const lastWeek = new Date();
              lastWeek.setDate(lastWeek.getDate() - 7);
              startDate = lastWeek.toISOString();
              endDate = new Date().toISOString();
              break;
            case "mes":
              const lastMonth = new Date();
              lastMonth.setMonth(lastMonth.getMonth() - 1);
              startDate = lastMonth.toISOString();
              endDate = new Date().toISOString();
              break;
            case "anio":
              const lastYear = new Date();
              lastYear.setFullYear(lastYear.getFullYear() - 1);
              startDate = lastYear.toISOString();
              endDate = new Date().toISOString();
              break;
          }
        }
      } else if (selectedTurno && turnosData.length > 0) {
        const selectedTurnoData = turnosData.find(turno => turno.id === selectedTurno);
        if (selectedTurnoData) {
          startDate = selectedTurnoData.fecha_apertura;
          endDate = selectedTurnoData.fecha_cierre || new Date().toISOString();
        }
      }
      
      return await getSalesByPaymentMethod(tenantId, startDate, endDate);
    },
    enabled: !!tenantId
  });

  // Prepare data for payment methods pie chart using the database function results
  const getPaymentMethodData = () => {
    if (!paymentMethodStats || Object.keys(paymentMethodStats).length === 0) return [];
    
    const data = [];
    
    // Mapear nombres de métodos de pago
    const methodNames: Record<string, string> = {
      'cash': 'Efectivo',
      'efectivo': 'Efectivo',
      'card': 'Tarjeta',
      'tarjeta': 'Tarjeta',
      'transfer': 'Transferencia',
      'transferencia': 'Transferencia'
    };
    
    Object.entries(paymentMethodStats).forEach(([method, stats]) => {
      if (stats.total > 0) {
        data.push({
          name: methodNames[method] || method,
          value: stats.total,
          count: stats.count
        });
      }
    });
    
    return data;
  };
  
  const paymentMethodData = getPaymentMethodData();

  // Improved chart data generation with proper period handling
  const generateChartData = () => {
    if (!salesData || salesData.length === 0) {
      console.log('No sales data available for chart');
      return [];
    }
    
    console.log('Generating chart data for', salesData.length, 'sales');
    
    // Special handling for turno selection
    if (selectedTurno && turnosData.length > 0) {
      const selectedTurnoData = turnosData.find(turno => turno.id === selectedTurno);
      if (selectedTurnoData) {
        try {
          const turnoStart = new Date(selectedTurnoData.fecha_apertura);
          const turnoEnd = selectedTurnoData.fecha_cierre 
            ? new Date(selectedTurnoData.fecha_cierre)
            : new Date();
          
          // Validate dates before using them
          if (!isValid(turnoStart) || !isValid(turnoEnd)) {
            console.error('Invalid turno dates:', { turnoStart, turnoEnd });
            return [];
          }
          
          const intervals = eachHourOfInterval({ start: turnoStart, end: turnoEnd });
          const formatString = 'HH:00';
          
          const chartDataMap = new Map();
          if (Array.isArray(intervals)) {
            intervals.forEach(interval => {
              const key = format(interval, formatString);
              chartDataMap.set(key, { date: key, total: 0, count: 0 });
            });
          }
          
          salesData.forEach(sale => {
            if (!sale.date) return;
            
            let saleDate;
            try {
              saleDate = typeof sale.date === 'string' ? parseISO(sale.date) : new Date(sale.date);
              if (!isValid(saleDate)) return;
            } catch (error) {
              return;
            }
            
            const key = format(saleDate, 'HH:00');
            
            if (chartDataMap.has(key)) {
              const existing = chartDataMap.get(key);
              existing.total += Number(sale.total) || 0;
              existing.count += 1;
              chartDataMap.set(key, existing);
            }
          });
          
          const result = chartDataMap ? Array.from(chartDataMap.values()).sort((a, b) => {
            return a.date.localeCompare(b.date);
          }) : [];
          
          console.log('Generated turno chart data:', result);
          return result;
        } catch (error) {
          console.error('Error generating turno chart data:', error);
          return [];
        }
      }
    }
    
    // Regular period handling
    const now = new Date();
    let intervals: Date[] = [];
    let formatString = '';
    let groupBy = '';
    
    if (selectedPeriod === "hoy") {
      const startOfToday = startOfDay(now);
      const endOfToday = endOfDay(now);
      intervals = eachHourOfInterval({ start: startOfToday, end: endOfToday });
      formatString = 'HH:00';
      groupBy = 'hour';
    } else if (selectedPeriod === "semana") {
      const startDate = subDays(now, 6);
      intervals = eachDayOfInterval({ start: startDate, end: now });
      formatString = 'dd/MM';
      groupBy = 'day';
    } else if (selectedPeriod === "mes") {
      const startDate = subDays(now, 29);
      intervals = eachDayOfInterval({ start: startDate, end: now });
      formatString = 'dd/MM';
      groupBy = 'day';
    } else if (selectedPeriod === "anio") {
      const startDate = subDays(now, 29);
      intervals = eachDayOfInterval({ start: startDate, end: now });
      formatString = 'dd/MM';
      groupBy = 'day';
    }
    
    const chartDataMap = new Map();
    if (Array.isArray(intervals)) {
      intervals.forEach(interval => {
        const key = format(interval, formatString);
        chartDataMap.set(key, { date: key, total: 0, count: 0 });
      });
    }
    
    salesData.forEach(sale => {
      if (!sale.date) {
        console.log('Sale without date found:', sale.id);
        return;
      }
      
      let saleDate;
      try {
        saleDate = typeof sale.date === 'string' ? parseISO(sale.date) : new Date(sale.date);
        if (!isValid(saleDate)) {
          console.log('Invalid sale date:', sale.date, 'for sale:', sale.id);
          return;
        }
      } catch (error) {
        console.log('Error parsing sale date:', sale.date, 'for sale:', sale.id);
        return;
      }
      
      let key = '';
      
      if (groupBy === 'hour') {
        key = format(saleDate, 'HH:00');
      } else {
        key = format(saleDate, 'dd/MM');
      }
      
      if (chartDataMap.has(key)) {
        const existing = chartDataMap.get(key);
        existing.total += Number(sale.total) || 0;
        existing.count += 1;
        chartDataMap.set(key, existing);
        console.log(`Added sale ${sale.id} with total ${sale.total} to ${key}`);
      } else {
        console.log(`Key ${key} not found in chart data map for sale ${sale.id}`);
      }
    });
    
    const result = chartDataMap ? Array.from(chartDataMap.values()).sort((a, b) => {
      return a.date.localeCompare(b.date);
    }) : [];
    
    console.log('Generated chart data:', result);
    return result;
  };

  const calcularTotalIngresos = () => {
    if (!salesData) return 0;
    return salesData.reduce((sum, sale) => sum + sale.total, 0);
  };

  const handleExportData = () => {
    if (!salesData) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Fecha,Total,Método de Pago,Estado\n" 
      + salesData.map(sale => {
          return `${sale.id},${sale.date},${sale.total},${sale.payment_method},${sale.status}`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ventas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReceipt = async (saleId: string) => {
    try {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .single();
        
      if (saleError) throw saleError;
        
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('*, products(name)')
        .eq('sale_id', saleId);
        
      if (itemsError) throw itemsError;

      const receiptDate = saleData.date 
        ? new Date(saleData.date).toLocaleString() 
        : 'Sin fecha';
      
      let receiptContent = `RECIBO DE VENTA\n`;
      receiptContent += `====================\n`;
      receiptContent += `ID: ${saleId}\n`;
      receiptContent += `Fecha: ${receiptDate}\n`;
      receiptContent += `Método de pago: ${saleData.payment_method || 'No especificado'}\n`;
      receiptContent += `Estado: ${saleData.status}\n`;
      receiptContent += `====================\n\n`;
      receiptContent += `PRODUCTOS:\n`;
      
      if (saleItems && saleItems.length > 0) {
        saleItems.forEach(item => {
          const productName = item.products?.name || `Producto ${item.product_id}`;
          const itemQuantity = item.quantity || 0;
          const itemPrice = item.price || 0;
          const itemSubtotal = item.subtotal || (itemQuantity * itemPrice);
          
          receiptContent += `${itemQuantity} x ${productName} - ${formatCurrency(itemPrice)} c/u = ${formatCurrency(itemSubtotal)}\n`;
        });
      }
      
      receiptContent += `\n====================\n`;
      receiptContent += `TOTAL: ${formatCurrency(saleData.total)}\n`;
      
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo-venta-${saleId.substring(0, 8)}.txt`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success("Recibo descargado correctamente");
    } catch (error) {
      console.error('Error al descargar recibo:', error);
      toast.error("Error al descargar el recibo");
    }
  };

  // Helper function to translate payment method names
  const translatePaymentMethod = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'mixed': return 'Mixto';
      default: return method;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-5">
          <div className="container mx-auto">
            <TenantSecurityAlert />
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estadísticas</h1>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUpdateSales}
                  disabled={isAutoUpdating}
                  title="Actualizar ventas sin ID de negocio"
                >
                  <RefreshCwIcon size={16} className="mr-2" />
                  Actualizar Ventas
                </Button>
                <Button 
                  onClick={handleExportData} 
                  className="flex items-center gap-2" 
                  variant="outline"
                >
                  <Download size={16} /> Exportar Datos
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(calcularTotalIngresos())}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Órdenes Procesadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{salesData?.filter(sale => sale.status === 'completed').length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {salesData && salesData.filter(sale => sale.status === 'completed').length > 0 
                      ? formatCurrency(calcularTotalIngresos() / salesData.filter(sale => sale.status === 'completed').length) 
                      : formatCurrency(0)}
                  </div>
                </CardContent>
              </Card>
              <div>
                <CashBalanceCard />
              </div>
            </div>
            
            {/* Payment Method Totals Summary */}
            <div className="mb-6 p-3 bg-muted/20 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Totales por Método de Pago:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-background p-2 rounded border">
                  <p className="text-xs text-muted-foreground">Efectivo</p>
                  <p className="font-bold">{formatCurrency(calcularTotalEfectivo())}</p>
                  <p className="text-xs text-muted-foreground">({calcularCantidadEfectivo()} ventas)</p>
                </div>
                <div className="bg-background p-2 rounded border">
                  <p className="text-xs text-muted-foreground">Tarjeta</p>
                  <p className="font-bold">{formatCurrency(calcularTotalTarjeta())}</p>
                  <p className="text-xs text-muted-foreground">({calcularCantidadTarjeta()} ventas)</p>
                </div>
                <div className="bg-background p-2 rounded border">
                  <p className="text-xs text-muted-foreground">Transferencia</p>
                  <p className="font-bold">{formatCurrency(calcularTotalTransferencia())}</p>
                  <p className="text-xs text-muted-foreground">({calcularCantidadTransferencia()} ventas)</p>
                </div>
              </div>
            </div>

            {/* Información sobre pagos mixtos distribuidos */}
            {calcularCantidadPagosMixtos() > 0 && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                    Información de Pagos Mixtos
                  </Badge>
                  <span className="text-sm font-medium text-blue-900">
                    {calcularCantidadPagosMixtos()} ventas con pago mixto (distribuidas en los totales arriba)
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  Los montos de pagos mixtos ya están distribuidos automáticamente en cada método de pago correspondiente.
                </p>
              </div>
            )}

            {/* Filtro de Ventas por Fecha Personalizada */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Filtros de Fecha
                </CardTitle>
                <CardDescription>
                  Selecciona un período para filtrar las estadísticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtros rápidos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <Button
                    variant={selectedPeriod === "hoy" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedPeriod("hoy");
                      setCustomDateRange(undefined);
                      setSelectedTurno(null);
                    }}
                    size="sm"
                  >
                    Hoy
                  </Button>
                  <Button
                    variant={selectedPeriod === "semana" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedPeriod("semana");
                      setCustomDateRange(undefined);
                      setSelectedTurno(null);
                    }}
                    size="sm"
                  >
                    Esta Semana
                  </Button>
                  <Button
                    variant={selectedPeriod === "mes" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedPeriod("mes");
                      setCustomDateRange(undefined);
                      setSelectedTurno(null);
                    }}
                    size="sm"
                  >
                    Este Mes
                  </Button>
                  <Button
                    variant={selectedPeriod === "anio" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedPeriod("anio");
                      setCustomDateRange(undefined);
                      setSelectedTurno(null);
                    }}
                    size="sm"
                  >
                    Este Año
                  </Button>
                </div>

                {/* Filtro personalizado */}
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <div className="flex-1 w-full">
                    <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={selectedPeriod === "custom" ? "default" : "outline"}
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDateRange?.from ? (
                            customDateRange.to ? (
                              `${format(customDateRange.from, "dd/MM/yy")} - ${format(customDateRange.to, "dd/MM/yy")}`
                            ) : (
                              format(customDateRange.from, "dd/MM/yyyy")
                            )
                          ) : (
                            "Fechas personalizadas"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={customDateRange?.from || new Date()}
                          selected={customDateRange || undefined}
                          onSelect={(range) => {
                            setCustomDateRange(range);
                            if (range?.from) {
                              setSelectedPeriod("custom");
                              setSelectedTurno(null);
                            }
                          }}
                          numberOfMonths={1}
                          className="p-3 pointer-events-auto"
                          locale={es}
                        />
                        <div className="p-3 border-t">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCustomDateRange(undefined);
                                setSelectedPeriod("hoy");
                                setShowDatePicker(false);
                              }}
                              className="flex-1"
                            >
                              Limpiar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setShowDatePicker(false);
                                if (customDateRange?.from) {
                                  toast.success("Filtro aplicado");
                                }
                              }}
                              className="flex-1"
                            >
                              Aplicar
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Indicador de filtro activo */}
                {selectedPeriod === "custom" && customDateRange?.from && (
                  <div className="mt-3 p-2 bg-primary/10 border border-primary/20 rounded-md">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary font-medium">
                        📅 {format(customDateRange.from, "dd/MM/yyyy")}
                        {customDateRange.to && ` - ${format(customDateRange.to, "dd/MM/yyyy")}`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustomDateRange(undefined);
                          setSelectedPeriod("hoy");
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="ventas" className="mb-6">
              <div className="flex justify-between items-center mb-6">
                <TabsList>
                  <TabsTrigger value="ventas" className="flex items-center gap-2">
                    <LineChartIcon size={16} /> Ventas
                  </TabsTrigger>
                  <TabsTrigger value="productos" className="flex items-center gap-2">
                    <BarChart3 size={16} /> Productos
                  </TabsTrigger>
                  <TabsTrigger value="metodos-pago" className="flex items-center gap-2">
                    <PieChartIcon size={16} /> Métodos de Pago
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-muted-foreground" />
                    <select
                      value={selectedTurno || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedTurno(value === "" ? null : value);
                        if (value !== "") {
                          setSelectedPeriod("personalizado");
                        }
                      }}
                      className="bg-background border border-input rounded-md h-8 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Todos los turnos</option>
                      {isLoadingTurnos ? (
                        <option disabled>Cargando turnos...</option>
                      ) : (
                        turnosData.map((turno) => {
                          const date = new Date(turno.fecha_apertura).toLocaleDateString();
                          const startTime = new Date(turno.fecha_apertura).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                          const endTime = turno.fecha_cierre 
                            ? new Date(turno.fecha_cierre).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            : 'Activo';
                          return (
                            <option key={turno.id} value={turno.id}>
                              {date} - {turno.cajero_nombre} ({startTime} a {endTime})
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-muted-foreground" />
                    <select
                      value={selectedPeriod}
                      onChange={(e) => {
                        setSelectedPeriod(e.target.value);
                        if (selectedTurno) {
                          setSelectedTurno(null);
                        }
                      }}
                      disabled={!!selectedTurno}
                      className="bg-background border border-input rounded-md h-8 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="hoy">Hoy</option>
                      <option value="semana">Últimos 7 días</option>
                      <option value="mes">Último mes</option>
                      <option value="anio">Último año</option>
                      {selectedTurno && <option value="personalizado">Personalizado (Turno)</option>}
                    </select>
                  </div>
                </div>
              </div>
              
              <TabsContent value="ventas">
                <Card>
                  <CardHeader>
                    <CardTitle>Ventas por Período</CardTitle>
                    <CardDescription>
                      {selectedTurno
                        ? 'Visualización de ventas por hora durante el turno seleccionado'
                        : selectedPeriod === 'hoy' 
                          ? 'Visualización de ventas por hora (hoy)' 
                          : 'Visualización de ventas totales por día'
                      }
                      {selectedTurno && (
                        <span className="block text-sm text-muted-foreground mt-1">
                          Filtrado por turno seleccionado
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {isLoadingSales ? (
                        <div className="flex items-center justify-center h-full">
                          <p>Cargando datos...</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={generateChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                            <Line type="monotone" dataKey="total" name="Ventas" stroke="#0088FE" strokeWidth={2} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="productos">
                <Card>
                  <CardHeader>
                    <CardTitle>Productos Más Vendidos</CardTitle>
                    <CardDescription>
                      Top 10 productos por cantidad vendida
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {isLoadingProducts ? (
                        <div className="flex items-center justify-center h-full">
                          <p>Cargando productos...</p>
                        </div>
                      ) : topProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topProducts.map((item, index) => ({
                            name: item.product_name,
                            cantidad: item.total_quantity,
                            ventas: item.total_sales,
                            fill: COLORS[index % COLORS.length]
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              interval={0}
                            />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => [
                                name === 'cantidad' ? `${value} unidades` : formatCurrency(Number(value)),
                                name === 'cantidad' ? 'Cantidad' : 'Ventas'
                              ]}
                            />
                            <Legend />
                            <Bar dataKey="cantidad" name="Cantidad Vendida" fill="#0088FE" />
                            <Bar dataKey="ventas" name="Total Ventas" fill="#00C49F" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p>No hay datos de productos para mostrar</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Lista detallada de productos */}
                    {topProducts.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-3">Detalle de Productos Más Vendidos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {topProducts.slice(0, 8).map((product, index) => (
                            <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full" 
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <div>
                                  <p className="font-medium text-sm">{product.product_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {product.total_quantity} unidades vendidas
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(product.total_sales)}</p>
                                <p className="text-xs text-muted-foreground">Total ventas</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="metodos-pago">
                <Card>
                  <CardHeader>
                    <CardTitle>Ventas por Método de Pago</CardTitle>
                    <CardDescription>
                      Distribución de ventas según el método de pago
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {isLoadingSales ? (
                        <div className="flex items-center justify-center h-full">
                          <p>Cargando datos...</p>
                        </div>
                      ) : paymentMethodData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={paymentMethodData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {paymentMethodData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p>No hay datos para mostrar</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <Card>
              <CardHeader>
                <CardTitle>Últimas Ventas</CardTitle>
                <CardDescription>
                  Registro detallado de las ventas más recientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Método de Pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Recibo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSales ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Cargando datos...</TableCell>
                      </TableRow>
                    ) : salesData && salesData.length > 0 ? (
                      salesData.slice(0, 5).map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.id.substring(0, 8)}...</TableCell>
                          <TableCell>{sale.date ? new Date(sale.date).toLocaleDateString() : 'Sin fecha'}</TableCell>
                          <TableCell>{formatCurrency(sale.total)}</TableCell>
                          <TableCell>{translatePaymentMethod(sale.payment_method) || 'No especificado'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sale.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sale.status === 'completed' ? 'Completada' : sale.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDownloadReceipt(sale.id)}
                              className="h-8 px-2"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No hay ventas para mostrar</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Estadisticas;
