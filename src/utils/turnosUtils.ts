import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { RPCDefinitions } from '@/types/supabase-rpc';

// Function to get the current user's tenant ID
const getCurrentUserTenantId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');
  } catch (error) {
    console.error("Error getting current user tenant ID:", error);
    return null;
  }
};

// Cache for the current cashier
let currentCashierCache: any = null;
let cacheTTL = 60000; // 1 minute
let cacheTime = 0;

// Function to save cashier info to sessionStorage
export const saveCashierInfo = (name: string, startTime: string) => {
  try {
    sessionStorage.setItem('currentCashier', JSON.stringify({
      name,
      startTime,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Error saving cashier info to session storage:', e);
  }
};

// Function to get cashier info from sessionStorage
export const getCashierInfoFromSession = () => {
  try {
    const data = sessionStorage.getItem('currentCashier');
    if (!data) return null;
    
    const cashierInfo = JSON.parse(data);
    // Check if the cache is still valid (less than TTL)
    if (Date.now() - cashierInfo.timestamp < cacheTTL) {
      return {
        name: cashierInfo.name,
        startTime: cashierInfo.startTime
      };
    }
    return null;
  } catch (e) {
    console.error('Error reading cashier info from session storage:', e);
    return null;
  }
};

// Function to clear cashier info from sessionStorage
export const clearCashierInfo = () => {
  try {
    sessionStorage.removeItem('currentCashier');
    currentCashierCache = null;
  } catch (e) {
    console.error('Error clearing cashier info from session storage:', e);
  }
};

// Fetch turnos from the database
export const getTurnos = async (tenantId: string) => {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('fecha_apertura', { ascending: false });
      
    if (error) {
      console.error('Error fetching turnos:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTurnos:', error);
    return [];
  }
};

// Get active turno for a tenant
export const getTurnoActivo = async (tenantId: string) => {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('estado', 'abierto')
      .order('fecha_apertura', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No active turno found
        return null;
      }
      console.error('Error fetching active turno:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getTurnoActivo:', error);
    return null;
  }
};

// Check if current cashier has an active turno
export const getCurrentCashier = () => {
  // First check the cache
  if (currentCashierCache && Date.now() - cacheTime < cacheTTL) {
    return currentCashierCache;
  }
  
  // Then check sessionStorage
  const sessionData = getCashierInfoFromSession();
  if (sessionData) {
    currentCashierCache = sessionData;
    cacheTime = Date.now();
    return sessionData;
  }
  
  return null;
};

// Open a new turno
export const abrirTurno = async (
  cajeroNombre: string, 
  montoInicial: number,
  tenantId?: string,
  observaciones?: string
) => {
  try {
    if (!tenantId) {
      const userTenantId = await getCurrentUserTenantId();
      
      if (!userTenantId) {
        console.error('No tenant ID available');
        return null;
      }
      tenantId = userTenantId;
    }
    
    // Check if there is already an active turno for this cashier
    const activeTurno = await getTurnoActivo(tenantId);
    if (activeTurno && activeTurno.cajero_nombre === cajeroNombre) {
      console.warn('This cashier already has an active turno');
      return activeTurno;
    }
    
    const { data, error } = await supabase
      .from('turnos')
      .insert({
        cajero_nombre: cajeroNombre,
        monto_inicial: montoInicial,
        estado: 'abierto',
        tenant_id: tenantId,
        observaciones: observaciones
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error opening turno:', error);
      return null;
    }
    
    // Save cashier info to session storage
    saveCashierInfo(cajeroNombre, data.fecha_apertura);
    
    return data;
  } catch (error) {
    console.error('Error in abrirTurno:', error);
    return null;
  }
};

// Close a turno
export const cerrarTurno = async (
  turnoId: string, 
  montoFinal: number,
  observaciones?: string
) => {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .update({
        monto_final: montoFinal,
        fecha_cierre: new Date().toISOString(),
        estado: 'cerrado',
        observaciones: observaciones || null
      })
      .eq('id', turnoId)
      .select()
      .single();
      
    if (error) {
      console.error('Error closing turno:', error);
      return null;
    }
    
    // Clear cashier info from session storage
    clearCashierInfo();
    
    return data;
  } catch (error) {
    console.error('Error in cerrarTurno:', error);
    return null;
  }
};

// Get turno by ID
export const getTurnoById = async (turnoId: string) => {
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id', turnoId)
      .single();
      
    if (error) {
      console.error('Error fetching turno by ID:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getTurnoById:', error);
    return null;
  }
};

// Get transactions for a turno
export const getTurnoTransacciones = async (turnoId: string) => {
  try {
    const { data, error } = await supabase
      .from('turno_transacciones')
      .select('*')
      .eq('turno_id', turnoId)
      .order('fecha', { ascending: false });
      
    if (error) {
      console.error('Error fetching turno transactions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTurnoTransacciones:', error);
    return [];
  }
};

// Calculate turno balance
export const calcularBalanceTurno = async (turnoId: string) => {
  try {
    const turno = await getTurnoById(turnoId);
    if (!turno) return null;
    
    const transacciones = await getTurnoTransacciones(turnoId);
    
    let balance = Number(turno.monto_inicial) || 0;
    
    // Group transactions by tipo and metodo_pago
    const summary: Record<string, Record<string, number>> = {
      ingreso: {},
      egreso: {},
      venta: {}
    };
    
    transacciones.forEach(trans => {
      const tipo = trans.tipo;
      const metodoPago = trans.metodo_pago || 'efectivo';
      const monto = Number(trans.monto);
      
      if (!summary[tipo]) {
        summary[tipo] = {};
      }
      
      if (!summary[tipo][metodoPago]) {
        summary[tipo][metodoPago] = 0;
      }
      
      summary[tipo][metodoPago] += monto;
      
      // Update balance for cash transactions
      if (metodoPago === 'efectivo') {
        if (tipo === 'ingreso' || tipo === 'venta') {
          balance += monto;
        } else if (tipo === 'egreso') {
          balance -= monto;
        }
      }
    });
    
    return {
      balance,
      summary
    };
  } catch (error) {
    console.error('Error in calcularBalanceTurno:', error);
    return null;
  }
};

// Add a transaction to a turno
export const agregarTransaccionTurno = async (
  transaction: {
    turno_id: string;
    tipo: 'ingreso' | 'egreso' | 'venta';
    monto: number;
    metodo_pago: string;
    descripcion?: string;
    venta_id?: string;
  }
) => {
  try {
    const tenantId = await getCurrentUserTenantId();
    
    if (!tenantId) {
      console.error('No tenant ID available');
      return false;
    }
    
    const { error } = await supabase
      .from('turno_transacciones')
      .insert({
        ...transaction,
        tenant_id: tenantId,
        fecha: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error adding turno transaction:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in agregarTransaccionTurno:', error);
    return false;
  }
};

// Get current cashier's sales totals
export const getCurrentCashierSalesTotals = async () => {
  try {
    const cashier = getCurrentCashier();
    if (!cashier) return {
      totalSales: 0,
      byPaymentMethod: {}
    };
    
    const tenantId = await getCurrentUserTenantId();
    if (!tenantId) return {
      totalSales: 0,
      byPaymentMethod: {}
    };
    
    const activeTurno = await getTurnoActivo(tenantId);
    if (!activeTurno) return {
      totalSales: 0,
      byPaymentMethod: {}
    };
    
    // Get sales totals for this turno
    const result = await getTurnoSalesByPaymentMethod(activeTurno.id);
    return result;
  } catch (error) {
    console.error('Error in getCurrentCashierSalesTotals:', error);
    return {
      totalSales: 0,
      byPaymentMethod: {}
    };
  }
};

// Get sales by payment method for a specific turno
export const getTurnoSalesByPaymentMethod = async (turnoId: string) => {
  try {
    // Use the RPC function with the correct type
    const { data, error } = await supabase.rpc(
      'get_turno_sales_by_payment_method', 
      { turno_id_param: turnoId }
    );
    
    if (error) {
      console.error('Error getting turno sales by payment method:', error);
      return {
        totalSales: 0,
        byPaymentMethod: {}
      };
    }
    
    // Transform the data into the expected format
    const byPaymentMethod: Record<string, number> = {};
    let totalSales = 0;
    
    if (data && Array.isArray(data)) {
      data.forEach((row) => {
        const method = row.payment_method;
        const amount = Number(row.total);
        byPaymentMethod[method] = amount;
        totalSales += amount;
      });
    }
    
    return {
      totalSales,
      byPaymentMethod
    };
  } catch (error) {
    console.error('Error in getTurnoSalesByPaymentMethod:', error);
    return {
      totalSales: 0,
      byPaymentMethod: {}
    };
  }
};

// Fix missing tenant_id in turnos
export const fixMissingTurnoTenantIds = async (tenantId: string) => {
  try {
    const { data: turnosWithoutTenant, error: fetchError } = await supabase
      .from('turnos')
      .select('id')
      .is('tenant_id', null);
      
    if (fetchError) {
      console.error('Error fetching turnos without tenant_id:', fetchError);
      return { fixed: 0, total: 0 };
    }
    
    if (!turnosWithoutTenant || turnosWithoutTenant.length === 0) {
      return { fixed: 0, total: 0 };
    }
    
    console.log(`Found ${turnosWithoutTenant.length} turnos without tenant_id`);
    
    const updates = turnosWithoutTenant.map(async (turno) => {
      const { error } = await supabase
        .from('turnos')
        .update({ tenant_id: tenantId })
        .eq('id', turno.id);
      
      if (error) {
        console.error(`Error updating turno ${turno.id}:`, error);
        return false;
      }
      return true;
    });
    
    const results = await Promise.all(updates);
    const fixedCount = results.filter(Boolean).length;
    
    return { fixed: fixedCount, total: turnosWithoutTenant.length };
  } catch (error) {
    console.error('Error in fixMissingTurnoTenantIds:', error);
    return { fixed: 0, total: 0 };
  }
};

// Fix the RPC call with incorrect parameters
export const getTurnoSummary = async (turnoId: string) => {
  try {
    if (!turnoId) {
      console.error('No turno ID provided for summary');
      return null;
    }
    
    // Get sales stats for this turno
    const { data, error } = await supabase.rpc(
      'get_turno_sales_by_payment_method',
      { turno_id_param: turnoId }
    );
    
    if (error) {
      console.error(`Error getting turno summary for ${turnoId}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getTurnoSummary:', error);
    return null;
  }
};

// Export the function for other modules
export { getCurrentUserTenantId };
