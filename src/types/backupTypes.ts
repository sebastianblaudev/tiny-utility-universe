
// Define backup data structure types
export interface BackupData {
  products: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    image: string | null;
    [key: string]: any;
  }>;
  customers: Array<{
    id: string;
    name: string;
    phone: string;
    orders: string[];
    [key: string]: any;
  }>;
  orders: Array<{
    id: string;
    customerId: string | null;
    customerName?: string | null;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
      name: string;
      [key: string]: any;
    }>;
    total: number;
    subtotal: number;
    orderType: 'mesa' | 'delivery' | 'takeaway';
    status: string;
    createdAt: Date;
    paymentMethod: string;
    [key: string]: any;
  }>;
  tables?: Array<{
    number: string;
    status: string;
    [key: string]: any;
  }>;
  timestamp: string;
  business?: {
    id: string;
    name: string;
    email: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Define stats structure
export interface AdminBackupStats {
  productCount: number;
  customerCount: number;
  orderCount: number;
  totalRevenue: number;
  averageTicket: number;
  backupData: BackupData; // This property is required
  topSellingProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethodBreakdown: Record<string, number>;
  dailyRevenueLastWeek: Array<{
    date: string;
    revenue: number;
  }>;
}
