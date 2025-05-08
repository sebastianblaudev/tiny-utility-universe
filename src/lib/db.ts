import { checkBusinessLicense } from "./license";
import { openDB, IDBPDatabase } from 'idb';

// Define types that are used across the application
export interface User {
  username: string;
  id: string;
  role?: "admin" | "cashier";
  pin?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  categoryId?: string;
  description?: string;
  image?: string;
  barcode?: string;
  stock?: number;
  sizes?: {
    [key: string]: number;
    personal: number;
    mediana: number;
    familiar: number;
  };
  ingredients?: ProductIngredient[];
  ingredientsBySize?: {
    [size: string]: ProductIngredient[];
  };
}

export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  orders?: string[];
  address?: {
    street: string;
    reference?: string;
  };
}

export interface ProductIngredient {
  id: string;
  name: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  name: string;
  size?: string;
  notes?: string;
  extras?: Array<{name: string, price: number}>;
  sentToKitchen?: boolean; // Nuevo campo para saber si fue enviado a cocina
  sentAt?: string; // Timestamp de cuándo se envió a cocina
}

export interface Order {
  id: string;
  items: OrderItem[];
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: number;  // Should be number, not string
  address?: {
    street: string;
    reference?: string;
  };
  total: number;
  subtotal: number;
  tax?: number;
  tip?: number;
  status: string;
  orderType: "mesa" | "delivery" | "takeaway";
  createdAt: string;
  completedAt?: string;
  paymentMethod?: string;
  taxSettings?: {
    taxEnabled: boolean;
    taxPercentage: string;
  };
  paymentSplits?: Array<{
    method: 'efectivo' | 'tarjeta' | 'transferencia';
    amount: number;
  }>;
}

export interface Table {
  id: number;
  number: number;
  status: "available" | "occupied";
  currentOrder?: Order;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  // Updated to use type instead of discountType
  type: "percentage" | "fixed" | "bogo" | "bundle";
  // Updated to use value instead of discountValue
  value: number;
  minAmount?: number;
  minimumPurchase?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  exclusiveProducts?: boolean;
  code?: string;
  usageLimit?: number;
  usageCount?: number;
  startDate: string;
  endDate: string;
  daysOfWeek?: number[];
  active: boolean;
  createdAt: string;
}

export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  startAmount: number;
  endAmount?: number;
  sales?: number;
  status: "active" | "closed";
  note?: string;  // Added for compatibility with ZReport.tsx
}

export interface Cashier {
  id: string;
  name: string;
  pin?: string;
  active?: boolean;  // Added for compatibility with CashierSelector.tsx
}

// Database schema version - updated to match the existing version
const DB_VERSION = 9;

// Define type for database schema to fix the error
interface DBSchemaValue {
  key: string;
  value: any;
  indexes?: Record<string, any>;
}

