
import { supabase } from '@/integrations/supabase/client';
import { ProductType } from '@/types';

export interface ReceiptItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  name: string;
  notes?: string;
  subtotal?: number;
}

export interface Receipt {
  saleId: string;
  date: string;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  items: ReceiptItem[];
  saleType?: string;
  businessInfo?: {
    businessName: string;
    address: string;
    phone: string;
    receiptFooter: string;
    currency: string;
  };
}

export const getCustomerPurchaseHistory = async (customerId: string, limit: number = 5): Promise<Receipt[]> => {
  try {
    // First, try to get the tenant ID from local storage or JWT
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');
    
    if (!tenantId) {
      console.error("getCustomerPurchaseHistory: No tenant ID available");
      return [];
    }
    
    console.log(`Getting purchase history for customer ${customerId} with tenant ${tenantId}`);
    
    // Use string parameter for .eq() instead of trying to chain methods after select()
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        date,
        total,
        customer_id,
        payment_method,
        sale_type
      `)
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .limit(limit);

    if (salesError) {
      console.error("Error fetching sales:", salesError);
      return [];
    }

    if (!sales || sales.length === 0) {
      return [];
    }

    const receipts: Receipt[] = [];

    for (const sale of sales) {
      const { data: items, error: itemsError } = await supabase
        .from('sale_items')
        .select('*, products:product_id(*)')
        .eq('sale_id', sale.id)
        .eq('tenant_id', tenantId);

      if (itemsError) {
        console.error("Error fetching sale items:", itemsError);
        continue;
      }

      if (!items) continue;

      // Get item notes separately if they exist
      const { data: itemNotes, error: notesError } = await supabase
        .from('sale_item_notes')
        .select('*')
        .eq('sale_id', sale.id);
        
      if (notesError) {
        console.error("Error fetching item notes:", notesError);
      }
      
      const notesMap = new Map();
      if (itemNotes) {
        itemNotes.forEach(note => {
          notesMap.set(note.product_id, note.note);
        });
      }

      const receiptItems: ReceiptItem[] = items.map(item => {
        const product = item.products as ProductType;
        // Get note from map if it exists for this product
        const itemNote = notesMap.get(item.product_id) || '';
        
        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          name: product?.name || 'Unknown product',
          notes: itemNote,
          subtotal: item.quantity * item.price // Add subtotal calculation
        };
      });

      receipts.push({
        saleId: sale.id,
        date: sale.date,
        total: sale.total,
        paymentMethod: sale.payment_method,
        saleType: sale.sale_type,
        items: receiptItems
      });
    }

    return receipts;
  } catch (error) {
    console.error("Error in getCustomerPurchaseHistory:", error);
    return [];
  }
};

export const getReceiptData = async (saleId: string, tenantId?: string): Promise<Receipt | null> => {
  if (!saleId) {
    console.error("ReceiptService - No sale ID provided");
    return null;
  }

  try {
    // If no tenant ID is provided, try to get it
    let actualTenantId = tenantId;
    if (!actualTenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      actualTenantId = user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');
      
      if (!actualTenantId) {
        console.error("getReceiptData: No tenant ID available");
      }
    }
    
    console.log(`ReceiptService - Fetching receipt data for sale: ${saleId}, tenant: ${actualTenantId || 'unknown'}`);
    
    // First get the sale info
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .select(`
        id,
        date,
        total,
        payment_method,
        sale_type,
        customers(name, address, phone)
      `)
      .eq('id', saleId)
      .single();

    if (saleError) {
      console.error("ReceiptService - Error fetching sale:", saleError);
      return null;
    }

    if (!saleData) {
      console.error("ReceiptService - No sale found with ID:", saleId);
      return null;
    }

    // Important: For sale items, we should use the sale_id without tenant filtering
    // This is crucial because some items might be in the database without tenant_id
    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select('*, products:product_id(*)')
      .eq('sale_id', saleId);

    if (itemsError) {
      console.error("ReceiptService - Error fetching sale items:", itemsError);
      return null;
    }

    if (!items || items.length === 0) {
      console.warn(`ReceiptService - No items found for sale: ${saleId}. This may be unusual.`);
    }

    // Get any notes for items in this sale, also without tenant filtering
    const { data: notes, error: notesError } = await supabase
      .from('sale_item_notes')
      .select('*')
      .eq('sale_id', saleId);

    if (notesError) {
      console.error("ReceiptService - Error fetching sale item notes:", notesError);
    }

    // Create a map of product_id to note for quick lookup
    const notesMap = new Map();
    if (notes) {
      notes.forEach(note => {
        notesMap.set(note.product_id, note.note);
      });
    }

    // Format the receipt data
    const receiptItems: ReceiptItem[] = items?.map(item => {
      const product = item.products as ProductType;
      // Find notes for this item if any
      const itemNote = notesMap.get(item.product_id) || '';
      
      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: product?.name || 'Unknown product',
        notes: itemNote,
        subtotal: item.quantity * item.price // Add subtotal calculation
      };
    }) || [];

    const customerName = saleData.customers?.name;
    const customerAddress = saleData.customers?.address;
    const customerPhone = saleData.customers?.phone;

    return {
      saleId: saleData.id,
      date: saleData.date,
      total: saleData.total,
      paymentMethod: saleData.payment_method,
      saleType: saleData.sale_type,
      customerName,
      customerAddress,
      customerPhone,
      items: receiptItems
    };
  } catch (error) {
    console.error("ReceiptService - Error in getReceiptData:", error);
    return null;
  }
};
