import { supabase } from "@/integrations/supabase/client";
import { SaleType } from "@/types";

// Get active cash register
export const getActiveCashRegister = async (tenantId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('estado', 'abierta')
      .order('fecha_apertura', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error al obtener caja activa:", error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (error) {
    console.error("Error en getActiveCashRegister:", error);
    return null;
  }
};

// Open cash register
export const openCashRegister = async (
  initialAmount: number,
  cashierName: string,
  tenantId: string
): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('cajas')
      .insert([{
        monto_inicial: initialAmount,
        estado: 'abierta',
        nombre_cajero: cashierName,
        tenant_id: tenantId,
        fecha_apertura: new Date().toISOString(),
        hora_apertura: new Date().toLocaleTimeString()
      }])
      .select();

    if (error) {
      console.error("Error al abrir caja:", error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (error) {
    console.error("Error en openCashRegister:", error);
    return null;
  }
};

// Close cash register
export const closeCashRegister = async (
  cajaId: string,
  finalAmount: number,
  observations?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cajas')
      .update({
        monto_final: finalAmount,
        estado: 'cerrada',
        observaciones: observations || null,
        fecha_cierre: new Date().toISOString(),
        hora_cierre: new Date().toLocaleTimeString()
      })
      .eq('id', cajaId);

    if (error) {
      console.error("Error al cerrar caja:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error en closeCashRegister:", error);
    return false;
  }
};

// Get cash register history
export const getCashRegisterHistory = async (tenantId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('fecha_apertura', { ascending: false });

    if (error) {
      console.error("Error al obtener historial de cajas:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error en getCashRegisterHistory:", error);
    return [];
  }
};

// Add cash register transaction
export const addCashRegisterTransaction = async (
  cajaId: string,
  type: string,
  amount: number,
  paymentMethod: string,
  tenantId: string,
  description?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('transacciones_caja')
      .insert([{
        caja_id: cajaId,
        tipo: type,
        monto: amount,
        metodo_pago: paymentMethod,
        descripcion: description || null,
        tenant_id: tenantId,
        fecha: new Date().toISOString(),
        hora: new Date().toLocaleTimeString()
      }]);

    if (error) {
      console.error("Error al agregar transacción de caja:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error en addCashRegisterTransaction:", error);
    return false;
  }
};

// Get cash register transactions
export const getCashRegisterTransactions = async (cajaId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('transacciones_caja')
      .select('*')
      .eq('caja_id', cajaId)
      .order('fecha', { ascending: false });

    if (error) {
      console.error("Error al obtener transacciones de caja:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error en getCashRegisterTransactions:", error);
    return [];
  }
};

// Get sales by cashier and payment method
export const getSalesByCashierAndPaymentMethod = async (tenantId: string): Promise<any> => {
  try {
    // For now use a direct query instead of RPC since we need to fix the parameters
    const { data, error } = await supabase
      .from('sales')
      .select('cashier_name, payment_method, total')
      .eq('tenant_id', tenantId);

    if (error) {
      console.error("Error al obtener ventas por cajero:", error);
      return {};
    }

    // Convert the array of objects into the desired nested object structure
    const result: any = {};
    data.forEach((item: any) => {
      const cashier = item.cashier_name || 'Unknown';
      const method = item.payment_method || 'efectivo';
      
      if (!result[cashier]) {
        result[cashier] = {};
      }
      
      if (!result[cashier][method]) {
        result[cashier][method] = {
          total: 0,
          count: 0,
        };
      }
      
      result[cashier][method].total += Number(item.total) || 0;
      result[cashier][method].count += 1;
    });

    return result;
  } catch (error) {
    console.error("Error en getSalesByCashierAndPaymentMethod:", error);
    return {};
  }
};

// Get cashier sales
export const getCashierSales = async (
  cashierName: string,
  tenantId: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> => {
  try {
    // Use direct query instead of RPC
    let query = supabase
      .from('sales')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('cashier_name', cashierName);
    
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error("Error al obtener ventas del cajero:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error en getCashierSales:", error);
    return [];
  }
};

// Get cash register sales by payment method
export const getCashRegisterSalesByPaymentMethod = async (cajaId: string): Promise<any> => {
  try {
    // Fetch transactions for the cash register
    const { data: transactions, error: transactionsError } = await supabase
      .from('transacciones_caja')
      .select('*')
      .eq('caja_id', cajaId);

    if (transactionsError) {
      console.error("Error fetching cash register transactions:", transactionsError);
      return {};
    }

    // Aggregate sales by payment method
    const salesByMethod: { [key: string]: { count: number; total: number } } = {};

    transactions?.forEach(transaction => {
      if (transaction.tipo === 'venta') {
        const method = transaction.metodo_pago || 'efectivo';
        if (!salesByMethod[method]) {
          salesByMethod[method] = { count: 0, total: 0 };
        }
        salesByMethod[method].count += 1;
        salesByMethod[method].total += transaction.monto;
      }
    });

    return salesByMethod;
  } catch (error) {
    console.error("Error in getCashRegisterSalesByPaymentMethod:", error);
    return {};
  }
};

// Get current user tenant ID
export const getCurrentUserTenantId = async (): Promise<string> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error("No authenticated user");
    }
    
    return sessionData.session.user.app_metadata.tenant_id || "";
  } catch (error) {
    console.error("Error getting current user tenant ID:", error);
    return "";
  }
};
