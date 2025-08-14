import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserTenantId } from "@/lib/supabase-helpers";

export const getCashRegisterStatistics = async (period: string) => {
  try {
    const tenantId = await getCurrentUserTenantId();
    
    if (!tenantId) {
      console.error("No tenant ID available");
      return [];
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: string;
    let endDate: string = now.toISOString();

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart.toISOString();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    }

    // Get turnos for the period
    const { data: turnos, error: turnosError } = await supabase
      .from('turnos')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('fecha_apertura', startDate)
      .lte('fecha_apertura', endDate)
      .order('fecha_apertura', { ascending: false });

    if (turnosError) {
      console.error("Error fetching turnos:", turnosError);
      return [];
    }

    if (!turnos || turnos.length === 0) {
      return [];
    }

    // Process each turno to get statistics
    const turnoStats = await Promise.all(
      turnos.map(async (turno) => {
        // Use the new database function to get payment method distribution
        const { data: paymentStats, error: paymentError } = await supabase
          .rpc('get_turno_sales_by_payment_method_detailed', {
            turno_id_param: turno.id
          });

        if (paymentError) {
          console.error("Error fetching payment stats for turno:", paymentError);
        }

        // Convert payment stats to the expected format
        const salesStats: Record<string, { total: number; count: number }> = {};
        let totalSales = 0;
        let totalCount = 0;

        if (paymentStats) {
          paymentStats.forEach((stat: any) => {
            const method = stat.payment_method || 'cash';
            salesStats[method] = {
              total: Number(stat.total),
              count: Number(stat.count)
            };
            totalSales += Number(stat.total);
            totalCount += Number(stat.count);
          });
        }

        // Get cashier information
        const cashiers: Record<string, number> = {};
        if (turno.cajero_nombre) {
          cashiers[turno.cajero_nombre] = totalCount;
        }

        return {
          id: turno.id,
          fecha_apertura: turno.fecha_apertura,
          fecha_cierre: turno.fecha_cierre,
          estado: turno.estado,
          monto_inicial: turno.monto_inicial,
          nombre_cajero: turno.cajero_nombre,
          salesStats,
          cashiers,
          totalSales,
          totalCount
        };
      })
    );

    return turnoStats;
  } catch (error) {
    console.error("Error in getCashRegisterStatistics:", error);
    return [];
  }
};

// Function to get sales by payment method using the new database function
export const getSalesByPaymentMethod = async (tenantId: string, period: string) => {
  try {
    const now = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

    switch (period) {
      case 'hoy':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'semana':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        startDate = weekStart.toISOString();
        break;
      case 'mes':
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        startDate = monthStart.toISOString();
        break;
      case 'anio':
        const yearStart = new Date(now);
        yearStart.setFullYear(now.getFullYear() - 1);
        startDate = yearStart.toISOString();
        break;
    }

    const { data, error } = await supabase.rpc('get_sales_by_payment_method', {
      tenant_id_param: tenantId,
      start_date: startDate,
      end_date: endDate
    });

    if (error) {
      console.error("Error fetching sales by payment method:", error);
      return {};
    }

    // Convert to the format expected by the components
    const result: Record<string, { total: number; count: number }> = {};
    if (data) {
      data.forEach((item: any) => {
        result[item.payment_method] = {
          total: Number(item.total),
          count: Number(item.count)
        };
      });
    }

    return result;
  } catch (error) {
    console.error("Error in getSalesByPaymentMethod:", error);
    return {};
  }
};

// Function to get sales by cashier
export const getSalesByCashier = async (tenantId: string, period: string) => {
  try {
    const now = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

    switch (period) {
      case 'hoy':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'semana':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        startDate = weekStart.toISOString();
        break;
      case 'mes':
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        startDate = monthStart.toISOString();
        break;
      case 'anio':
        const yearStart = new Date(now);
        yearStart.setFullYear(now.getFullYear() - 1);
        startDate = yearStart.toISOString();
        break;
    }

    // Get unique cashiers from sales
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('cashier_name')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .not('cashier_name', 'is', null)
      .gte('date', startDate || '1900-01-01')
      .lte('date', endDate || new Date().toISOString());

    if (salesError) {
      console.error("Error fetching cashiers:", salesError);
      return {};
    }

    const cashiers = [...new Set(sales?.map(s => s.cashier_name).filter(Boolean))];
    const result: Record<string, any> = {};

    // For each cashier, get their sales summary
    for (const cashierName of cashiers) {
      const { data: summary, error: summaryError } = await supabase.rpc('get_cashier_sales_summary', {
        cashier_name_param: cashierName,
        tenant_id_param: tenantId,
        start_date_param: startDate,
        end_date_param: endDate
      });

      if (!summaryError && summary) {
        const cashierStats: Record<string, { total: number; count: number }> = {};
        summary.forEach((stat: any) => {
          cashierStats[stat.payment_method] = {
            total: Number(stat.total_amount),
            count: Number(stat.sale_count)
          };
        });
        result[cashierName] = cashierStats;
      }
    }

    return result;
  } catch (error) {
    console.error("Error in getSalesByCashier:", error);
    return {};
  }
};

