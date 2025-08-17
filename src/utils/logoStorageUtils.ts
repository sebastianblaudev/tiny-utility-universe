import { processLogoImage } from './imageUtils';
import { supabase } from '@/integrations/supabase/client';

const DB_NAME = 'BusinessLogoStorage';
const DB_VERSION = 1;
const STORE_NAME = 'logos';

export interface BusinessLogo {
  id: string;
  data: string; // base64 encoded image
  filename: string;
  lastUpdated: number;
}

// Supabase logo storage functions
export const saveBusinessLogoToDatabase = async (tenantId: string, file: File): Promise<boolean> => {
  try {
    console.log('Processing and saving logo to database...');
    
    // Process the image (convert to grayscale and optimize)
    const processedFile = await processLogoImage(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const logoData = reader.result as string;
          
          // First, check if user metadata exists and update it
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          
          if (user) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                ...user.user_metadata,
                businessLogo: logoData,
                logoFilename: processedFile.name,
                logoLastUpdated: Date.now()
              }
            });
            
            if (updateError) {
              console.error('Error updating user metadata with logo:', updateError);
              throw updateError;
            }
          }
          
          console.log('Logo saved successfully to user metadata');
          resolve(true);
        } catch (error) {
          console.error('Error saving logo to database:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(processedFile);
    });
  } catch (error) {
    console.error('Error processing logo image:', error);
    return false;
  }
};

export const getBusinessLogoFromDatabase = async (tenantId: string): Promise<BusinessLogo | null> => {
  try {
    console.log('Getting business logo from database...');
    
    // First try to get from user metadata
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    if (user?.user_metadata?.businessLogo) {
      console.log('Logo found in user metadata');
      return {
        id: tenantId,
        data: user.user_metadata.businessLogo,
        filename: user.user_metadata.logoFilename || 'logo.png',
        lastUpdated: user.user_metadata.logoLastUpdated || Date.now()
      };
    }
    
    // Fallback to IndexedDB for backwards compatibility
    console.log('Logo not found in user metadata, checking IndexedDB...');
    return await getBusinessLogoFromIndexedDB(tenantId);
    
  } catch (error) {
    console.error('Error getting logo from database:', error);
    // Fallback to IndexedDB
    return await getBusinessLogoFromIndexedDB(tenantId);
  }
};

// IndexedDB fallback functions (for backwards compatibility)
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
}

const logoDB = new LogoDB();

const getBusinessLogoFromIndexedDB = async (tenantId: string): Promise<BusinessLogo | null> => {
  try {
    return await logoDB.getLogo(tenantId);
  } catch (error) {
    console.error('Error getting logo from IndexedDB:', error);
    return null;
  }
};

// Main public functions that try database first, then IndexedDB
export const saveBusinessLogo = async (tenantId: string, file: File): Promise<boolean> => {
  try {
    // Always save to database now
    return await saveBusinessLogoToDatabase(tenantId, file);
  } catch (error) {
    console.error('Error saving logo:', error);
    return false;
  }
};

export const getBusinessLogo = async (tenantId: string): Promise<BusinessLogo | null> => {
  try {
    return await getBusinessLogoFromDatabase(tenantId);
  } catch (error) {
    console.error('Error getting logo:', error);
    return null;
  }
};

export const deleteBusinessLogo = async (tenantId: string): Promise<boolean> => {
  try {
    console.log('Deleting business logo from database...');
    
    // Delete from user metadata
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    if (user) {
      const updatedMetadata = { ...user.user_metadata };
      delete updatedMetadata.businessLogo;
      delete updatedMetadata.logoFilename;
      delete updatedMetadata.logoLastUpdated;
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: updatedMetadata
      });
      
      if (updateError) {
        console.error('Error deleting logo from user metadata:', updateError);
        throw updateError;
      }
    }
    
    console.log('Logo deleted successfully from user metadata');
    return true;
  } catch (error) {
    console.error('Error deleting logo:', error);
    return false;
  }
};
