
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTurnoActivo, getCurrentCashier } from "./turnosUtils";
import { validateTenantAccess, getCurrentTenantIdSafe, logTenantSecurityEvent, validateTenantIsolation } from "./tenantValidator";
import { validateSaleAccess } from "./salesSecurityValidator";

export const updateMissingSaleTenantIds = async (tenantId: string | null, onComplete?: () => void) => {
  // Enhanced validation with security checks
  if (!tenantId) {
    console.error("TENANT_SECURITY_ERROR: No tenant ID provided for updateMissingSaleTenantIds");
    return;
  }
  
  // Validate tenant isolation
  const isValidIsolation = await validateTenantIsolation('UPDATE_MISSING_SALE_TENANT_IDS', tenantId);
  if (!isValidIsolation) {
    return;
  }
  
  try {
    // Only get sales that truly have no tenant_id AND belong to current user context
    const { data: missingSales, error: fetchError } = await supabase
      .from("sales")
      .select("id, total, date")
      .is("tenant_id", null);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!missingSales || missingSales.length === 0) {
      console.log("No hay ventas sin ID de negocio");
      return;
    }
    
    console.log(`Found ${missingSales.length} sales without tenant ID`);
    
    // Validate each sale before updating
    const updates = missingSales.map(async (sale) => {
      // Additional validation to ensure we're not updating cross-tenant data
      const { error } = await supabase
        .from("sales")
        .update({ tenant_id: tenantId })
        .eq("id", sale.id)
        .is("tenant_id", null); // Double-check it's still null
      
      if (error) {
        console.error(`TENANT_SECURITY_ERROR: Error updating sale ${sale.id}:`, error);
        return false;
      }
      
      logTenantSecurityEvent('SALE_TENANT_ID_UPDATED', {
        saleId: sale.id,
        tenantId: tenantId,
        timestamp: new Date().toISOString()
      });
      
      return true;
    });
    
    const results = await Promise.all(updates);
    const successCount = results.filter(Boolean).length;
    
    console.log(`Se actualizaron ${successCount} ventas con seguridad de tenant`);
    
    if (onComplete) {
      onComplete();
    }
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Error updating sales:", error);
  }
};

export const associateSaleWithActiveTurno = async (saleId: string, cashierName: string, tenantId: string) => {
  // Enhanced security validation
  if (!tenantId) {
    console.error("TENANT_SECURITY_ERROR: No tenant ID provided for associateSaleWithActiveTurno");
    return false;
  }

  if (!await validateTenantIsolation('ASSOCIATE_SALE_WITH_TURNO', tenantId)) {
    return false;
  }

  // Validate sale access
  if (!await validateSaleAccess(saleId)) {
    return false;
  }

  try {
    if (!saleId || !tenantId) {
      console.error("TENANT_SECURITY_ERROR: Missing sale ID or tenant ID");
      return false;
    }

    const activeTurno = await getTurnoActivo(tenantId);
    
    if (!activeTurno) {
      console.log("No active turno found for tenant", tenantId);
      return false;
    }

    // Validate turno belongs to current tenant
    if (activeTurno.tenant_id !== tenantId) {
      console.error("TENANT_SECURITY_ERROR: Turno tenant mismatch", {
        turnoTenant: activeTurno.tenant_id,
        currentTenant: tenantId
      });
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
      .eq('tenant_id', tenantId); // Double-check tenant isolation
      
    if (error) {
      console.error("TENANT_SECURITY_ERROR: Error associating sale with turno:", error);
      return false;
    }
    
    console.log(`Sale ${saleId} successfully associated with turno ${activeTurno.id}`);
    return true;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Error in associateSaleWithActiveTurno:", error);
    return false;
  }
};

export const fixMissingSaleTurnoIds = async (tenantId: string) => {
  if (!tenantId) {
    console.error("TENANT_SECURITY_ERROR: No tenant ID provided for fixMissingSaleTurnoIds");
    return { fixed: 0, total: 0 };
  }

  if (!await validateTenantIsolation('FIX_MISSING_SALE_TURNO_IDS', tenantId)) {
    return { fixed: 0, total: 0 };
  }

  try {
    // Enhanced query with strict tenant isolation
    const { data: missingSales, error: fetchError } = await supabase
      .from('sales')
      .select('id, cashier_name, date, tenant_id')
      .is('turno_id', null)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });
      
    if (fetchError) {
      console.error("TENANT_SECURITY_ERROR: Error fetching sales without turno_id:", fetchError);
      return { fixed: 0, total: 0 };
    }
    
    if (!missingSales || missingSales.length === 0) {
      return { fixed: 0, total: 0 };
    }
    
    // Validate all sales belong to current tenant
    const invalidSales = missingSales.filter(sale => sale.tenant_id !== tenantId);
    if (invalidSales.length > 0) {
      console.error("TENANT_SECURITY_ERROR: Found sales with wrong tenant ID", {
        count: invalidSales.length,
        expectedTenant: tenantId
      });
      return { fixed: 0, total: missingSales.length };
    }
    
    console.log(`Found ${missingSales.length} sales without turno_id for tenant ${tenantId}`);
    
    // Get turnos with strict tenant validation
    const { data: turnos, error: turnosError } = await supabase
      .from('turnos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('fecha_apertura', { ascending: false });
      
    if (turnosError) {
      console.error("TENANT_SECURITY_ERROR: Error fetching turnos:", turnosError);
      return { fixed: 0, total: missingSales.length };
    }
    
    let fixedCount = 0;
    
    for (const sale of missingSales) {
      const matchingTurno = turnos.find(turno => {
        if (turno.cajero_nombre !== sale.cashier_name) {
          return false;
        }
        
        if (turno.tenant_id !== tenantId) {
          console.error("TENANT_SECURITY_ERROR: Turno tenant mismatch during matching", {
            turnoTenant: turno.tenant_id,
            expectedTenant: tenantId
          });
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
          .eq('tenant_id', tenantId); // Ensure tenant isolation
          
        if (!error) {
          fixedCount++;
          logTenantSecurityEvent('SALE_TURNO_FIXED', {
            saleId: sale.id,
            turnoId: matchingTurno.id,
            tenantId: tenantId
          });
        } else {
          console.error("TENANT_SECURITY_ERROR: Error fixing sale turno ID:", error);
        }
      }
    }
    
    return { fixed: fixedCount, total: missingSales.length };
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Error in fixMissingSaleTurnoIds:", error);
    return { fixed: 0, total: 0 };
  }
};

// Dashboard functions with enhanced security validation
export const getSalesByDateRange = async (tenantId: string, startDate: string, endDate: string) => {
  if (!tenantId) {
    console.error("TENANT_SECURITY_ERROR: No tenant ID provided for getSalesByDateRange");
    return [];
  }

  if (!await validateTenantIsolation('GET_SALES_BY_DATE_RANGE', tenantId)) {
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
      console.error("TENANT_SECURITY_ERROR: Error in getSalesByDateRange:", error);
      return [];
    }
    
    // Validate all returned sales belong to the correct tenant
    const validSales = data?.filter(sale => sale.tenant_id === tenantId) || [];
    
    if (validSales.length !== data?.length) {
      console.error("TENANT_SECURITY_ERROR: Cross-tenant data detected in sales query", {
        expected: data?.length,
        valid: validSales.length,
        tenantId
      });
    }
    
    console.log(`Found ${validSales.length} valid sales for date range`);
    return validSales;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Exception in getSalesByDateRange:", error);
    return [];
  }
};

export const getRecentSales = async (tenantId: string, limit: number = 5) => {
  if (!tenantId) {
    console.error("TENANT_SECURITY_ERROR: No tenant ID provided for getRecentSales");
    return [];
  }

  if (!await validateTenantIsolation('GET_RECENT_SALES', tenantId)) {
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
      console.error("TENANT_SECURITY_ERROR: Error in getRecentSales:", error);
      return [];
    }
    
    // Validate all returned sales belong to the correct tenant
    const validSales = data?.filter(sale => sale.tenant_id === tenantId) || [];
    
    if (validSales.length !== data?.length) {
      console.error("TENANT_SECURITY_ERROR: Cross-tenant data detected in recent sales query", {
        expected: data?.length,
        valid: validSales.length,
        tenantId
      });
    }
    
    console.log(`Found ${validSales.length} valid recent sales`);
    return validSales;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Exception in getRecentSales:", error);
    return [];
  }
};

