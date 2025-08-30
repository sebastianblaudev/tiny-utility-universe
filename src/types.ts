export interface SaleType {
  id: string;
  date: string;
  total: number;
  payment_method: string;
  status: string;
  customer_id?: string | null;
  tenant_id?: string | null;
  sale_type?: string; 
  caja_id?: string | null;
  cashier_name?: string | null;
  turno_id?: string | null;
}

export interface ProductType {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  barcode?: string | null;
  image_url?: string | null;
  description?: string | null;
  stock?: number | null;
  cost?: number | null;
  quantity?: number;
  subtotal?: number;
  notes?: string;
  tenant_id?: string | null;
  color?: string | null;
  is_by_weight?: boolean;
  unit?: string;
}

export interface RecentPurchaseItem {
  id: string;
  date: string;
  total: number;
  payment_method: string;
  sale_type?: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product_id: string;
    products: {
      name: string;
    };
  }[];
}

export interface RecentPurchasesViewProps {
  purchases: RecentPurchaseItem[];
  loading: boolean;
  limit: number;
  standalone: boolean;
  customerId: string;
}

export interface TurnoType {
  id: string;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  monto_inicial: number;
  monto_final?: number | null;
  estado: string;
  cajero_id?: string | null;
  cajero_nombre: string;
  observaciones?: string | null;
  tenant_id: string;
  created_at: string;
}

export interface TurnoTransaccionType {
  id: string;
  turno_id: string;
  tipo: string;
  monto: number;
  metodo_pago: string;
  descripcion?: string | null;
  fecha: string;
  venta_id?: string | null;
  tenant_id: string;
  created_at: string;
}

export interface TurnoResumenType {
  turno: TurnoType;
  transacciones: TurnoTransaccionType[];
  ventasPorMetodo: Record<string, number>;
  totalIngresos: number;
  totalEgresos: number;
  saldoFinal: number;
}
