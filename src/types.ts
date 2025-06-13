// User types
export interface User {
  id: string;
  name: string;
  pin: string;
  role: 'owner' | 'admin' | 'barber';
  branchId?: string; // Added branchId property
}

// Barber shop types - Simplified to single branch
export interface AppSettings {
  branchName: string;
  address: string;
  phone: string;
}

export interface Barber {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface BarcodeMapping {
  barberId: string;
  barcode: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  categoryId: string;
  barberId?: string;
  barcode?: string;
  barberBarcodes?: BarcodeMapping[]; // Added this property for barber-specific barcodes
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string;
}

// Sales types
export interface SaleItem {
  id: string;
  saleId: string;
  serviceId?: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  barberId?: string;
  barberName?: string; // Added for easier reporting
  type: 'service' | 'product'; // Added type property
  itemId: string; // Added itemId property
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  MIXED = 'mixed'
}

export interface SplitPayment {
  method: PaymentMethod;
  amount: number;
}

export interface Sale {
  id: string;
  barberId: string; // Added barberId property
  date: Date;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  splitPayments?: SplitPayment[];
  tip?: Tip;
  discount?: Discount; // Added discount property
  appliedPromotion?: Promotion; // Added promotion property
}

export interface Tip {
  amount: number;
  barberId: string;
  paymentMethod: PaymentMethod; // Added paymentMethod property
}

// Cash advance types
export interface CashAdvance {
  id: string;
  barberId: string;
  barberName?: string;
  amount: number;
  date: Date;
  description: string;
  paymentMethod: 'cash' | 'transfer';
  status?: 'pending' | 'settled'; // Added status field
  settled?: boolean;
}

// Commission types
export interface ServiceCommission {
  serviceId: string;
  percentage: number;
}

export interface ProductCommission {
  productId: string;
  percentage: number;
}

// New types for promotions and discounts
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export interface Discount {
  type: DiscountType;
  value: number; // Either percentage (0-100) or fixed amount
  reason?: string;
}

export enum PromotionType {
  PERCENTAGE_OFF = 'percentage_off',
  FIXED_AMOUNT_OFF = 'fixed_amount_off',
  BUY_X_GET_Y = 'buy_x_get_y'
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number; // Percentage or fixed amount
  startDate: Date;
  endDate: Date;
  active: boolean;
  requiresOwnerPin?: boolean;
  minimumPurchase?: number;
  applicableCategories?: string[]; // Category IDs this promotion applies to
  applicableItems?: string[]; // Service/Product IDs this promotion applies to
  buyXGetYDetails?: {
    buyQuantity: number;
    getQuantity: number;
    itemId?: string; // If specific item is required for the free item
  };
}

// Report types
export interface BarberSalesReport {
  barberId: string;
  barberName: string;
  totalSales: number;
  serviceCount: number;
  productCount: number;
  totalAmount: number;
}

export interface ProductSalesReport {
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
}

export interface ServiceSalesReport {
  serviceId: string;
  serviceName: string;
  quantity: number;
  totalAmount: number;
}

// Backup types
export interface DataBackup {
  appSettings: AppSettings;
  services: Service[];
  products: Product[];
  categories: Category[];
  barbers: Barber[];
  sales: Sale[];
  cashAdvances: CashAdvance[];
  promotions: Promotion[];
  exportDate: string;
}

// Database service interface
export interface IndexedDBService {
  openDatabase(): Promise<IDBDatabase>;
  saveData(storeName: string, data: any[]): Promise<void>;
  getData(storeName: string): Promise<any[]>;
  clearStore(storeName: string): Promise<void>;
}
