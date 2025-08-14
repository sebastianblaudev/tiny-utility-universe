import { supabase } from "@/integrations/supabase/client";
import { validateTenantAccess, getCurrentTenantIdSafe, logTenantSecurityEvent } from "./tenantValidator";

export const getTurnoActivo = async (tenantId: string) => {
  if (!tenantId) {
    console.error("No tenant ID provided for getTurnoActivo");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('estado', 'abierto')
      .single();
      
    if (error) {
      console.error("Error fetching active turno:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getTurnoActivo:", error);
    return null;
  }
};

export const closeTurno = async (turnoId: string, montoFinal: number, observaciones: string) => {
  try {
    const tenantId = await getCurrentTenantIdSafe();
    if (!tenantId) {
      console.error("No tenant ID found for closeTurno");
      return false;
    }

    const { error } = await supabase
      .from('turnos')
      .update({ 
        estado: 'cerrado', 
        fecha_cierre: new Date().toISOString(),
        monto_final: montoFinal,
        observaciones: observaciones
      })
      .eq('id', turnoId)
      .eq('tenant_id', tenantId);
      
    if (error) {
      console.error("Error closing turno:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in closeTurno:", error);
    return false;
  }
};

// Alias for backward compatibility
export const cerrarTurno = closeTurno;

export const openTurno = async (cajeroNombre: string, montoInicial: number, tenantId: string, cajeroId?: string) => {
  try {
    if (!tenantId) {
      console.error("No tenant ID found for openTurno");
      return null;
    }

    const { data, error } = await supabase
      .from('turnos')
      .insert({
        cajero_id: cajeroId,
        cajero_nombre: cajeroNombre,
        monto_inicial: montoInicial,
        fecha_apertura: new Date().toISOString(),
        estado: 'abierto',
        tenant_id: tenantId
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error opening turno:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in openTurno:", error);
    return null;
  }
};

// Alias for backward compatibility  
export const abrirTurno = openTurno;

export const getTurnoById = async (turnoId: string) => {
  try {
    const tenantId = await getCurrentTenantIdSafe();
    if (!tenantId) {
      console.error("No tenant ID found for getTurnoById");
      return null;
    }

    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id', turnoId)
      .eq('tenant_id', tenantId)
      .single();
      
    if (error) {
      console.error("Error fetching turno by ID:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getTurnoById:", error);
    return null;
  }
};

export const getTurnosByCashier = async (cajeroId: string) => {
  try {
    const tenantId = await getCurrentTenantIdSafe();
    if (!tenantId) {
      console.error("No tenant ID found for getTurnosByCashier");
      return [];
    }

    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('cajero_id', cajeroId)
      .eq('tenant_id', tenantId)
      .order('fecha_apertura', { ascending: false });
      
    if (error) {
      console.error("Error fetching turnos by cashier:", error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error in getTurnosByCashier:", error);
    return [];
  }
};

export const getAllTurnos = async () => {
  try {
    const tenantId = await getCurrentTenantIdSafe();
    if (!tenantId) {
      console.error("No tenant ID found for getAllTurnos");
      return [];
    }

    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('fecha_apertura', { ascending: false });
      
    if (error) {
      console.error("Error fetching all turnos:", error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error in getAllTurnos:", error);
    return [];
  }
};

// Alias for backward compatibility
export const getTurnos = getAllTurnos;

export const getCurrentCashier = () => {
  try {
    const userResponse = supabase.auth.getUser();
    
    // Since getUser() returns a Promise, we need to handle it differently
    // For synchronous usage, we'll get from session storage or return a default
    const cashierName = sessionStorage.getItem('cashier_name');
    const cashierStartTime = sessionStorage.getItem('cashier_start_time');
    
    if (cashierName && cashierStartTime) {
      return {
        id: 'session-cashier',
        name: cashierName,
        email: '',
        startTime: cashierStartTime,
        tenantId: localStorage.getItem('current_tenant_id') || '',
        active: true
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error in getCurrentCashier:", error);
    return null;
  }
};

export const saveCashierInfo = (name: string, startTime: string) => {
  try {
    sessionStorage.setItem('cashier_name', name);
    sessionStorage.setItem('cashier_start_time', startTime);
  } catch (error) {
    console.error("Error saving cashier info:", error);
  }
};

export const clearCashierInfo = () => {
  try {
    sessionStorage.removeItem('cashier_name');
    sessionStorage.removeItem('cashier_start_time');
  } catch (error) {
    console.error("Error clearing cashier info:", error);
  }
};

export const getCurrentCashierSalesTotals = async () => {
  const currentCashier = getCurrentCashier();
  if (!currentCashier || !currentCashier.tenantId) {
    return {
      totalSales: 0,
      byPaymentMethod: {}
    };
  }

  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // Get regular sales for current cashier
    const { data: regularSales, error: salesError } = await supabase
      .from('sales')
      .select('payment_method, total')
      .eq('tenant_id', currentCashier.tenantId)
      .eq('cashier_name', currentCashier.name)
      .eq('status', 'completed')
      .gte('date', startOfDay)
      .lte('date', endOfDay)
      .neq('payment_method', 'mixed')
      .not('payment_method', 'is', null);

    if (salesError) {
      console.error('Error fetching regular sales:', salesError);
      return { totalSales: 0, byPaymentMethod: {} };
    }

    // Get mixed payment methods for current cashier
    const { data: mixedPayments, error: mixedError } = await supabase
      .from('sale_payment_methods')
      .select(`
        payment_method,
        amount,
        sales!inner(cashier_name, date, status, tenant_id)
      `)
      .eq('tenant_id', currentCashier.tenantId);

    if (mixedError) {
      console.error('Error fetching mixed payments:', mixedError);
    }

    // Process results
    const paymentTotals: Record<string, number> = {};
    let totalSales = 0;

    // Process regular sales
    regularSales?.forEach(sale => {
      const method = sale.payment_method || 'cash';
      if (!paymentTotals[method]) {
        paymentTotals[method] = 0;
      }
      paymentTotals[method] += Number(sale.total);
      totalSales += Number(sale.total);
    });

    // Process mixed payments - filter by current cashier and date
    mixedPayments?.forEach((payment: any) => {
      const sale = payment.sales;
      if (sale?.cashier_name === currentCashier.name && 
          sale?.status === 'completed' &&
          sale?.date >= startOfDay && 
          sale?.date <= endOfDay) {
        
        const method = payment.payment_method;
        if (!paymentTotals[method]) {
          paymentTotals[method] = 0;
        }
        paymentTotals[method] += Number(payment.amount);
        totalSales += Number(payment.amount);
      }
    });

    return {
      totalSales,
      byPaymentMethod: paymentTotals
    };
  } catch (error) {
    console.error('Error in getCurrentCashierSalesTotals:', error);
    return {
      totalSales: 0,
      byPaymentMethod: {}
    };
  }
};

export const getTurnoSalesByPaymentMethod = async (turnoId: string) => {
  try {
    // Use the new database function that properly distributes mixed payments
    const { data, error } = await supabase
      .rpc('get_turno_sales_by_payment_method_detailed', {
        turno_id_param: turnoId
      });

    if (error) {
      console.error("Error fetching turno sales by payment method:", error);
      return { totalSales: 0, byPaymentMethod: {} };
    }

    if (!data || data.length === 0) {
      return { totalSales: 0, byPaymentMethod: {} };
    }

    // Convert the result to the expected format
    const byPaymentMethod: Record<string, number> = {};
    let totalSales = 0;

    data.forEach((item: any) => {
      const method = item.payment_method || 'cash';
      const amount = Number(item.total);
      byPaymentMethod[method] = amount;
      totalSales += amount;
    });

    return {
      totalSales,
      byPaymentMethod
    };
  } catch (error) {
    console.error("Exception in getTurnoSalesByPaymentMethod:", error);
    return { totalSales: 0, byPaymentMethod: {} };
  }
};

export const agregarTransaccionTurno = async ({ turno_id, tipo, monto, metodo_pago, descripcion, venta_id }: {
  turno_id: string;
  tipo: 'ingreso' | 'egreso' | 'venta';
  monto: number;
  metodo_pago: string;
  descripcion: string;
  venta_id?: string;
}) => {
  try {
    const tenantId = await getCurrentTenantIdSafe();
    if (!tenantId) {
      console.error("No tenant ID found for agregarTransaccionTurno");
      return null;
    }

    const { data, error } = await supabase
      .from('turno_transacciones')
      .insert({
        turno_id,
        tipo,
        monto,
        metodo_pago,
        descripcion,
        venta_id,
        tenant_id: tenantId
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error adding turno transaction:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in agregarTransaccionTurno:", error);
    return null;
  }
};

export const getTurnoTransacciones = async (turnoId: string) => {
  try {
    const tenantId = await getCurrentTenantIdSafe();
    if (!tenantId) {
      console.error("No tenant ID found for getTurnoTransacciones");
      return [];
    }

    const { data, error } = await supabase
      .from('turno_transacciones')
      .select('*')
      .eq('turno_id', turnoId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching turno transactions:", error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error in getTurnoTransacciones:", error);
    return [];
  }
};
