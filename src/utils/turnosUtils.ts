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

    console.log(`🔍 Calculating cashier totals for: ${currentCashier.name} (${startOfDay} to ${endOfDay})`);

    // FIXED: Use existing RPC function that properly handles mixed payments without duplication
    const { data: totalsData, error: totalsError } = await supabase
      .rpc('get_cashier_sales_summary', {
        cashier_name_param: currentCashier.name,
        tenant_id_param: currentCashier.tenantId
      });

    if (totalsError) {
      console.error('❌ RPC function failed, falling back to manual calculation:', totalsError);
      // Fallback to manual calculation with improved logic
      return await calculateCashierTotalsManually(currentCashier, startOfDay, endOfDay);
    }

    // Process RPC results
    const paymentTotals: Record<string, number> = {};
    let totalSales = 0;

    if (totalsData && Array.isArray(totalsData)) {
      totalsData.forEach((item: any) => {
        const method = normalizePaymentMethod(item.payment_method);
        const amount = Number(item.total) || 0;
        paymentTotals[method] = amount;
        totalSales += amount;
      });
    }

    console.log(`✅ Cashier totals calculated - Total: ${totalSales}, Methods:`, paymentTotals);

    return {
      totalSales,
      byPaymentMethod: paymentTotals
    };
  } catch (error) {
    console.error('❌ Error in getCurrentCashierSalesTotals:', error);
    return {
      totalSales: 0,
      byPaymentMethod: {}
    };
  }
};

// Helper function to normalize payment method names
const normalizePaymentMethod = (method: string): string => {
  if (!method) return 'cash';
  const normalized = method.toLowerCase().trim();
  switch (normalized) {
    case 'efectivo':
    case 'cash':
      return 'cash';
    case 'tarjeta':
    case 'card':
      return 'card';
    case 'transferencia':
    case 'transfer':
      return 'transfer';
    case 'mixto':
    case 'mixed':
      return 'mixed';
    default:
      return normalized;
  }
};

// Fallback manual calculation with anti-duplication logic
const calculateCashierTotalsManually = async (
  currentCashier: any, 
  startOfDay: string, 
  endOfDay: string
) => {
  console.log('🔧 Using manual calculation fallback');
  
  const paymentTotals: Record<string, number> = {};
  let totalSales = 0;

  // Get all sales (including mixed) for current cashier
  const { data: allSales, error: salesError } = await supabase
    .from('sales')
    .select('id, payment_method, total')
    .eq('tenant_id', currentCashier.tenantId)
    .eq('cashier_name', currentCashier.name)
    .eq('status', 'completed')
    .gte('date', startOfDay)
    .lte('date', endOfDay);

  if (salesError) {
    console.error('❌ Error fetching sales:', salesError);
    return { totalSales: 0, byPaymentMethod: {} };
  }

  const processedSales = new Set<string>(); // Track processed sales to avoid duplication

  // Process direct payment sales (not mixed)
  allSales?.forEach(sale => {
    if (sale.payment_method && sale.payment_method !== 'mixed') {
      const method = normalizePaymentMethod(sale.payment_method);
      if (!paymentTotals[method]) {
        paymentTotals[method] = 0;
      }
      paymentTotals[method] += Number(sale.total);
      totalSales += Number(sale.total);
      processedSales.add(sale.id);
    }
  });

  // Get mixed payment details only for unprocessed mixed sales
  const mixedSaleIds = allSales?.filter(sale => 
    sale.payment_method === 'mixed' && !processedSales.has(sale.id)
  ).map(sale => sale.id) || [];

  if (mixedSaleIds.length > 0) {
    const { data: mixedPayments, error: mixedError } = await supabase
      .from('sale_payment_methods')
      .select('payment_method, amount, sale_id')
      .eq('tenant_id', currentCashier.tenantId)
      .in('sale_id', mixedSaleIds);

    if (!mixedError && mixedPayments) {
      // Process mixed payments
      mixedPayments.forEach(payment => {
        const method = normalizePaymentMethod(payment.payment_method);
        if (!paymentTotals[method]) {
          paymentTotals[method] = 0;
        }
        paymentTotals[method] += Number(payment.amount);
        totalSales += Number(payment.amount);
      });

      // Mark mixed sales as processed
      mixedSaleIds.forEach(id => processedSales.add(id));
    }
  }

  console.log(`🔧 Manual calculation complete - Total: ${totalSales}, Methods:`, paymentTotals);
  
  return {
    totalSales,
    byPaymentMethod: paymentTotals
  };
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