// Initialize the database
export const initDB = async (): Promise<IDBPDatabase> => {
  try {
    const db = await openDB('pizza-pos-db', DB_VERSION, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tables')) {
          db.createObjectStore('tables', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('promotions')) {
          db.createObjectStore('promotions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('shifts')) {
          db.createObjectStore('shifts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('business')) {
          db.createObjectStore('business', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cashiers')) {
          db.createObjectStore('cashiers', { keyPath: 'id' });
        }
      }
    });
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Helper functions for table orders
export const saveTableOrder = async (tableNumber: number, order: Order) => {
  try {
    const db = await initDB();
    await db.put('tables', {
      id: tableNumber,
      number: tableNumber,
      status: 'occupied',
      currentOrder: order
    });
    return true;
  } catch (error) {
    console.error('Error saving table order:', error);
    return false;
  }
};

// Función modificada para marcar items como enviados a cocina
export const markItemsAsSentToKitchen = async (tableNumber: number, itemIds: string[]) => {
  try {
    const db = await initDB();
    const table = await db.get('tables', tableNumber);
    
    if (!table || !table.currentOrder || !table.currentOrder.items) {
      return false;
    }
    
    // Marcar los items enviados
    const updatedItems = table.currentOrder.items.map((item: OrderItem) => {
      if (itemIds.includes(item.id)) {
        return {
          ...item,
          sentToKitchen: true,
          sentAt: new Date().toISOString()
        };
      }
      return item;
    });
    
    // Actualizar la orden
    table.currentOrder.items = updatedItems;
    await db.put('tables', table);
    return true;
  } catch (error) {
    console.error('Error marking items as sent to kitchen:', error);
    return false;
  }
};

// Función para obtener los items nuevos (no enviados a cocina)
export const getNewOrderItems = async (tableNumber: number) => {
  try {
    const db = await initDB();
    const table = await db.get('tables', tableNumber);
    
    if (!table || !table.currentOrder || !table.currentOrder.items) {
      return [];
    }
    
    return table.currentOrder.items.filter((item: OrderItem) => !item.sentToKitchen);
  } catch (error) {
    console.error('Error getting new order items:', error);
    return [];
  }
};

export const getTableOrder = async (tableNumber: number) => {
  try {
    const db = await initDB();
    const table = await db.get('tables', tableNumber);
    return table?.currentOrder || null;
  } catch (error) {
    console.error('Error getting table order:', error);
    return null;
  }
};

export const getAllSavedOrders = async () => {
  try {
    const db = await initDB();
    const tables = await db.getAll('tables');
    return tables.filter(table => table.status === 'occupied');
  } catch (error) {
    console.error('Error getting all saved orders:', error);
    return [];
  }
};

export const completeTableOrder = async (tableNumber: number) => {
  try {
    const db = await initDB();
    const table = await db.get('tables', tableNumber);
    if (table) {
      table.status = 'available';
      table.currentOrder = undefined;
      await db.put('tables', table);
    }
    return true;
  } catch (error) {
    console.error('Error completing table order:', error);
    return false;
  }
};

// Clase para manejar la autenticación
export class Auth {
  private static readonly STORAGE_KEY = 'pizza_pos_auth';
  private static instance: Auth | null = null;
  private _currentUser: User | null = null;
  
  private constructor() {
    // Intentar cargar el usuario desde localStorage al iniciar
    const savedAuth = localStorage.getItem(Auth.STORAGE_KEY);
    if (savedAuth) {
      try {
        this._currentUser = JSON.parse(savedAuth);
      } catch (e) {
        console.error('Error parsing saved auth data', e);
        localStorage.removeItem(Auth.STORAGE_KEY);
      }
    }
  }

  public static getInstance(): Auth {
    if (!Auth.instance) {
      Auth.instance = new Auth();
    }
    return Auth.instance;
  }

  public get currentUser(): User | null {
    return this._currentUser;
  }

  public async register(username: string, password: string, role: "admin" | "cashier" = "admin"): Promise<User> {
    if (!username || !password) {
      throw new Error('Usuario y contraseña son requeridos');
    }
    
    const existingUsers = this.getAllUsers();
    if (existingUsers.find(u => u.username === username)) {
      throw new Error('Este usuario ya está registrado');
    }
    
    const userId = crypto.randomUUID();
    const newUser: User = { username, id: userId, role };
    
    const hashedPassword = await this.hashPassword(password);
    const users = existingUsers;
    users.push({
      username,
      id: userId,
      passwordHash: hashedPassword,
      role,
      pin: role === "admin" ? this.generateInitialPin() : undefined
    });
    
    localStorage.setItem('pizza_pos_users', JSON.stringify(users));
    this._currentUser = newUser;
    localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(newUser));
    
    return newUser;
  }

  public async login(username: string, password: string): Promise<User> {
    if (!username || !password) {
      throw new Error('Usuario y contraseña son requeridos');
    }
    
    // First check the business license
    const licenseStatus = await checkBusinessLicense(username);
    
    if (!licenseStatus.found) {
      throw new Error('Negocio no encontrado');
    }

    if (!licenseStatus.isValid) {
      // Si la licencia no es válida, almacenamos las credenciales temporalmente
      // para poder usarlas en la página de activación
      const users = this.getAllUsers();
      const user = users.find(u => u.username === username);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Contraseña incorrecta');
      }

      // Store temporary session for license activation
      const authUser: User = { 
        username, 
        id: user.id,
        role: user.role || "admin",
        pin: user.pin
      };
      this._currentUser = authUser;
      localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(authUser));
      
      throw new Error('LICENSE_EXPIRED');
    }
    
    // Continue with normal login flow if license is valid
    const users = this.getAllUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Contraseña incorrecta');
    }
    
    const authUser: User = { 
      username, 
      id: user.id,
      role: user.role || "admin",
      pin: user.pin
    };
    this._currentUser = authUser;
    localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(authUser));
    
    return authUser;
  }

  public async loginWithPin(pin: string): Promise<User> {
    if (!pin || pin.length !== 4) {
      throw new Error('PIN inválido');
    }

    const users = this.getAllUsers();
    const user = users.find(u => u.pin === pin);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const authUser: User = {
      username: user.username,
      id: user.id,
      role: user.role || "cashier",
      pin: user.pin
    };

    this._currentUser = authUser;
    localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(authUser));

    return authUser;
  }

  public logout(): void {
    this._currentUser = null;
    localStorage.removeItem(Auth.STORAGE_KEY);
  }
  
  public isAuthenticated(): boolean {
    return this._currentUser !== null;
  }
  
  public isAdmin(): boolean {
    return this._currentUser?.role === "admin" || this._currentUser?.role === undefined;
  }

  public isCashier(): boolean {
    return this._currentUser?.role === "cashier";
  }
  
  public getAllUsers(): Array<{username: string, id: string, passwordHash: string, role?: "admin" | "cashier", pin?: string}> {
    try {
      const users = localStorage.getItem('pizza_pos_users');
      return users ? JSON.parse(users) : [];
    } catch (e) {
      console.error('Error getting users', e);
      return [];
    }
  }
  
  public async changePassword(username: string, newPassword: string): Promise<void> {
    if (!username || !newPassword) {
      throw new Error('Usuario y contraseña son requeridos');
    }
    
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      throw new Error('Usuario no encontrado');
    }
    
    const hashedPassword = await this.hashPassword(newPassword);
    users[userIndex].passwordHash = hashedPassword;
    
    localStorage.setItem('pizza_pos_users', JSON.stringify(users));
  }

  public async changePin(username: string, newPin: string): Promise<void> {
    if (!username || !newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      throw new Error('Usuario y PIN válido de 4 dígitos son requeridos');
    }
    
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el PIN no esté en uso
    if (users.some((u, idx) => idx !== userIndex && u.pin === newPin)) {
      throw new Error('Este PIN ya está en uso por otro usuario');
    }
    
    users[userIndex].pin = newPin;
    
    // Si el usuario actual es el que está cambiando su PIN, actualizar el currentUser
    if (this._currentUser && this._currentUser.username === username) {
      this._currentUser = {
        ...this._currentUser,
        pin: newPin
      };
      localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(this._currentUser));
    }
    
    localStorage.setItem('pizza_pos_users', JSON.stringify(users));
  }

  public async createCashier(username: string): Promise<User> {
    if (!username) {
      throw new Error('Nombre de usuario es requerido');
    }
    
    const existingUsers = this.getAllUsers();
    if (existingUsers.find(u => u.username === username)) {
      throw new Error('Este usuario ya está registrado');
    }
    
    const userId = crypto.randomUUID();
    const pin = this.generateInitialPin();
    
    // Verificar que el PIN no esté en uso
    let uniquePin = pin;
    while (existingUsers.some(u => u.pin === uniquePin)) {
      uniquePin = this.generateInitialPin();
    }
    
    const users = existingUsers;
    users.push({
      username,
      id: userId,
      passwordHash: "", // No se requiere contraseña para cajeros
      role: "cashier",
      pin: uniquePin
    });
    
    localStorage.setItem('pizza_pos_users', JSON.stringify(users));
    
    return { username, id: userId, role: "cashier", pin: uniquePin };
  }

  public getCashiers(): Array<{username: string, id: string, pin?: string}> {
    const users = this.getAllUsers();
    return users
      .filter(u => u.role === "cashier")
      .map(u => ({
        username: u.username,
        id: u.id,
        pin: u.pin
      }));
  }

  private generateInitialPin(): string {
    // Generar un PIN aleatorio de 4 dígitos
    let pin = '';
    for (let i = 0; i < 4; i++) {
      pin += Math.floor(Math.random() * 10).toString();
    }
    return pin;
  }
  
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }
}
