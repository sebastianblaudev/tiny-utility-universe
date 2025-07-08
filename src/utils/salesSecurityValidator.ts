
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserTenantId } from "@/integrations/supabase/client";

export const validateSaleAccess = async (saleId: string): Promise<boolean> => {
  try {
    const currentTenantId = await getCurrentUserTenantId();
    
    if (!currentTenantId) {
      console.error("TENANT_SECURITY_WARNING: No tenant ID found for sale access validation");
      return false;
    }

    const { data: sale, error } = await supabase
      .from('sales')
      .select('tenant_id')
      .eq('id', saleId)
      .single();
    
    if (error) {
      console.error("TENANT_SECURITY_ERROR: Error validating sale access", error);
      return false;
    }
    
    if (!sale || sale.tenant_id !== currentTenantId) {
      console.error("TENANT_SECURITY_WARNING: Cross-tenant sale access attempted", {
        saleId,
        saleTenant: sale?.tenant_id,
        currentTenant: currentTenantId
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Exception in sale access validation", error);
    return false;
  }
};

export const validateSaleItemAccess = async (saleItemId: string): Promise<boolean> => {
  try {
    const currentTenantId = await getCurrentUserTenantId();
    
    if (!currentTenantId) {
      console.error("TENANT_SECURITY_WARNING: No tenant ID found for sale item access validation");
      return false;
    }

    const { data: saleItem, error } = await supabase
      .from('sale_items')
      .select('tenant_id')
      .eq('id', saleItemId)
      .single();
    
    if (error) {
      console.error("TENANT_SECURITY_ERROR: Error validating sale item access", error);
      return false;
    }
    
    if (!saleItem || saleItem.tenant_id !== currentTenantId) {
      console.error("TENANT_SECURITY_WARNING: Cross-tenant sale item access attempted", {
        saleItemId,
        saleItemTenant: saleItem?.tenant_id,
        currentTenant: currentTenantId
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Exception in sale item access validation", error);
    return false;
  }
};

export const validateCustomerAccess = async (customerId: string): Promise<boolean> => {
  try {
    const currentTenantId = await getCurrentUserTenantId();
    
    if (!currentTenantId) {
      console.error("TENANT_SECURITY_WARNING: No tenant ID found for customer access validation");
      return false;
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .select('tenant_id')
      .eq('id', customerId)
      .single();
    
    if (error) {
      console.error("TENANT_SECURITY_ERROR: Error validating customer access", error);
      return false;
    }
    
    if (!customer || customer.tenant_id !== currentTenantId) {
      console.error("TENANT_SECURITY_WARNING: Cross-tenant customer access attempted", {
        customerId,
        customerTenant: customer?.tenant_id,
        currentTenant: currentTenantId
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Exception in customer access validation", error);
    return false;
  }
};
