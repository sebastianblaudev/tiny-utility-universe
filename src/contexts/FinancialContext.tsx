import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { 
  BarberCommission, 
  OperationalExpense, 
  BarberFinancialSummary, 
  BranchFinancialSummary,
  DailyFinancialReport,
  WeeklyFinancialReport
} from '../types/financial';
import { useBarber } from './BarberContext';
import { useSupabaseCommissions } from '@/hooks/useSupabaseCommissions';
import { useSupabaseExpenses } from '@/hooks/useSupabaseExpenses';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, isSameDay, isWithinInterval, startOfDay, endOfDay, subDays, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

interface FinancialContextType {
  barberCommissions: BarberCommission[];
  operationalExpenses: OperationalExpense[];
  
  generateDailyReport: (date: Date) => DailyFinancialReport;
  generateWeeklyReport: (date: Date) => WeeklyFinancialReport;
  exportReportToTxt: (report: DailyFinancialReport | WeeklyFinancialReport, type: 'daily' | 'weekly') => void;
  
  addBarberCommission: (commission: Omit<BarberCommission, 'id'>) => void;
  updateBarberCommission: (commission: BarberCommission) => void;
  deleteBarberCommission: (id: string) => void;
  getBarberCommissionRate: (barberId: string, serviceId?: string, categoryId?: string) => number;
  
  addOperationalExpense: (expense: Omit<OperationalExpense, 'id'>) => void;
  updateOperationalExpense: (expense: OperationalExpense) => void;
  deleteOperationalExpense: (id: string) => void;
  getExpensesByCategory: (category: string, startDate?: Date, endDate?: Date) => OperationalExpense[];
  
  getBarberFinancialSummary: (barberId: string, date: Date) => BarberFinancialSummary;
  getBarberWeeklySummary: (barberId: string, weekEndDate: Date) => BarberFinancialSummary;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

interface FinancialProviderProps {
  children: ReactNode;
}

// Utility function to deduplicate barber summaries by name
const deduplicateBarberSummaries = (summaries: BarberFinancialSummary[]): BarberFinancialSummary[] => {
  const seen = new Map<string, BarberFinancialSummary>();
  
  summaries.forEach(summary => {
    const normalizedName = summary.barberName.toLowerCase().trim();
    
    if (seen.has(normalizedName)) {
      // Merge with existing summary
      const existing = seen.get(normalizedName)!;
      existing.serviceCount += summary.serviceCount;
      existing.totalAmount += summary.totalAmount;
      existing.commissionsAmount += summary.commissionsAmount;
      existing.advancesAmount += summary.advancesAmount;
      existing.pendingPayment += summary.pendingPayment;
      
      // Recalculate commission percentage
      existing.commissionsPercentage = existing.totalAmount > 0 
        ? (existing.commissionsAmount / existing.totalAmount) * 100 
        : 0;
    } else {
      seen.set(normalizedName, { ...summary });
    }
  });
  
  return Array.from(seen.values());
};

export const FinancialProvider = ({ children }: FinancialProviderProps) => {
  const { toast } = useToast();
  const { 
    barbers, 
    sales, 
    services, 
    categories,
    cashAdvances 
  } = useBarber();

  // Usar los hooks de Supabase para comisiones y gastos
  const {
    barberCommissions,
    addBarberCommission,
    updateBarberCommission,
    deleteBarberCommission,
    getBarberCommissionRate
  } = useSupabaseCommissions();
  
  const {
    operationalExpenses,
    addOperationalExpense,
    updateOperationalExpense,
    deleteOperationalExpense
  } = useSupabaseExpenses();

  useEffect(() => {
    console.log('Financial data initialized with Supabase:', {
      commissions: barberCommissions.length,
      expenses: operationalExpenses.length
    });
  }, [barberCommissions.length, operationalExpenses.length]);

  const getExpensesByCategory = (category: string, startDate?: Date, endDate?: Date): OperationalExpense[] => {
    let filteredExpenses = operationalExpenses.filter(expense => expense.category === category);
    
    if (startDate && endDate) {
      filteredExpenses = filteredExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return isWithinInterval(expenseDate, { start: startDate, end: endDate });
      });
    }
    
