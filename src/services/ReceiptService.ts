import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/utils/currencyFormat';
import { BusinessInfo } from '@/utils/ticketUtils';

export interface Receipt {
  saleId: string;
  date: string;
  total: number;
  paymentMethod: string;
  cashierName?: string;
  customerName?: string;
  customerPhone?: string;
  items: ReceiptItem[];
  businessInfo?: BusinessInfo;
  taxTotal?: number;
  subtotal?: number;
  discount?: number;
  change?: number;
  cashReceived?: number;
  turnoId?: string;
  saleType?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
}

export const getReceiptData = async (saleId: string, tenantId?: string): Promise<Receipt | null> => {
  try {
    console.log(`📧 Getting receipt data for sale: ${saleId}, tenant: ${tenantId || 'unknown'}`);
    
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        customers (name, phone),
        sale_items (
          id,
          quantity,
          price,
          subtotal,
          products (name, price)
        )
      `)
      .eq('id', saleId)
      .eq('tenant_id', tenantId || '') // Add tenant validation
      .single();

    if (saleError || !sale) {
      console.error('Error fetching sale:', saleError);
      return null;
    }

    const items: ReceiptItem[] = sale.sale_items?.map((item: any) => ({
      name: item.products?.name || 'Producto',
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      notes: '' // Notes will be handled separately if needed
    })) || [];

    const receipt: Receipt = {
      saleId: sale.id,
      date: sale.date || new Date().toISOString(),
      total: sale.total,
      paymentMethod: sale.payment_method || 'efectivo',
      cashierName: sale.cashier_name || 'Cajero',
      customerName: sale.customers?.name || '',
      customerPhone: sale.customers?.phone || '',
      items,
      taxTotal: 0,
      subtotal: sale.total,
      discount: 0,
      change: 0, // Calculated on frontend
      cashReceived: 0, // Calculated on frontend
      turnoId: sale.turno_id || '',
      saleType: sale.sale_type || 'Normal'
    };

    console.log(`📧 Receipt data generated successfully for sale: ${saleId}`);
    return receipt;
  } catch (error) {
    console.error('Error in getReceiptData:', error);
    return null;
  }
};

// Generate receipt data for offline sales using cart data
export const generateOfflineReceiptData = (
saleId: string, 
cartItems: any[], 
saleData: { 
  total: number; 
  paymentMethod: string; 
  cashierName: string; 
  customerName?: string; 
  customerPhone?: string; 
  saleType?: string;
}
): Receipt => {
  console.log(`📧 Generating offline receipt data for sale: ${saleId}`);
  
  const items: ReceiptItem[] = cartItems.map((item: any) => ({
    name: item.name || 'Producto',
    quantity: item.quantity || 1,
    price: item.price || 0,
    subtotal: item.subtotal || (item.price * item.quantity),
    notes: item.notes || ''
  }));

  const receipt: Receipt = {
    saleId,
    date: new Date().toISOString(),
    total: saleData.total,
    paymentMethod: saleData.paymentMethod || 'efectivo',
    cashierName: saleData.cashierName || 'FastPOS',
    customerName: saleData.customerName || '',
    customerPhone: saleData.customerPhone || '',
    items,
    taxTotal: 0,
    subtotal: saleData.total,
    discount: 0,
    change: 0,
    cashReceived: 0,
    turnoId: '',
    saleType: saleData.saleType || 'Normal'
  };

  console.log(`📧 Offline receipt data generated successfully for ${items.length} items`);
  return receipt;
};

export const getCustomerPurchaseHistory = async (customerId: string, tenantId: string): Promise<Receipt[]> => {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers (name, phone),
        sale_items (
          id,
          quantity,
          price,
          subtotal,
          products (name, price)
        )
      `)
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });

    if (error || !sales) {
      console.error('Error fetching customer purchase history:', error);
      return [];
    }

    const receipts: Receipt[] = sales.map((sale: any) => {
      const items: ReceiptItem[] = sale.sale_items?.map((item: any) => ({
        name: item.products?.name || 'Producto',
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        notes: '' // Notes handled separately if needed
      })) || [];

      return {
        saleId: sale.id,
        date: sale.date || new Date().toISOString(),
        total: sale.total,
        paymentMethod: sale.payment_method || 'efectivo',
        cashierName: sale.cashier_name || 'Cajero',
        customerName: sale.customers?.name || '',
        customerPhone: sale.customers?.phone || '',
        items,
        taxTotal: 0,
        subtotal: sale.total,
        discount: 0,
        change: 0, // Calculated on frontend
        cashReceived: 0, // Calculated on frontend
        turnoId: sale.turno_id || '',
        saleType: sale.sale_type || 'Normal'
      };
    });

    return receipts;
  } catch (error) {
    console.error('Error in getCustomerPurchaseHistory:', error);
    return [];
  }
};