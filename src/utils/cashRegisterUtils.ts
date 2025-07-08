
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface CashRegisterEntry {
  id: string;
  fecha: string;
  hora: string;
  tipo: 'ingreso' | 'egreso' | 'venta';
  monto: number;
  metodo_pago: string;
  descripcion?: string;
  caja_id: string;
  tenant_id: string;
}

export interface CashRegisterSummary {
  ingresos: number;
  egresos: number;
  ventas: number;
  total: number;
}

export interface CashierStats {
  cashierName: string;
  totalSales: number;
  salesCount: number;
  paymentMethods: Record<string, { amount: number; count: number }>;
}

export const getCurrentUserTenantId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');
  } catch (error) {
    console.error("Error getting current user tenant ID:", error);
    return null;
  }
};

export const addCashRegisterEntry = async (entry: Omit<CashRegisterEntry, 'id' | 'tenant_id'>): Promise<boolean> => {
  try {
    const tenantId = await getCurrentUserTenantId();
    if (!tenantId) {
      console.error("No tenant ID available");
      return false;
    }

    const { error } = await supabase
      .from('transacciones_caja')
      .insert({
        ...entry,
        tenant_id: tenantId
      });

    if (error) {
      console.error("Error adding cash register entry:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in addCashRegisterEntry:", error);
    return false;
  }
};

export const getCashRegisterEntries = async (cajaId: string): Promise<CashRegisterEntry[]> => {
  try {
    const tenantId = await getCurrentUserTenantId();
    if (!tenantId) {
      console.error("No tenant ID available");
      return [];
    }

    const { data, error } = await supabase
      .from('transacciones_caja')
      .select('*')
      .eq('caja_id', cajaId)
      .eq('tenant_id', tenantId)
      .order('fecha', { ascending: false });

    if (error) {
      console.error("Error getting cash register entries:", error);
      return [];
    }

    // Transform data to match the interface, ensuring tipo is properly typed
    return (data || []).map(item => ({
      ...item,
      tipo: item.tipo as 'ingreso' | 'egreso' | 'venta'
    }));
  } catch (error) {
    console.error("Error in getCashRegisterEntries:", error);
    return [];
  }
};

export const getCashRegisterSummary = async (cajaId: string): Promise<CashRegisterSummary> => {
  try {
    const entries = await getCashRegisterEntries(cajaId);
    
    const summary = entries.reduce((acc, entry) => {
      switch (entry.tipo) {
        case 'ingreso':
          acc.ingresos += entry.monto;
          break;
        case 'egreso':
          acc.egresos += entry.monto;
          break;
        case 'venta':
          acc.ventas += entry.monto;
          break;
      }
      return acc;
    }, { ingresos: 0, egresos: 0, ventas: 0, total: 0 });

    summary.total = summary.ingresos + summary.ventas - summary.egresos;
    
    return summary;
  } catch (error) {
    console.error("Error getting cash register summary:", error);
    return { ingresos: 0, egresos: 0, ventas: 0, total: 0 };
  }
};

export const getCashierStats = async (cashierName: string, startDate?: string, endDate?: string): Promise<CashierStats> => {
  try {
    const tenantId = await getCurrentUserTenantId();
    if (!tenantId) {
      console.error("No tenant ID available");
      return {
        cashierName,
        totalSales: 0,
        salesCount: 0,
        paymentMethods: {}
      };
    }

    const { data, error } = await supabase
      .rpc('get_cashier_sales_summary', {
        cashier_name_param: cashierName,
        tenant_id_param: tenantId,
        start_date_param: startDate || null,
        end_date_param: endDate || null
      });

    if (error) {
      console.error("Error getting cashier stats:", error);
      return {
        cashierName,
        totalSales: 0,
        salesCount: 0,
        paymentMethods: {}
      };
    }

    const paymentMethods: Record<string, { amount: number; count: number }> = {};
    let totalSales = 0;
    let salesCount = 0;

    if (data && Array.isArray(data)) {
      data.forEach((row: any) => {
        const method = row.payment_method || 'efectivo';
        const amount = Number(row.total_amount) || 0;
        const count = Number(row.sale_count) || 0;
        
        paymentMethods[method] = { amount, count };
        totalSales += amount;
        salesCount += count;
      });
    }

    return {
      cashierName,
      totalSales,
      salesCount,
      paymentMethods
    };
  } catch (error) {
    console.error("Error in getCashierStats:", error);
    return {
      cashierName,
      totalSales: 0,
      salesCount: 0,
      paymentMethods: {}
    };
  }
};

export const getSalesByPaymentMethod = async (startDate?: string, endDate?: string): Promise<Record<string, { amount: number; count: number }>> => {
  try {
    const tenantId = await getCurrentUserTenantId();
    if (!tenantId) {
      console.error("No tenant ID available");
      return {};
    }

    const { data, error } = await supabase
      .rpc('get_sales_by_payment_method', {
        tenant_id_param: tenantId,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null
      });

    if (error) {
      console.error("Error getting sales by payment method:", error);
      return {};
    }

    const result: Record<string, { amount: number; count: number }> = {};
    
    if (data && Array.isArray(data)) {
      data.forEach((row: any) => {
        const method = row.payment_method || 'efectivo';
        result[method] = {
          amount: Number(row.total) || 0,
          count: Number(row.count) || 0
        };
      });
    }

    return result;
  } catch (error) {
    console.error("Error in getSalesByPaymentMethod:", error);
    return {};
  }
};

// Missing exports - Adding them here
export const getAllCashiers = async (tenantId: string) => {
  try {
    const { data, error } = await supabase
      .from('cashiers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting cashiers:", error);
    return [];
  }
};

export const addCashier = async (tenantId: string, name: string) => {
  try {
    const { data, error } = await supabase
      .from('cashiers')
      .insert({ name, tenant_id: tenantId })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding cashier:", error);
    return null;
  }
};

export const updateCashier = async (id: string, name: string) => {
  try {
    const { data, error } = await supabase
      .from('cashiers')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating cashier:", error);
    return null;
  }
};

export const deleteCashier = async (id: string) => {
  try {
    const { error } = await supabase
      .from('cashiers')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting cashier:", error);
    return false;
  }
};

export const registerCashier = async (name: string, tenantId: string) => {
  return await addCashier(tenantId, name);
};

export const getActiveCashRegister = async (tenantId: string) => {
  try {
    const { data, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('estado', 'abierta')
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error("Error getting active cash register:", error);
    return null;
  }
};

export const openCashRegister = async (tenantId: string, cajeroNombre: string, montoInicial: number) => {
  try {
    const { data, error } = await supabase
      .from('cajas')
      .insert({
        tenant_id: tenantId,
        nombre_cajero: cajeroNombre,
        monto_inicial: montoInicial,
        estado: 'abierta'
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error opening cash register:", error);
    return null;
  }
};

export const closeCashRegister = async (cajaId: string, montoFinal: number, observaciones?: string) => {
  try {
    const { data, error } = await supabase
      .from('cajas')
      .update({
        estado: 'cerrada',
        monto_final: montoFinal,
        fecha_cierre: new Date().toISOString(),
        observaciones
      })
      .eq('id', cajaId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error closing cash register:", error);
    return null;
  }
};

export const calculateCashRegisterBalance = async (cajaId: string) => {
  const summary = await getCashRegisterSummary(cajaId);
  return summary.total;
};

export const getCashRegisterTransactions = async (cajaId: string) => {
  return await getCashRegisterEntries(cajaId);
};

export const addCashRegisterTransaction = async (transaction: Omit<CashRegisterEntry, 'id' | 'tenant_id'>) => {
  return await addCashRegisterEntry(transaction);
};

export const getCashRegisterStatistics = async (tenantId: string) => {
  try {
    const { data, error } = await supabase
      .from('transacciones_caja')
      .select('*')
      .eq('tenant_id', tenantId);
      
    if (error) throw error;
    
    const stats = {
      totalTransactions: data?.length || 0,
      totalIngresos: 0,
      totalEgresos: 0,
      totalVentas: 0
    };
    
    data?.forEach(transaction => {
      switch (transaction.tipo) {
        case 'ingreso':
          stats.totalIngresos += transaction.monto;
          break;
        case 'egreso':
          stats.totalEgresos += transaction.monto;
          break;
        case 'venta':
          stats.totalVentas += transaction.monto;
          break;
      }
    });
    
    return stats;
  } catch (error) {
    console.error("Error getting cash register statistics:", error);
    return {
      totalTransactions: 0,
      totalIngresos: 0,
      totalEgresos: 0,
      totalVentas: 0
    };
  }
};

export const getSalesByCashier = async (cashierName: string, tenantId: string) => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('cashier_name', cashierName)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting sales by cashier:", error);
    return [];
  }
};

export const getTurnoStats = async (turnoId: string) => {
  try {
    const { data, error } = await supabase
      .from('turno_transacciones')
      .select('*')
      .eq('turno_id', turnoId);
      
    if (error) throw error;
    
    const stats = {
      totalVentas: 0,
      totalIngresos: 0,
      totalEgresos: 0,
      transactionCount: data?.length || 0
    };
    
    data?.forEach(transaction => {
      switch (transaction.tipo) {
        case 'venta':
          stats.totalVentas += transaction.monto;
          break;
        case 'ingreso':
          stats.totalIngresos += transaction.monto;
          break;
        case 'egreso':
          stats.totalEgresos += transaction.monto;
          break;
      }
    });
    
    return stats;
  } catch (error) {
    console.error("Error getting turno stats:", error);
    return {
      totalVentas: 0,
      totalIngresos: 0,
      totalEgresos: 0,
      transactionCount: 0
    };
  }
};

// Additional utility functions for better cash register management
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
};

export const formatDateOnly = (date: string): string => {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
};
