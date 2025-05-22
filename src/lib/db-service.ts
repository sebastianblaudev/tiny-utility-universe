
// IndexedDB Service for CotiPro Chile

const DB_NAME = 'cotiprochile';
const DB_VERSION = 1;

interface Company {
  id?: number;
  name: string;
  rut: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  validityDays: number;
}

interface Product {
  id?: number;
  name: string;
  unitPrice: number;
  sku?: string;
  description?: string;
}

interface QuotationItem {
  id?: string;
  productId?: number;
  name: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  description?: string;
}

interface Quotation {
  id: string;
  date: string;
  clientName: string;
  clientRut?: string;
  clientEmail?: string;
  clientPhone?: string;
  items: QuotationItem[];
  notes?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'draft' | 'created' | 'sent' | 'accepted' | 'rejected';
  validUntil: string;
}

const initDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject('Database error: ' + (event.target as IDBRequest).error);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('company')) {
        const companyStore = db.createObjectStore('company', { keyPath: 'id', autoIncrement: true });
        companyStore.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        productStore.createIndex('name', 'name', { unique: false });
        productStore.createIndex('sku', 'sku', { unique: true });
      }

      if (!db.objectStoreNames.contains('quotations')) {
        const quotationStore = db.createObjectStore('quotations', { keyPath: 'id' });
        quotationStore.createIndex('date', 'date', { unique: false });
        quotationStore.createIndex('clientName', 'clientName', { unique: false });
        quotationStore.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
};

// Company methods
const saveCompanyInfo = async (company: Company): Promise<Company> => {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('company', 'readwrite');
    const store = transaction.objectStore('company');
    
    // Always save with ID 1 since we only need one company record
    company.id = 1;
    const request = store.put(company);
    
    request.onsuccess = () => {
      resolve(company);
    };
    
    request.onerror = (event) => {
      reject('Error saving company info: ' + (event.target as IDBRequest).error);
    };
  });
};

const getCompanyInfo = async (): Promise<Company | null> => {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('company', 'readonly');
    const store = transaction.objectStore('company');
    const request = store.get(1);
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result || null);
    };
    
    request.onerror = (event) => {
      reject('Error getting company info: ' + (event.target as IDBRequest).error);
    };
  });
};

// Product methods
const saveProduct = async (product: Product): Promise<Product> => {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction('products', 'readwrite');
      const store = transaction.objectStore('products');
      
      // Remove explicit id if it's undefined to let autoIncrement work
      if (!product.id) {
        const { id, ...productWithoutId } = product;
        const request = store.add(productWithoutId);
        
        request.onsuccess = (event) => {
          product.id = (event.target as IDBRequest).result as number;
          resolve(product);
        };
        
        request.onerror = (event) => {
          reject('Error saving product: ' + (event.target as IDBRequest).error);
        };
      } else {
        // If we have an id, use put
        const request = store.put(product);
        
        request.onsuccess = () => {
          resolve(product);
        };
        
        request.onerror = (event) => {
          reject('Error updating product: ' + (event.target as IDBRequest).error);
        };
      }
    } catch (error) {
      reject('Error in transaction: ' + error);
    }
  });
};

const getProducts = async (): Promise<Product[]> => {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('products', 'readonly');
    const store = transaction.objectStore('products');
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result);
    };
    
    request.onerror = (event) => {
      reject('Error getting products: ' + (event.target as IDBRequest).error);
    };
  });
};

const deleteProduct = async (id: number): Promise<void> => {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('products', 'readwrite');
    const store = transaction.objectStore('products');
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject('Error deleting product: ' + (event.target as IDBRequest).error);
    };
  });
};

// Quotation methods
const saveQuotation = async (quotation: Quotation): Promise<Quotation> => {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('quotations', 'readwrite');
    const store = transaction.objectStore('quotations');
    const request = store.put(quotation);
    
    request.onsuccess = () => {
      resolve(quotation);
    };
    
    request.onerror = (event) => {
      reject('Error saving quotation: ' + (event.target as IDBRequest).error);
    };
  });
};

const getQuotations = async (): Promise<Quotation[]> => {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('quotations', 'readonly');
    const store = transaction.objectStore('quotations');
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result);
    };
    
    request.onerror = (event) => {
      reject('Error getting quotations: ' + (event.target as IDBRequest).error);
    };
  });
};

const getQuotationById = async (id: string): Promise<Quotation | null> => {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('quotations', 'readonly');
    const store = transaction.objectStore('quotations');
    const request = store.get(id);
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result || null);
    };
    
    request.onerror = (event) => {
      reject('Error getting quotation: ' + (event.target as IDBRequest).error);
    };
  });
};

const deleteQuotation = async (id: string): Promise<void> => {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('quotations', 'readwrite');
    const store = transaction.objectStore('quotations');
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject('Error deleting quotation: ' + (event.target as IDBRequest).error);
    };
  });
};

export {
  initDatabase,
  saveCompanyInfo,
  getCompanyInfo,
  saveProduct,
  getProducts,
  deleteProduct,
  saveQuotation,
  getQuotations,
  getQuotationById,
  deleteQuotation,
  type Company,
  type Product,
  type QuotationItem,
  type Quotation,
};
