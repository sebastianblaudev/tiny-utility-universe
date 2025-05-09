
import { toast } from "sonner";
import type { BackupData } from "@/types/backupTypes";

// Función para obtener datos de respaldo desde una URL remota
export async function fetchRemoteBackup(url: string): Promise<BackupData | null> {
  try {
    if (!url) {
      toast.error("URL inválida", {
        description: "Por favor, ingresa una URL válida"
      });
      return null;
    }
    
    // Intentar obtener el archivo JSON con modo no-cors para evitar problemas CORS
    console.log("Intentando fetch con modo no-cors:", url);
    const response = await fetch(url, {
      mode: 'no-cors',
      headers: {
        'Accept': 'application/json'
      }
    }).catch(error => {
      console.error("Error en fetch inicial:", error);
      // Si falla con no-cors, intentar con el modo predeterminado
      return fetch(url);
    });
    
    // Cuando usamos no-cors, la respuesta será de tipo "opaque" y no podemos acceder al contenido directamente
    // En este caso, intentamos usar datos de muestra en modo desarrollo
    if (response.type === 'opaque') {
      console.log("Respuesta opaca recibida, usando datos de muestra");
      return await fetchLocalBackupFallback(url);
    }
    
    if (!response.ok) {
      toast.error(`Error ${response.status}`, {
        description: `No se pudo obtener el archivo: ${response.statusText}`
      });
      return null;
    }
    
    const data = await response.json();
    
    // Verificar que los datos tengan la estructura esperada
    if (!data || !data.data || !data.timestamp) {
      toast.error("Formato de respaldo inválido", {
        description: "El archivo no contiene la estructura correcta"
      });
      return null;
    }
    
    // Recuperar datos de la estructura esperada
    const backupData: BackupData = {
      products: data.data.products || [],
      customers: data.data.customers || [],
      orders: data.data.orders || [],
      tables: data.data.tables || [],
      timestamp: data.timestamp,
      business: {
        id: data.businessId || "",
        name: data.businessName || "Mi Negocio",
        email: typeof data.businessId === 'string' && data.businessId.includes('@') ? data.businessId : ""
      }
    };
    
    toast.success("Datos cargados correctamente", {
      description: `Respaldo de ${new Date(data.timestamp).toLocaleString()}`
    });
    
    return backupData;
  } catch (error) {
    console.error("Error al cargar respaldo remoto:", error);
    
    // En caso de error CORS o cualquier otro error, usar datos de ejemplo
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      toast.error("Error CORS al acceder al archivo", {
        description: "Usando datos de respaldo de demostración"
      });
      return await fetchLocalBackupFallback(url);
    }
    
    toast.error("Error al procesar el archivo", {
      description: error instanceof Error ? error.message : "Error desconocido"
    });
    
    return null;
  }
}

// Función para extraer información de la URL para los datos de muestra
function extractBusinessInfoFromUrl(url: string) {
  try {
    // Intentar extraer el nombre del negocio de la URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const emailPart = fileName.split('_')[0];
    
    return {
      email: decodeURIComponent(emailPart),
      name: emailPart.split('@')[0] || "Mi Negocio"
    };
  } catch (e) {
    return {
      email: "negocio@ejemplo.com",
      name: "Mi Negocio"
    };
  }
}

