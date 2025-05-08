
// Definir los tipos para los datos de respaldo y las estadísticas administrativas

// Producto básico
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string | null;
  [key: string]: any; // Permitir propiedades adicionales
}

// Cliente básico
export interface Customer {
  id: string;
  name: string;
  phone: string;
  orders: string[];
  [key: string]: any; // Permitir propiedades adicionales
}

// Item de una orden
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  [key: string]: any; // Permitir propiedades adicionales
}

// Orden completa
export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  orderType: string;
  status: string;
  createdAt: string | Date;
  paymentMethod?: string;
  [key: string]: any; // Permitir propiedades adicionales
}

// Mesa
export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: string;
  [key: string]: any; // Permitir propiedades adicionales
}

// Información del negocio
export interface Business {
  id: string;
  name: string;
  email: string;
  [key: string]: any; // Permitir propiedades adicionales
}

// Datos de respaldo completos
export interface BackupData {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  tables: Table[];
  timestamp: string;
  business?: Business; // Información del negocio (opcional)
  [key: string]: any; // Permitir propiedades adicionales
}

// Estadísticas para el dashboard de administración
export interface AdminBackupStats {
  productCount: number;
  customerCount: number;
  orderCount: number;
  totalRevenue: number;
  averageTicket: number;
  topSellingProducts: {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  paymentMethodBreakdown: Record<string, number>;
  dailyRevenueLastWeek: {
    date: string;
    revenue: number;
  }[];
  backupData: BackupData;
  isDemoData: boolean; // Indica si los datos son de demostración
}
