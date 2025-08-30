import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/utils/currencyFormat';

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

export interface BusinessInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  logo?: string;
  currency?: string;
  receiptFooter?: string;
}

export const getReceiptData = async (saleId: string): Promise<Receipt | null> => {
  try {
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        customers (name, phone),
        turnos (id, cashier_name),
        sale_items (
          id,
          quantity,
          price,
          subtotal,
          notes,
          products (name, price)
        )
      `)
      .eq('id', saleId)
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
      notes: item.notes || ''
    })) || [];

    const receipt: Receipt = {
      saleId: sale.id,
      date: sale.date || new Date().toISOString(),
      total: sale.total,
      paymentMethod: sale.payment_method || 'efectivo',
      cashierName: sale.turnos?.cashier_name || sale.cashier_name || 'Cajero',
      customerName: sale.customers?.name || '',
      customerPhone: sale.customers?.phone || '',
      items,
      taxTotal: 0,
      subtotal: sale.total,
      discount: 0,
      change: 0,
      cashReceived: 0,
      turnoId: sale.turno_id || '',
      saleType: sale.sale_type || 'Normal'
    };

    return receipt;
  } catch (error) {
    console.error('Error in getReceiptData:', error);
    return null;
  }
};

export const getCustomerPurchaseHistory = async (customerId: string, tenantId: string): Promise<Receipt[]> => {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers (name, phone),
        turnos (id, cashier_name),
        sale_items (
          id,
          quantity,
          price,
          subtotal,
          notes,
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
        notes: item.notes || ''
      })) || [];

        return {
          saleId: sale.id,
          date: sale.date || new Date().toISOString(),
          total: sale.total,
          paymentMethod: sale.payment_method || 'efectivo',
          cashierName: sale.turnos?.cashier_name || sale.cashier_name || 'Cajero',
          customerName: sale.customers?.name || '',
          customerPhone: sale.customers?.phone || '',
          items,
          taxTotal: 0,
          subtotal: sale.total,
          discount: 0,
          change: 0,
          cashReceived: 0,
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