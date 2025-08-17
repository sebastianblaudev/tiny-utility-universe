import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types
export type CustomerType = Database['public']['Tables']['customers']['Row'];
export type MixedPaymentType = {
  payment_method?: string;
  amount: number;
  method?: string; // For backward compatibility
};
export type PaymentMethodType = 'cash' | 'card' | 'transfer' | 'mixed';

// Helper functions
export const getCurrentUserTenantId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id') || null;
};

export const getCustomerById = async (customerId: string): Promise<CustomerType | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
  
  if (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
  
  return data;
};

export const addCustomer = async (customer: Database['public']['Tables']['customers']['Insert']): Promise<CustomerType | null> => {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single();
    
  if (error) {
    console.error('Error adding customer:', error);
    return null;
  }
  
  return data;
};

export const getAllCustomers = async (tenantId: string): Promise<CustomerType[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');
    
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  
  return data || [];
};

export const updateCustomer = async (customerId: string, updates: Database['public']['Tables']['customers']['Update']): Promise<CustomerType | null> => {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating customer:', error);
    return null;
  }
  
  return data;
};

export const deleteCustomer = async (customerId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);
    
  if (error) {
    console.error('Error deleting customer:', error);
    return false;
  }
  
  return true;
};

export const getCustomerSales = async (customerId: string, tenantId?: string) => {
  const finalTenantId = tenantId || await getCurrentUserTenantId();
  if (!finalTenantId) {
    console.error('No tenant ID available for customer sales query');
    return [];
  }

  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (
        *,
        products (name)
      )
    `)
    .eq('customer_id', customerId)
    .eq('tenant_id', finalTenantId)
    .order('date', { ascending: false });
    
  if (error) {
    console.error('Error fetching customer sales:', error);
    return [];
  }
  
  return data || [];
};

export const updateSaleWithCustomer = async (saleId: string, customerId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('sales')
    .update({ customer_id: customerId })
    .eq('id', saleId);
    
  if (error) {
    console.error('Error updating sale with customer:', error);
    return false;
  }
  
  return true;
};

export const registerCustomerSaleHistory = async (customerId: string, saleId: string): Promise<boolean> => {
  // This function is a placeholder as the relationship is handled by the sales table
  return true;
};

export const saveMixedPaymentMethods = async (saleId: string, payments: MixedPaymentType[], tenantId?: string): Promise<boolean> => {
  try {
    const finalTenantId = tenantId || await getCurrentUserTenantId();
    if (!finalTenantId) {
      console.error('No tenant ID available for saving mixed payment methods');
      return false;
    }

    const { error } = await supabase
      .from('sale_payment_methods')
      .insert(
        payments.map(payment => ({
          sale_id: saleId,
          payment_method: payment.payment_method || payment.method || 'cash',
          amount: payment.amount,
          tenant_id: finalTenantId
        }))
      );
      
    if (error) {
      console.error('Error saving mixed payment methods:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveMixedPaymentMethods:', error);
    return false;
  }
};

export const toggleMenuItemLock = async (pageRoute: string, locked?: boolean, tenantId?: string): Promise<boolean> => {
  try {
    const finalTenantId = tenantId || await getCurrentUserTenantId();
    if (!finalTenantId) {
      console.error('No tenant ID available for page lock operation');
      return false;
    }

    const lockData = {
      tenant_id: finalTenantId,
      page_route: pageRoute,
      page_name: pageRoute.replace('/', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      is_locked: locked ?? true,
      locked_by: 'owner',
      locked_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('page_locks')
      .upsert(lockData, { 
        onConflict: 'tenant_id,page_route',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error toggling page lock:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in toggleMenuItemLock:', error);
    return false;
  }
};

export const getLockedMenuItems = async (tenantId?: string): Promise<string[]> => {
  try {
    const finalTenantId = tenantId || await getCurrentUserTenantId();
    if (!finalTenantId) {
      console.error('No tenant ID available for getting locked pages');
      return [];
    }

    const { data, error } = await supabase
      .from('page_locks')
      .select('page_route')
      .eq('tenant_id', finalTenantId)
      .eq('is_locked', true);

    if (error) {
      console.error('Error fetching locked pages:', error);
      return [];
    }

    return data?.map(item => item.page_route) || [];
  } catch (error) {
    console.error('Error in getLockedMenuItems:', error);
    return [];
  }
};

export const getAllPageLocks = async (tenantId?: string) => {
  try {
    const finalTenantId = tenantId || await getCurrentUserTenantId();
    if (!finalTenantId) {
      console.error('No tenant ID available for getting page locks');
      return [];
    }

    const { data, error } = await supabase
      .from('page_locks')
      .select('*')
      .eq('tenant_id', finalTenantId)
      .order('page_name');

    if (error) {
      console.error('Error fetching page locks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllPageLocks:', error);
    return [];
  }
};