// Local fallback para desarrollo/testing
async function fetchLocalBackupFallback(url: string): Promise<BackupData> {
  try {
    const businessInfo = extractBusinessInfoFromUrl(url);
    const currentDate = new Date();
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    
    // Crear datos de ventas para la última semana
    const dailySales = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      dailySales.push({
        date: date.toISOString(),
        sales: Math.floor(Math.random() * 8000) + 2000
      });
    }
    
    // Datos de prueba más detallados
    const sampleBackup: BackupData = {
      products: [
        { id: "p1", name: "Pizza Margarita", price: 120, category: "Pizzas", image: null },
        { id: "p2", name: "Pizza Pepperoni", price: 150, category: "Pizzas", image: null },
        { id: "p3", name: "Pizza Hawaiana", price: 140, category: "Pizzas", image: null },
        { id: "p4", name: "Refresco Cola", price: 25, category: "Bebidas", image: null },
        { id: "p5", name: "Agua Mineral", price: 20, category: "Bebidas", image: null },
        { id: "p6", name: "Cerveza", price: 35, category: "Bebidas", image: null }
      ],
      customers: [
        { id: "c1", name: "Cliente A", phone: "1234567890", orders: [] },
        { id: "c2", name: "Cliente B", phone: "0987654321", orders: [] },
        { id: "c3", name: "Cliente C", phone: "5556667777", orders: [] },
        { id: "c4", name: "Cliente D", phone: "9998887777", orders: [] }
      ],
      orders: [
        // Órdenes del día actual
        {
          id: "o1",
          customerId: "c1",
          items: [
            { productId: "p1", quantity: 2, price: 120, name: "Pizza Margarita" },
            { productId: "p4", quantity: 2, price: 25, name: "Refresco Cola" }
          ],
          total: 290,
          subtotal: 290,
          orderType: "mesa",
          status: "completed",
          createdAt: new Date(),
          paymentMethod: "efectivo"
        },
        {
          id: "o2",
          customerId: "c2",
          items: [
            { productId: "p2", quantity: 1, price: 150, name: "Pizza Pepperoni" },
            { productId: "p6", quantity: 2, price: 35, name: "Cerveza" }
          ],
          total: 220,
          subtotal: 220,
          orderType: "delivery",
          status: "completed",
          createdAt: new Date(),
          paymentMethod: "tarjeta"
        },
        // Órdenes de ayer
        {
          id: "o3",
          customerId: "c3",
          items: [
            { productId: "p3", quantity: 1, price: 140, name: "Pizza Hawaiana" },
            { productId: "p5", quantity: 3, price: 20, name: "Agua Mineral" }
          ],
          total: 200,
          subtotal: 200,
          orderType: "llevar",
          status: "completed",
          createdAt: yesterday,
          paymentMethod: "efectivo"
        },
        {
          id: "o4",
          customerId: "c4",
          items: [
            { productId: "p1", quantity: 1, price: 120, name: "Pizza Margarita" },
            { productId: "p2", quantity: 1, price: 150, name: "Pizza Pepperoni" }
          ],
          total: 270,
          subtotal: 270,
          orderType: "mesa",
          status: "completed",
          createdAt: yesterday,
          paymentMethod: "transferencia"
        }
      ],
      tables: [],
      timestamp: new Date().toISOString(),
      business: {
        id: businessInfo.email,
        name: businessInfo.name,
        email: businessInfo.email
      }
    };

    // Crear órdenes para los últimos 7 días
    for (let i = 2; i <= 6; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const numOrders = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numOrders; j++) {
        const orderId = `o${sampleBackup.orders.length + 1}`;
        const customerId = `c${Math.floor(Math.random() * 4) + 1}`;
        const pizzaId = `p${Math.floor(Math.random() * 3) + 1}`;
        const drinkId = `p${Math.floor(Math.random() * 3) + 4}`;
        
        const pizzaPrice = sampleBackup.products.find(p => p.id === pizzaId)?.price || 120;
        const drinkPrice = sampleBackup.products.find(p => p.id === drinkId)?.price || 25;
        
        const pizzaName = sampleBackup.products.find(p => p.id === pizzaId)?.name || "Pizza";
        const drinkName = sampleBackup.products.find(p => p.id === drinkId)?.name || "Bebida";
        
        const pizzaQty = Math.floor(Math.random() * 2) + 1;
        const drinkQty = Math.floor(Math.random() * 3) + 1;
        
        const orderTotal = (pizzaPrice * pizzaQty) + (drinkPrice * drinkQty);
        
        const paymentMethods = ["efectivo", "tarjeta", "transferencia"];
        const orderTypes = ["mesa", "delivery", "llevar"];
        
        sampleBackup.orders.push({
          id: orderId,
          customerId,
          items: [
            { productId: pizzaId, quantity: pizzaQty, price: pizzaPrice, name: pizzaName },
            { productId: drinkId, quantity: drinkQty, price: drinkPrice, name: drinkName }
          ],
          total: orderTotal,
          subtotal: orderTotal,
          orderType: orderTypes[Math.floor(Math.random() * orderTypes.length)],
          status: "completed",
          createdAt: date,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
        });
      }
    }

    toast.success("Datos de muestra cargados", {
      description: "Usando datos de demostración para visualización"
    });
    
    return sampleBackup;
  } catch (error) {
    console.error("Error creating fallback data:", error);
    return {
      products: [],
      customers: [],
      orders: [],
      tables: [],
      timestamp: new Date().toISOString(),
      business: {
        id: "",
        name: "Error en datos",
        email: ""
      }
    };
  }
}

