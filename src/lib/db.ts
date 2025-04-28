import { openDB, DBSchema } from 'idb';
import type { BusinessData } from '@/types/business';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string | null;
  barcode?: string | null;
  sizes?: {
    personal: number;
    mediana: number;
    familiar: number;
  };
  categoryId?: string;
  ingredients?: any[];
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  orders: string[];
  address?: {
    street: string;
    reference: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

interface Order {
  id: string;
  customerId: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    name: string;
    size?: string;
  }>;
  total: number;
  subtotal: number;
  tip?: number;
  orderType: 'mesa' | 'delivery' | 'takeaway';
  tableNumber?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'dividido';
  paymentSplits?: PaymentSplit[];
}

interface Table {
  number: string;
  status: 'free' | 'occupied';
  currentOrderId?: string;
}

interface Shift {
  id: string;
  startAmount: number;
  endAmount?: number;
  startTime: Date;
  endTime?: Date;
  note?: string;
  cashierId: string;
  cashierName: string;
}

interface Cashier {
  id: string;
  name: string;
  active: boolean;
}

interface PaymentSplit {
  method: 'efectivo' | 'tarjeta' | 'transferencia';
  amount: number;
}

interface PizzaPOSDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-category': string };
  };
  customers: {
    key: string;
    value: Customer;
    indexes: { 'by-phone': string };
  };
  orders: {
    key: string;
    value: Order;
    indexes: { 'by-customer': string; 'by-date': Date };
  };
  tables: {
    key: string;
    value: Table;
  };
  shifts: {
    key: string;
    value: Shift;
  };
  cashiers: {
    key: string;
    value: Cashier;
  };
  categories: {
    key: string;
    value: Category;
    indexes: { 'by-name': string };
  };
  business: {
    key: string;
    value: BusinessData;
  };
}

let dbPromise: Promise<any> | null = null;

export const initDB = async () => {
  if (!dbPromise) {
    try {
      const db = await openDB<PizzaPOSDB>('pizzaPos', 5, {
        upgrade(db, oldVersion, newVersion) {
          if (!db.objectStoreNames.contains('products')) {
            const productStore = db.createObjectStore('products', { keyPath: 'id' });
            productStore.createIndex('by-category', 'category');
          }

          if (!db.objectStoreNames.contains('customers')) {
            const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
            customerStore.createIndex('by-phone', 'phone');
          }

          if (!db.objectStoreNames.contains('orders')) {
            const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
            orderStore.createIndex('by-customer', 'customerId');
            orderStore.createIndex('by-date', 'createdAt');
          }

          if (!db.objectStoreNames.contains('tables')) {
            const tableStore = db.createObjectStore('tables', { keyPath: 'number' });
            for (let i = 1; i <= 8; i++) {
              tableStore.put({
                number: i.toString(),
                status: 'free' as const
              });
            }
          }

          if (!db.objectStoreNames.contains('shifts')) {
            db.createObjectStore('shifts', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('cashiers')) {
            db.createObjectStore('cashiers', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('categories')) {
            const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
            categoryStore.createIndex('by-name', 'name');
            
            categoryStore.put({
              id: 'cat_pizza',
              name: 'Pizzas',
              color: '#FF5733'
            });
            
            categoryStore.put({
              id: 'cat_bebidas',
              name: 'Bebidas',
              color: '#3498DB'
            });
            
            categoryStore.put({
              id: 'cat_postres',
              name: 'Postres',
              color: '#F1C40F'
            });

            categoryStore.put({
              id: 'cat_extras',
              name: 'Extras',
              color: '#2ECC71'
            });
          }

          if (!db.objectStoreNames.contains('business')) {
            db.createObjectStore('business', { keyPath: 'id' });
          }
        },
      });
      
      dbPromise = Promise.resolve(db);
      
      db.addEventListener('versionchange', () => {
        db.close();
        dbPromise = null;
      });
      
      return db;
    } catch (error) {
      console.error("Database initialization error:", error);
      throw error;
    }
  }
  
  return dbPromise;
};

export type { Product, Customer, Order, Table, Shift, Cashier, Category, BusinessData };