    return filteredExpenses;
  };

  const getBarberFinancialSummary = (barberId: string, date: Date): BarberFinancialSummary => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const barberSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return (
        isWithinInterval(saleDate, { start: dayStart, end: dayEnd }) &&
        (sale.barberId === barberId || sale.items.some(item => item.barberId === barberId))
      );
    });
    
    const serviceCount = barberSales.reduce((count, sale) => {
      return count + sale.items.filter(item => 
        (item.type === 'service' && (item.barberId === barberId || !item.barberId))
      ).length;
    }, 0);
    
    const totalAmount = barberSales.reduce((total, sale) => {
      if (sale.barberId === barberId) {
        return total + sale.total;
      }
      
      const barberItems = sale.items.filter(item => item.barberId === barberId);
      const barberItemsTotal = barberItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return total + barberItemsTotal;
    }, 0);
    
    let commissionsAmount = 0;
    
    barberSales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.type === 'service' && (item.barberId === barberId || (!item.barberId && sale.barberId === barberId))) {
          const service = services.find(s => s.id === item.serviceId);
          const categoryId = service?.categoryId;
          
          const commissionRate = getBarberCommissionRate(barberId, item.serviceId, categoryId);
          
          const itemAmount = item.price * item.quantity;
          commissionsAmount += (itemAmount * commissionRate) / 100;
        }
      });
    });
    
    const advancesForDay = cashAdvances.filter(advance => {
      const advanceDate = new Date(advance.date);
      return isSameDay(advanceDate, date) && advance.barberId === barberId;
    });
    
    const advancesAmount = advancesForDay.reduce((total, advance) => total + advance.amount, 0);
    
    const pendingPayment = commissionsAmount - advancesAmount;
    
    const barber = barbers.find(b => b.id === barberId);
    const barberName = barber ? barber.name : `Barbero ${barberId}`;
    
    const commissionsPercentage = totalAmount > 0 
      ? (commissionsAmount / totalAmount) * 100 
      : 0;
    
    return {
      barberId,
      barberName,
      serviceCount,
      totalAmount,
      commissionsPercentage,
      commissionsAmount,
      advancesAmount,
      pendingPayment,
      date
    };
  };

  const getBarberWeeklySummary = (barberId: string, weekEndDate: Date): BarberFinancialSummary => {
    const weekStart = startOfWeek(weekEndDate, { weekStartsOn: 0 });
    const weekEnd = endOfDay(weekEndDate);
    
    let totalServiceCount = 0;
    let totalAmount = 0;
    let totalCommissions = 0;
    let totalAdvances = 0;
    
    let currentDate = weekStart;
    while (isBefore(currentDate, addDays(weekEnd, 1))) {
      const dailySummary = getBarberFinancialSummary(barberId, currentDate);
      
      totalServiceCount += dailySummary.serviceCount;
      totalAmount += dailySummary.totalAmount;
      totalCommissions += dailySummary.commissionsAmount;
      totalAdvances += dailySummary.advancesAmount;
      
      currentDate = addDays(currentDate, 1);
    }
    
    const barber = barbers.find(b => b.id === barberId);
    const barberName = barber ? barber.name : `Barbero ${barberId}`;
    
    const commissionsPercentage = totalAmount > 0 
      ? (totalCommissions / totalAmount) * 100 
      : 0;
      
    const pendingPayment = totalCommissions - totalAdvances;
    
    return {
      barberId,
      barberName,
      serviceCount: totalServiceCount,
      totalAmount,
      commissionsPercentage,
      commissionsAmount: totalCommissions,
      advancesAmount: totalAdvances,
      pendingPayment,
      date: weekEndDate
    };
  };

  const generateDailyReport = (date: Date): DailyFinancialReport => {
    const rawBarberSummaries = barbers.map(barber => 
      getBarberFinancialSummary(barber.id, date)
    );

    // Deduplicate barber summaries
    const barberSummaries = deduplicateBarberSummaries(rawBarberSummaries);

    const totalSales = barberSummaries.reduce((sum, barber) => sum + barber.totalAmount, 0);
    const totalCommissions = barberSummaries.reduce((sum, barber) => sum + barber.commissionsAmount, 0);
    
    // Obtener los gastos para la fecha específica
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dailyExpenses = operationalExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { start: dayStart, end: dayEnd });
    });
    
    const totalExpenses = dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalSales - totalCommissions - totalExpenses;

    const branchSummaries: BranchFinancialSummary[] = [{
      branchId: '1',
      branchName: 'Sucursal Principal',
      totalSales,
      totalCommissions,
      totalExpenses,
      netProfit,
      barberSummaries,
      date
    }];

    return {
      date,
      barberSummaries,
      branchSummaries,
      totalSales,
      totalCommissions,
      totalExpenses,
      netProfit
    };
  };

  const generateWeeklyReport = (date: Date): WeeklyFinancialReport => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
    
    const rawBarberSummaries = barbers.map(barber => 
      getBarberWeeklySummary(barber.id, date)
    );

    // Deduplicate barber summaries
    const barberSummaries = deduplicateBarberSummaries(rawBarberSummaries);

    const totalSales = barberSummaries.reduce((sum, barber) => sum + barber.totalAmount, 0);
    const totalCommissions = barberSummaries.reduce((sum, barber) => sum + barber.commissionsAmount, 0);
    
    // Calcular el total de gastos para la semana
    const weeklyExpenses = operationalExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { start: weekStart, end: weekEnd });
    });
    
    const totalExpenses = weeklyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalSales - totalCommissions - totalExpenses;

    const branchSummaries: BranchFinancialSummary[] = [{
      branchId: '1',
      branchName: 'Sucursal Principal',
      totalSales,
      totalCommissions,
      totalExpenses,
      netProfit,
      barberSummaries,
      date: weekEnd
    }];

    return {
      startDate: weekStart,
      endDate: weekEnd,
      barberSummaries,
      branchSummaries,
      totalSales,
      totalCommissions,
      totalExpenses,
      netProfit
    };
  };

  const exportReportToTxt = (report: DailyFinancialReport | WeeklyFinancialReport, type: 'daily' | 'weekly') => {
    try {
      let content = '';
      
      if (type === 'daily') {
        const dailyReport = report as DailyFinancialReport;
        content += `REPORTE DIARIO: ${format(dailyReport.date, 'EEEE, d MMMM yyyy', { locale: es })}\n`;
        content += `==========================================================\n\n`;
      } else {
        const weeklyReport = report as WeeklyFinancialReport;
        content += `REPORTE SEMANAL: ${format(weeklyReport.startDate, 'd MMMM', { locale: es })} - ${format(weeklyReport.endDate, 'd MMMM yyyy', { locale: es })}\n`;
        content += `==========================================================\n\n`;
      }
      
      content += `RESUMEN POR BARBERO\n`;
      content += `----------------------------------------------------------\n`;
      report.barberSummaries.forEach(barber => {
        content += `Barbero: ${barber.barberName}\n`;
        content += `Servicios: ${barber.serviceCount}\n`;
        content += `Ventas: $${barber.totalAmount.toFixed(2)}\n`;
        content += `Comisión (%): ${barber.commissionsPercentage.toFixed(2)}%\n`;
        content += `Comisión Total: $${barber.commissionsAmount.toFixed(2)}\n`;
        content += `Adelantos: $${barber.advancesAmount.toFixed(2)}\n`;
        content += `Pago Pendiente: $${barber.pendingPayment.toFixed(2)}\n`;
        content += `----------------------------------------------------------\n`;
      });
      
      content += `\n`;
      
      content += `RESUMEN GENERAL\n`;
      content += `----------------------------------------------------------\n`;
      content += `Ventas Totales: $${report.totalSales.toFixed(2)}\n`;
      content += `Comisiones Totales: $${report.totalCommissions.toFixed(2)}\n`;
      content += `Gastos Operacionales: $${report.totalExpenses.toFixed(2)}\n`;
      content += `Ganancia Neta: $${report.netProfit.toFixed(2)}\n`;
      content += `----------------------------------------------------------\n`;
      
      const filename = type === 'daily' 
        ? `reporte_diario_${format((report as DailyFinancialReport).date, 'yyyy-MM-dd')}.txt`
        : `reporte_semanal_${format((report as WeeklyFinancialReport).endDate, 'yyyy-MM-dd')}.txt`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Reporte exportado",
        description: `El reporte se ha exportado como ${filename}`
      });
    } catch (error) {
      console.error('Error exporting report to TXT:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar el reporte",
        variant: "destructive"
      });
    }
  };

  const value: FinancialContextType = {
    barberCommissions,
    operationalExpenses,
    generateDailyReport,
    generateWeeklyReport,
    exportReportToTxt,
    addBarberCommission,
    updateBarberCommission,
    deleteBarberCommission,
    getBarberCommissionRate,
    addOperationalExpense,
    updateOperationalExpense,
    deleteOperationalExpense,
    getExpensesByCategory,
    getBarberFinancialSummary,
    getBarberWeeklySummary,
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
