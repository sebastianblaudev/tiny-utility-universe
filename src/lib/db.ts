import { openDB } from 'idb';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  barcode?: string;
  stock?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Table {
  id: string;
  number: number;
  status: 'available' | 'occupied' | 'reserved';
  seats: number;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Order {
  id: string;
  customerId?: string;
  tableId?: string;
  products: { productId: string; quantity: number }[];
  total: number;
  date: Date;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BusinessData {
  id: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
  license_key?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CashShift {
  id: string;
  cashierId: string;
  openingBalance: number;
  closingBalance?: number;
  startDate: Date;
  endDate?: Date;
  status: 'open' | 'closed';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  active: boolean;
  products?: string[];
  categories?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: {
      'by-category': string;
      'by-name': string;
      'by-barcode': string;
    };
  };
  tables: {
    key: string;
    value: Table;
    indexes: {
      'by-number': number;
      'by-status': string;
    };
  };
  customers: {
    key: string;
    value: Customer;
    indexes: {
      'by-name': string;
      'by-phone': string;
      'by-email': string;
    };
  };
  orders: {
    key: string;
    value: Order;
    indexes: {
      'by-customer': string;
      'by-table': string;
      'by-date': Date;
      'by-status': string;
    };
  };
  business: {
    key: number;
    value: BusinessData;
  };
  categories: {
    key: string;
    value: Category;
    indexes: {
      'by-name': string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
  cashShifts: {
    key: string;
    value: CashShift;
    indexes: {
      'by-date': Date;
      'by-cashier': string;
      'by-status': string;
    };
  };
  promotions: {
    key: string;
    value: Promotion;
    indexes: {
      'by-name': string;
      'by-active': boolean;
      'by-date': Date;
    };
  };
}

// Define the union of all value types
type DBSchemaValue = 
  | Product 
  | Table 
  | Customer 
  | Order 
  | BusinessData 
  | Category 
  | any /* settings */ 
  | CashShift 
  | Promotion;  // Make sure Promotion is included here

const dbVersion = 5;

export async function initDB() {
  return openDB<DBSchema>('pizzaPos', dbVersion, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        const productsStore = db.createObjectStore('products', { keyPath: 'id' });
        productsStore.createIndex('by-category', 'category');
        productsStore.createIndex('by-name', 'name');
        productsStore.createIndex('by-barcode', 'barcode');

        const tablesStore = db.createObjectStore('tables', { keyPath: 'id' });
        tablesStore.createIndex('by-number', 'number');
        tablesStore.createIndex('by-status', 'status');

        const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
        customersStore.createIndex('by-name', 'name');
        customersStore.createIndex('by-phone', 'phone');
        customersStore.createIndex('by-email', 'email');

        const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
        ordersStore.createIndex('by-customer', 'customerId');
        ordersStore.createIndex('by-table', 'tableId');
        ordersStore.createIndex('by-date', 'date');
        ordersStore.createIndex('by-status', 'status');

        db.createObjectStore('business', { keyPath: 'id' });
      }

      if (oldVersion < 2) {
        const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
        categoriesStore.createIndex('by-name', 'name');
      }

      if (oldVersion < 3) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      if (oldVersion < 4) {
        const cashShiftsStore = db.createObjectStore('cashShifts', { keyPath: 'id' });
        cashShiftsStore.createIndex('by-date', 'startDate');
        cashShiftsStore.createIndex('by-cashier', 'cashierId');
        cashShiftsStore.createIndex('by-status', 'status');
      }
      
      if (oldVersion < 5) {
        const promotionsStore = db.createObjectStore('promotions', { keyPath: 'id' });
        promotionsStore.createIndex('by-name', 'name');
        promotionsStore.createIndex('by-active', 'active');
        promotionsStore.createIndex('by-date', 'startDate');
      }
    }
  });
}