export const getLowStockProducts = async (tenantId: string) => {
  if (!tenantId) {
    console.error("TENANT_SECURITY_ERROR: No tenant ID provided for getLowStockProducts");
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
      console.error("TENANT_SECURITY_ERROR: Error in getLowStockProducts:", error);
      return [];
    }
    
    // Validate all returned products belong to the correct tenant
    const validProducts = data?.filter(product => product.user_id === tenantId) || [];
    
    if (validProducts.length !== data?.length) {
      console.error("TENANT_SECURITY_ERROR: Cross-tenant data detected in products query", {
        expected: data?.length,
        valid: validProducts.length,
        tenantId
      });
    }
    
    console.log(`Found ${validProducts.length} valid low stock products`);
    return validProducts;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Exception in getLowStockProducts:", error);
    return [];
  }
};

export const getTopSellingProducts = async (tenantId: string, limit: number = 5) => {
  if (!tenantId) {
    console.error("TENANT_SECURITY_ERROR: No tenant ID provided for getTopSellingProducts");
    return [];
  }

  if (!await validateTenantIsolation('GET_TOP_SELLING_PRODUCTS', tenantId)) {
    return [];
  }

  try {
    console.log(`Getting top selling products for tenant: ${tenantId}, limit: ${limit}`);
    
    // Enhanced query with strict tenant validation
    const { data: saleItems, error } = await supabase
      .from('sale_items')
      .select(`
        product_id,
        quantity,
        tenant_id,
        products (
          id,
          name,
          user_id
        )
      `)
      .eq('tenant_id', tenantId);
      
    if (error) {
      console.error("TENANT_SECURITY_ERROR: Error in getTopSellingProducts:", error);
      return [];
    }
    
    // Validate tenant isolation for all sale items
    const validSaleItems = saleItems?.filter(item => {
      const isValidSaleItem = item.tenant_id === tenantId;
      const isValidProduct = item.products?.user_id === tenantId;
      
      if (!isValidSaleItem || !isValidProduct) {
        console.error("TENANT_SECURITY_ERROR: Cross-tenant data detected in sale items", {
          saleItemTenant: item.tenant_id,
          productTenant: item.products?.user_id,
          expectedTenant: tenantId
        });
        return false;
      }
      
      return true;
    }) || [];
    
    // Aggregate by product with security validation
    const aggregated = validSaleItems.reduce((acc: any, item: any) => {
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
    
    console.log(`Found ${result.length} valid top selling products`);
    return result;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Exception in getTopSellingProducts:", error);
    return [];
  }
};