// Register a new cashier
export const registerCashier = async (name: string, tenantId: string) => {
  try {
    const { data, error } = await supabase
      .from('cashiers')
      .insert([
        {
          name: name,
          tenant_id: tenantId,
          active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error registering cashier:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in registerCashier:", error);
    return null;
  }
};

// Get all cashiers for a tenant
export const getAllCashiers = async (tenantId: string) => {
  try {
    const { data, error } = await supabase
      .from('cashiers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('name');

    if (error) {
      console.error("Error fetching cashiers:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllCashiers:", error);
    return [];
  }
};

// Add a new cashier
export const addCashier = async (name: string, tenantId: string) => {
  return await registerCashier(name, tenantId);
};

// Update a cashier
export const updateCashier = async (id: string, name: string) => {
  try {
    const { data, error } = await supabase
      .from('cashiers')
      .update({ name: name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating cashier:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in updateCashier:", error);
    return null;
  }
};

// Delete a cashier (soft delete by setting active to false)
export const deleteCashier = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('cashiers')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error deleting cashier:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in deleteCashier:", error);
    return null;
  }
};

// Cash register functions (placeholders - these would need to be implemented based on your cash register table structure)
export const getActiveCashRegister = async (tenantId: string) => {
  try {
    const { data, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('estado', 'abierta')
      .order('fecha_apertura', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching active cash register:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getActiveCashRegister:", error);
    return null;
  }
};

export const openCashRegister = async (tenantId: string, cajeroNombre: string, montoInicial: number) => {
  try {
    const { data, error } = await supabase
      .from('cajas')
      .insert([
        {
          nombre_cajero: cajeroNombre,
          monto_inicial: montoInicial,
          tenant_id: tenantId,
          estado: 'abierta'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error opening cash register:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in openCashRegister:", error);
    return null;
  }
};

export const closeCashRegister = async (cajaId: string, montoFinal: number, observaciones?: string) => {
  try {
    const { data, error } = await supabase
      .from('cajas')
      .update({
        estado: 'cerrada',
        fecha_cierre: new Date().toISOString(),
        monto_final: montoFinal,
        observaciones: observaciones
      })
      .eq('id', cajaId)
      .select()
      .single();

    if (error) {
      console.error("Error closing cash register:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in closeCashRegister:", error);
    return null;
  }
};

export const getCashRegisterTransactions = async (cajaId: string) => {
  try {
    const { data, error } = await supabase
      .from('transacciones_caja')
      .select('*')
      .eq('caja_id', cajaId)
      .order('fecha', { ascending: false });

    if (error) {
      console.error("Error fetching cash register transactions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCashRegisterTransactions:", error);
    return [];
  }
};

export const addCashRegisterTransaction = async (transactionData: {
  caja_id: string;
  tipo: 'ingreso' | 'egreso' | 'venta';
  monto: number;
  metodo_pago: string;
  descripcion: string;
  fecha: string;
  hora: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('transacciones_caja')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error("Error adding cash register transaction:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in addCashRegisterTransaction:", error);
    return null;
  }
};

export const calculateCashRegisterBalance = async (cajaId: string) => {
  try {
    const transactions = await getCashRegisterTransactions(cajaId);
    
    let balance = 0;
    transactions.forEach(transaction => {
      if (transaction.tipo === 'ingreso') {
        balance += transaction.monto;
      } else if (transaction.tipo === 'egreso') {
        balance -= transaction.monto;
      }
    });

    return balance;
  } catch (error) {
    console.error("Error in calculateCashRegisterBalance:", error);
    return 0;
  }
};

// Get turno stats (placeholder)
export const getTurnoStats = async (turnoId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_turno_sales_by_payment_method_detailed', {
        turno_id_param: turnoId
      });

    if (error) {
      console.error("Error fetching turno stats:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getTurnoStats:", error);
    return null;
  }
};
