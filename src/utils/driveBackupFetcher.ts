
import { toast } from "sonner";
import type { BackupData } from "@/types/backupTypes";

// Utility to handle fetching the backup from pCloud Drive
export async function fetchBackupFromDrive(pCloudFileUrl: string): Promise<BackupData | null> {
  try {
    // Extract file ID from pCloud Drive URL
    const fileId = extractFileIdFromPCloudUrl(pCloudFileUrl);
    if (!fileId) {
      toast.error("URL de pCloud inválida", {
        description: "No se pudo extraer el ID del archivo"
      });
      return null;
    }

    // Create direct download link for pCloud
    const downloadUrl = `https://api.pcloud.com/getpublinkdownload?code=${fileId}`;
    
    // Local fallback for development/testing when pCloud API returns errors
    if (process.env.NODE_ENV === 'development') {
      try {
        // Attempt to fetch from pCloud first
        const response = await fetch(downloadUrl);
        const responseData = await response.json();
        
        // If pCloud returns an error, try the local fallback
        if (responseData.error) {
          console.warn("pCloud API error:", responseData.error, "Using local fallback data");
          return await fetchLocalBackupFallback();
        }
        
        // Continue with normal pCloud processing
        if (!responseData.hosts || !responseData.path) {
          console.warn("Invalid pCloud response format, using local fallback");
          return await fetchLocalBackupFallback();
        }
        
        // Process pCloud response normally
        const fileHost = responseData.hosts[0];
        const filePath = responseData.path;
        const actualDownloadUrl = `https://${fileHost}${filePath}`;
        
        const fileResponse = await fetch(actualDownloadUrl);
        const data = await fileResponse.json();
        
        if (!validateBackupData(data)) {
          toast.error("Formato de respaldo inválido", {
            description: "El archivo no contiene la estructura esperada para un respaldo"
          });
          return null;
        }
        
        toast.success("Datos cargados correctamente", {
          description: `Respaldo de ${new Date(data.timestamp).toLocaleString()}`
        });
        
        return data;
      } catch (error) {
        console.warn("Error with pCloud API, using local fallback:", error);
        return await fetchLocalBackupFallback();
      }
    } else {
      // Production flow - no fallback
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        toast.error("Error al descargar archivo", {
          description: `Error ${response.status}: ${response.statusText}`
        });
        return null;
      }
      
      const responseData = await response.json();
      
      // Check for pCloud error
      if (responseData.error) {
        toast.error("Error de pCloud API", {
          description: `Error ${responseData.result}: ${responseData.error}`
        });
        return null;
      }
      
      // pCloud returns a different structure than Google Drive
      if (!responseData.hosts || !responseData.path) {
        toast.error("Formato de respuesta inválido", {
          description: "La respuesta de pCloud no tiene el formato esperado"
        });
        return null;
      }
      
      // Create actual file download URL from pCloud response
      const fileHost = responseData.hosts[0];
      const filePath = responseData.path;
      const actualDownloadUrl = `https://${fileHost}${filePath}`;
      
      // Now fetch the actual JSON file
      const fileResponse = await fetch(actualDownloadUrl);
      
      if (!fileResponse.ok) {
        toast.error("Error al descargar archivo JSON", {
          description: `Error ${fileResponse.status}: ${fileResponse.statusText}`
        });
        return null;
      }
      
      const data = await fileResponse.json();
      
      // Validate backup data structure
      if (!validateBackupData(data)) {
        toast.error("Formato de respaldo inválido", {
          description: "El archivo no contiene la estructura esperada para un respaldo"
        });
        return null;
      }
      
      toast.success("Datos cargados correctamente", {
        description: `Respaldo de ${new Date(data.timestamp).toLocaleString()}`
      });
      
      return data;
    }
  } catch (error) {
    console.error("Error fetching backup from pCloud:", error);
    toast.error("Error al procesar el archivo", {
      description: error instanceof Error ? error.message : "Error desconocido"
    });
    
    // Try local fallback in development mode
    if (process.env.NODE_ENV === 'development') {
      return await fetchLocalBackupFallback();
    }
    return null;
  }
}

// Helper function to extract file ID from pCloud URL
export function extractFileIdFromPCloudUrl(url: string): string | null {
  try {
    // pCloud public links have format: https://u.pcloud.link/publink/show?code=XZxxxxxx
    // or https://my.pcloud.com/publink/show?code=XZxxxxxx
    const regex = /[?&]code=([^&#]*)/;
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error("Error extracting file ID from pCloud URL:", error);
    return null;
  }
}

// Local fallback for development/testing
async function fetchLocalBackupFallback(): Promise<BackupData | null> {
  try {
    // Sample minimal backup data for testing
    const sampleBackup: BackupData = {
      products: [
        { id: "p1", name: "Pizza Margarita", price: 120, category: "Pizzas", image: null },
        { id: "p2", name: "Pizza Pepperoni", price: 150, category: "Pizzas", image: null },
        { id: "p3", name: "Refresco Cola", price: 25, category: "Bebidas", image: null }
      ],
      customers: [
        { id: "c1", name: "Cliente Test", phone: "1234567890", orders: [] },
        { id: "c2", name: "Cliente Demo", phone: "0987654321", orders: [] }
      ],
      orders: [
        {
          id: "o1",
          customerId: "c1",
          items: [{ productId: "p1", quantity: 2, price: 120, name: "Pizza Margarita" }],
          total: 240,
          subtotal: 240,
          orderType: "mesa",
          status: "completed",
          createdAt: new Date(Date.now() - 86400000), // Yesterday
          paymentMethod: "efectivo"
        },
        {
          id: "o2",
          customerId: "c2",
          items: [
            { productId: "p2", quantity: 1, price: 150, name: "Pizza Pepperoni" },
            { productId: "p3", quantity: 2, price: 25, name: "Refresco Cola" }
          ],
          total: 200,
          subtotal: 200,
          orderType: "delivery",
          status: "completed",
          createdAt: new Date(),
          paymentMethod: "tarjeta"
        }
      ],
      tables: [],
      timestamp: new Date().toISOString()
    };

    toast.success("Datos de muestra cargados", {
      description: "Usando datos locales de prueba (modo desarrollo)"
    });
    
    return sampleBackup;
  } catch (error) {
    console.error("Error creating fallback data:", error);
    return null;
  }
}

// Validate backup data structure
function validateBackupData(data: any): data is BackupData {
  return (
    data &&
    typeof data === "object" &&
    Array.isArray(data.products) && 
    Array.isArray(data.customers) &&
    Array.isArray(data.orders) &&
    typeof data.timestamp === "string"
  );
}
