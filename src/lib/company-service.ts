
export interface Company {
  id: string;
  name: string;
  rut: string;
  address: string;
  email: string;
  phone: string;
  logo?: string; // Base64 encoded image
  createdAt: string;
  updatedAt: string;
}

class CompanyService {
  private dbName = 'CotiProDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('companies')) {
          const store = db.createObjectStore('companies', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  async getCompany(): Promise<Company | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['companies'], 'readonly');
      const store = transaction.objectStore('companies');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const companies = request.result;
        resolve(companies.length > 0 ? companies[0] : null);
      };
    });
  }

  async saveCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    if (!this.db) await this.init();

    const existingCompany = await this.getCompany();
    const now = new Date().toISOString();
    
    const companyData: Company = {
      id: existingCompany?.id || crypto.randomUUID(),
      ...company,
      createdAt: existingCompany?.createdAt || now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['companies'], 'readwrite');
      const store = transaction.objectStore('companies');
      const request = store.put(companyData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(companyData);
    });
  }
}

export const companyService = new CompanyService();
