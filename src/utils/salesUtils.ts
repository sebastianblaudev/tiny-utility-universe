
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTurnoActivo, getCurrentCashier } from "./turnosUtils";
import { validateTenantAccess, getCurrentTenantIdSafe, logTenantSecurityEvent } from "./tenantValidator";

export const updateMissingSaleTenantIds = async (tenantId: string | null, onComplete?: () => void) => {
  // Less restrictive validation - allow if tenantId exists
  if (!tenantId) {
    console.error("No tenant ID provided for updateMissingSaleTenantIds");
    return;
  }
  
  try {
    const { data: missingSales, error: fetchError } = await supabase
      .from("sales")
      .select("id")
      .is("tenant_id", null);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!missingSales || missingSales.length === 0) {
      console.log("No hay ventas sin ID de negocio");
      return;
    }
    
    console.log(`Found ${missingSales.length} sales without tenant ID`);
    
    const updates = missingSales.map(async (sale) => {
      const { error } = await supabase
        .from("sales")
        .update({ tenant_id: tenantId })
        .eq("id", sale.id);
      
      if (error) {
        console.error(`Error updating sale ${sale.id}:`, error);
        return false;
      }
      return true;
    });
    
    await Promise.all(updates);
    console.log(`Se actualizaron ${missingSales.length} ventas automáticamente`);
    
    if (onComplete) {
      onComplete();
    }
  } catch (error) {
    console.error("Error updating sales:", error);
  }
};

export const associateSaleWithActiveTurno = async (saleId: string, cashierName: string, tenantId: string) => {
  if (!tenantId) {
    console.error("No tenant ID provided for associateSaleWithActiveTurno");
    return false;
  }

  try {
    if (!saleId || !tenantId) {
      console.error("Missing sale ID or tenant ID");
      return false;
    }

    const activeTurno = await getTurnoActivo(tenantId);
    
    if (!activeTurno) {
      console.log("No active turno found for tenant", tenantId);
      return false;
    }

    if (activeTurno.cajero_nombre !== cashierName) {
      console.log(`Cashier mismatch: sale's cashier is ${cashierName}, turno's cashier is ${activeTurno.cajero_nombre}`);
      return false;
    }

    const { error } = await supabase
      .from('sales')
      .update({ turno_id: activeTurno.id })
      .eq('id', saleId)
      .eq('tenant_id', tenantId);
      
    if (error) {
      console.error("Error associating sale with turno:", error);
      return false;
    }
    
    console.log(`Sale ${saleId} successfully associated with turno ${activeTurno.id}`);
    return true;
  } catch (error) {
    console.error("Error in associateSaleWithActiveTurno:", error);
    return false;
  }
};

export const fixMissingSaleTurnoIds = async (tenantId: string) => {
  if (!tenantId) {
    console.error("No tenant ID provided for fixMissingSaleTurnoIds");
    return { fixed: 0, total: 0 };
  }

  try {
    const { data: missingSales, error: fetchError } = await supabase
      .from('sales')
      .select('id, cashier_name, date')
      .is('turno_id', null)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });
      
    if (fetchError) {
      console.error("Error fetching sales without turno_id:", fetchError);
      return { fixed: 0, total: 0 };
    }
    
    if (!missingSales || missingSales.length === 0) {
      return { fixed: 0, total: 0 };
    }
    
    console.log(`Found ${missingSales.length} sales without turno_id`);
    
    const { data: turnos, error: turnosError } = await supabase
      .from('turnos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('fecha_apertura', { ascending: false });
      
    if (turnosError) {
      console.error("Error fetching turnos:", turnosError);
      return { fixed: 0, total: missingSales.length };
    }
    
    let fixedCount = 0;
    
    for (const sale of missingSales) {
      const matchingTurno = turnos.find(turno => {
        if (turno.cajero_nombre !== sale.cashier_name) {
          return false;
        }
        
        const saleTime = new Date(sale.date).getTime();
        const turnoStart = new Date(turno.fecha_apertura).getTime();
        const turnoEnd = turno.fecha_cierre ? new Date(turno.fecha_cierre).getTime() : Date.now();
        
        return saleTime >= turnoStart && saleTime <= turnoEnd;
      });
      
      if (matchingTurno) {
        const { error } = await supabase
          .from('sales')
          .update({ turno_id: matchingTurno.id })
          .eq('id', sale.id)
          .eq('tenant_id', tenantId);
          
        if (!error) {
          fixedCount++;
        }
      }
    }
    
    return { fixed: fixedCount, total: missingSales.length };
  } catch (error) {
    console.error("Error in fixMissingSaleTurnoIds:", error);
    return { fixed: 0, total: 0 };
  }
};

// Dashboard functions with more resilient error handling
export const getSalesByDateRange = async (tenantId: string, startDate: string, endDate: string) => {
  if (!tenantId) {
    console.error("No tenant ID provided for getSalesByDateRange");
    return [];
  }

  try {
    console.log(`Getting sales by date range for tenant: ${tenantId}, from ${startDate} to ${endDate}`);
    
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
      
    if (error) {
      console.error("Error in getSalesByDateRange:", error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} sales for date range`);
    return data || [];
  } catch (error) {
    console.error("Exception in getSalesByDateRange:", error);
    return [];
  }
};

export const getRecentSales = async (tenantId: string, limit: number = 5) => {
  if (!tenantId) {
    console.error("No tenant ID provided for getRecentSales");
    return [];
  }

  try {
    console.log(`Getting recent sales for tenant: ${tenantId}, limit: ${limit}`);
    
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error in getRecentSales:", error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} recent sales`);
    return data || [];
  } catch (error) {
    console.error("Exception in getRecentSales:", error);
    return [];
  }
};

export const getLowStockProducts = async (tenantId: string) => {
  if (!tenantId) {
    console.error("No tenant ID provided for getLowStockProducts");
    return [];
  }

  try {
    console.log(`Getting low stock products for tenant: ${tenantId}`);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', tenantId)
      .lt('stock', 10)
      .order('stock', { ascending: true });
      
    if (error) {
      console.error("Error in getLowStockProducts:", error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} low stock products`);
    return data || [];
  } catch (error) {
    console.error("Exception in getLowStockProducts:", error);
    return [];
  }
};

export const getTopSellingProducts = async (tenantId: string, limit: number = 5) => {
  if (!tenantId) {
    console.error("No tenant ID provided for getTopSellingProducts");
    return [];
  }

  try {
    console.log(`Getting top selling products for tenant: ${tenantId}, limit: ${limit}`);
    
    // Use fallback approach since the RPC function doesn't exist
    const { data: saleItems, error } = await supabase
      .from('sale_items')
      .select(`
        product_id,
        quantity,
        products (
          id,
          name
        )
      `)
      .eq('tenant_id', tenantId);
      
    if (error) {
      console.error("Error in getTopSellingProducts:", error);
      return [];
    }
    
    // Aggregate by product
    const aggregated = saleItems?.reduce((acc: any, item: any) => {
      const productId = item.product_id;
      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: item.products?.name || 'Unknown',
          total_sales: 0
        };
      }
      acc[productId].total_sales += item.quantity;
      return acc;
    }, {});
    
    const result = Object.values(aggregated || {})
      .sort((a: any, b: any) => b.total_sales - a.total_sales)
      .slice(0, limit);
    
    console.log(`Found ${result.length} top selling products`);
    return result;
  } catch (error) {
    console.error("Exception in getTopSellingProducts:", error);
    return [];
  }
};
