// Tipos para la gestión financiera
export interface BarberCommission {
  id: string;
  barberId: string;
  barberName?: string;
  percentage: number;
  serviceId?: string; // Opcional: comisión específica para un servicio
  categoryId?: string; // Opcional: comisión específica para una categoría
}

export interface OperationalExpense {
  id: string;
  branchId: string;
  date: Date;
  category: 'rent' | 'utilities' | 'supplies' | 'wages' | 'maintenance' | 'marketing' | 'other';
  amount: number;
  description: string;
  recurrent: boolean;
  periodicity?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  lastPaid?: Date;
  nextDue?: Date;
}

export interface BarberFinancialSummary {
  barberId: string;
  barberName: string;
  serviceCount: number;
  totalAmount: number;
  commissionsPercentage: number;
  commissionsAmount: number;
  advancesAmount: number;
  pendingPayment: number;
  date: Date;
  branchId?: string;
}

export interface BranchFinancialSummary {
  branchId: string;
  branchName: string;
  totalSales: number;
  totalCommissions: number;
  totalExpenses: number;
  netProfit: number;
  barberSummaries: BarberFinancialSummary[];
  date: Date;
}

export interface WeeklyFinancialReport {
  startDate: Date;
  endDate: Date;
  barberSummaries: BarberFinancialSummary[];
  branchSummaries: BranchFinancialSummary[];
  totalSales: number;
  totalCommissions: number;
  totalExpenses: number;
  netProfit: number;
}

export interface DailyFinancialReport {
  date: Date;
  barberSummaries: BarberFinancialSummary[];
  branchSummaries: BranchFinancialSummary[];
  totalSales: number;
  totalCommissions: number;
  totalExpenses: number;
  netProfit: number;
}

// Actualizar enum para coincidir exactamente con la base de datos
export enum ExpenseCategory {
  RENT = 'rent',
  UTILITIES = 'utilities', 
  SUPPLIES = 'supplies',
  WAGES = 'wages',
  MAINTENANCE = 'maintenance',
  MARKETING = 'marketing',
  OTHER = 'other'
}

// Helper enum para periodicidad de gastos
export enum ExpensePeriodicity {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}
