
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

const CustomerDisplay2 = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [animateTotal, setAnimateTotal] = useState<boolean>(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>('Tienda');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const { toast } = useToast();
  
  useEffect(() => {
    document.title = 'Pantalla para Cliente v2';
    
    const now = new Date();
    setLastUpdateTime(now.toLocaleTimeString());
    
    // Get tenant ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlTenantId = urlParams.get('tenant');
    
    console.log("URL params:", {
      fullUrl: window.location.href,
      searchParams: window.location.search,
      urlTenantId
    });
    
    if (!urlTenantId) {
      setConnectionStatus('error');
      console.error('Error: Se requiere parámetro tenant en la URL');
      toast({
        title: "Error de configuración",
        description: "Se requiere especificar un tenant en la URL (ejemplo: ?tenant=mi-tienda)",
        variant: "destructive"
      });
      return;
    }
    
    setTenantId(urlTenantId);
    console.log(`Inicializando pantalla de cliente para tenant: ${urlTenantId}`);
    
    // Use a simple approach for tenant name instead of database query
    setTenantName(urlTenantId);
    
    // Usar un canal específico para este tenant
    const channelName = `customer-display-${urlTenantId}`;
    console.log(`Suscribiéndose al canal ${channelName}`);
    
    try {
      const channel = supabase.channel(channelName);
      
      channel
        .on('broadcast', { event: 'cart-update' }, (payload) => {
          console.log('Recibida actualización del carrito:', payload);
          
          // Verificar que el mensaje es para este tenant
          const payloadTenantId = payload.payload?.tenantId;
          if (payloadTenantId && payloadTenantId !== urlTenantId) {
            console.warn(`Ignorando mensaje para otro tenant (${payloadTenantId})`);
            return;
          }
          
          const { items: newItems, total: newTotal } = payload.payload;
          
          if (newTotal !== total) {
            setAnimateTotal(true);
            setTimeout(() => setAnimateTotal(false), 1000);
          }
          
          setItems(newItems || []);
          setTotal(newTotal || 0);
          
          const now = new Date();
          setLastUpdateTime(now.toLocaleTimeString());
        })
        .subscribe((status) => {
          console.log(`Estado de suscripción al canal ${channelName}:`, status);
          if (status === 'SUBSCRIBED') {
            console.log(`Suscripción exitosa al canal ${channelName}`);
            setConnectionStatus('connected');
            toast({
              title: "Conectado",
              description: `Pantalla conectada al canal ${urlTenantId}`,
              duration: 3000
            });
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionStatus('error');
            toast({
              title: "Error de conexión",
              description: "No se pudo conectar al canal de actualización",
              variant: "destructive"
            });
          }
        });
      
      // Cleanup function
      return () => {
        console.log(`Cancelando suscripción al canal ${channelName}`);
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error al crear o suscribirse al canal:', error);
      setConnectionStatus('error');
      toast({
        title: "Error de conexión",
        description: "No se pudo establecer la conexión con el servidor",
        variant: "destructive"
      });
    }
  }, [toast]);

  // If no tenant is provided, display clear instructions with debug information
  if (connectionStatus === 'error' && !tenantId) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-primary mb-6">Error de Configuración</h1>
          <div className="space-y-4">
            <p className="text-xl">Se requiere especificar un tenant en la URL.</p>
            <div className="bg-gray-700 p-4 rounded-md">
              <code className="text-green-400">
                {window.location.origin}/pantalla2<span className="text-yellow-400">?tenant=mi-tienda</span>
              </code>
            </div>
            <p>Donde <span className="font-semibold text-yellow-400">mi-tienda</span> es el identificador de su negocio.</p>
            
            <div className="mt-6 p-4 bg-gray-700 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Información de depuración:</h3>
              <p>URL actual: <code className="text-xs break-all">{window.location.href}</code></p>
              <p>Parámetros: <code className="text-xs">{window.location.search || "(ninguno)"}</code></p>
            </div>
            
            <p className="text-sm text-gray-400 mt-4">Contacte al administrador del sistema si necesita ayuda.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 flex flex-col text-white">
      <header className="bg-gray-800 rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          {tenantName} - <span className="text-primary">Detalle de su compra</span>
        </h1>
        <div className="text-right">
          <div className="text-lg text-gray-300">
            {connectionStatus === 'connected' ? (
              <span className="flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span> 
                Conectado
              </span>
            ) : connectionStatus === 'connecting' ? (
              <span className="flex items-center">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2 animate-pulse"></span> 
                Conectando...
              </span>
            ) : (
              <span className="flex items-center">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span> 
                Desconectado
              </span>
            )}
          </div>
          <div className="text-lg text-gray-400">
            Actualizado: {lastUpdateTime}
          </div>
          {tenantId && <div className="text-xs text-gray-500">ID: {tenantId}</div>}
        </div>
      </header>
      
      <main className="flex-1 bg-gray-800 rounded-lg shadow-md p-6 mb-6 overflow-auto">
        <div className="space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-3xl">No hay productos en el carrito</p>
              <p className="mt-4 text-xl">Esperando datos del punto de venta...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-4 text-xl">
                <div className="col-span-2">Producto</div>
                <div className="text-center">Cantidad</div>
                <div className="text-right">Precio</div>
              </div>
              
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-4 gap-4 py-4 border-b border-gray-700 text-white"
                  >
                    <div className="col-span-2 font-medium text-2xl">{item.name}</div>
                    <div className="text-center text-2xl">{item.quantity}</div>
                    <div className="text-right text-2xl">{formatCurrency(item.subtotal)}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
      
      <footer className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-300">TOTAL</h2>
          <motion.div
            animate={animateTotal ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
            className="text-5xl font-bold text-primary"
          >
            {formatCurrency(total)}
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerDisplay2;
