
import { ProductType } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Helper function to get current tenant ID
const getCurrentUserTenantId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('get_current_user_tenant_id');
    if (error) {
      console.error('Error getting current tenant ID:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in getCurrentUserTenantId:', error);
    return null;
  }
};

// Save product notes to the database when a sale is completed
export const saveProductNotes = async (saleId: string, items: ProductType[]) => {
  try {
    // Filter items that have notes
    const itemsWithNotes = items.filter(item => item.notes && item.notes.trim() !== '');
    
    if (itemsWithNotes.length === 0) return { success: true }; // Return object with success flag
    
    // Get current tenant ID
    const tenantId = await getCurrentUserTenantId();
    
    if (tenantId === null) {
      console.warn('No tenant ID available for saving product notes');
      return { success: false, message: 'No tenant ID available' }; // Return object with success flag and message
    }
    
    // Create records for each item with notes
    const notesRecords = itemsWithNotes.map(item => ({
      sale_id: saleId,
      product_id: item.id,
      note: item.notes || '',
      tenant_id: tenantId
    }));
    
    // Insert into the sale_item_notes table
    const { error } = await supabase
      .from('sale_item_notes')
      .insert(notesRecords);
    
    if (error) {
      console.error('Error al guardar notas de producto:', error);
      return { success: false, message: error.message }; // Return object with success flag and error message
    }
    
    return { success: true }; // Return object with success flag
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error en saveProductNotes:', error);
    return { success: false, message: errorMessage }; // Return object with success flag and error message
  }
};

// Retrieve notes for a specific sale
export const getProductNotes = async (saleId: string) => {
  try {
    const tenantId = await getCurrentUserTenantId();
    
    if (tenantId === null) {
      console.warn('No tenant ID available for retrieving product notes');
      return []; // Return empty array to indicate no data
    }
    
    const { data, error } = await supabase
      .from('sale_item_notes')
      .select('*')
      .eq('sale_id', saleId)
      .eq('tenant_id', tenantId);
    
    if (error) {
      console.error('Error al obtener notas de producto:', error);
      return []; // Return empty array to indicate no data
    }
    
    return data || []; // Return data or empty array
  } catch (error) {
    console.error('Error en getProductNotes:', error);
    return []; // Return empty array to indicate no data
  }
};
