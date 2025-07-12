import { processLogoImage } from './imageUtils';

const DB_NAME = 'BusinessLogoStorage';
const DB_VERSION = 1;
const STORE_NAME = 'logos';

export interface BusinessLogo {
  id: string;
  data: string; // base64 encoded image
  filename: string;
  lastUpdated: number;
}

class LogoDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async saveLogo(tenantId: string, file: File): Promise<boolean> {
    if (!this.db) await this.init();
    
    try {
      // Process the image (convert to grayscale and optimize)
      const processedFile = await processLogoImage(file);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const logo: BusinessLogo = {
            id: tenantId,
            data: reader.result as string,
            filename: processedFile.name,
            lastUpdated: Date.now()
          };

          const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.put(logo);

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(processedFile);
      });
    } catch (error) {
      console.error('Error processing logo image:', error);
      return false;
    }
  }

  async getLogo(tenantId: string): Promise<BusinessLogo | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(tenantId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteLogo(tenantId: string): Promise<boolean> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(tenantId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

const logoDB = new LogoDB();

export const saveBusinessLogo = async (tenantId: string, file: File): Promise<boolean> => {
  try {
    return await logoDB.saveLogo(tenantId, file);
  } catch (error) {
    console.error('Error saving logo:', error);
    return false;
  }
};

export const getBusinessLogo = async (tenantId: string): Promise<BusinessLogo | null> => {
  try {
    return await logoDB.getLogo(tenantId);
  } catch (error) {
    console.error('Error getting logo:', error);
    return null;
  }
};

export const deleteBusinessLogo = async (tenantId: string): Promise<boolean> => {
  try {
    return await logoDB.deleteLogo(tenantId);
  } catch (error) {
    console.error('Error deleting logo:', error);
    return false;
  }
};
