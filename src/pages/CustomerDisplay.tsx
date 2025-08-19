
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils/ticketUtils';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

const CustomerDisplay = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [animateTotal, setAnimateTotal] = useState<boolean>(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const { tenantId: authTenantId } = useAuth();
  
  useEffect(() => {
    document.title = 'Pantalla para Cliente';
    
    const now = new Date();
    setLastUpdateTime(now.toLocaleTimeString());
    
    // Get tenant ID either from auth context, URL parameter, or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlTenantId = urlParams.get('tenant');
    const localStorageTenantId = localStorage.getItem('current_tenant_id');
    const effectiveTenantId = urlTenantId || authTenantId || localStorageTenantId;
    
    if (!effectiveTenantId) {
      console.error('No se pudo obtener tenant_id para la pantalla del cliente');
      return;
    }
    
    setTenantId(effectiveTenantId);
    console.log(`Inicializando pantalla de cliente para tenant: ${effectiveTenantId}`);
    console.log(`Suscribiéndose al canal customer-display-${effectiveTenantId}`);
    
    // Usar un canal específico para este tenant
    const channelName = `customer-display-${effectiveTenantId}`;
    const channel = supabase.channel(channelName);
    
    channel
      .on('broadcast', { event: 'cart-update' }, (payload) => {
        console.log('Recibida actualización del carrito:', payload);
        
        // Verificar que el mensaje es para este tenant
        const payloadTenantId = payload.payload?.tenantId;
        if (payloadTenantId && payloadTenantId !== effectiveTenantId) {
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
        }
      });
    
    return () => {
      console.log(`Cancelando suscripción al canal ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [authTenantId]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-6 flex flex-col">
      <header className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">Detalle de su compra</h1>
        <div className="text-lg text-gray-500 dark:text-gray-400">
          Actualizado: {lastUpdateTime}
          {tenantId && <div className="text-xs text-gray-400">Tenant: {tenantId.slice(0, 8)}...</div>}
        </div>
      </header>
      
      <main className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-6">
        <div className="space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-2xl">No hay productos en el carrito</p>
              <p className="mt-2 text-xl">Consulte con el vendedor para añadir productos</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 font-semibold text-gray-600 dark:text-gray-300 border-b pb-2 mb-4 text-xl">
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
                    className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                  >
                    <div className="col-span-2 font-medium text-xl md:text-2xl">{item.name}</div>
                    <div className="text-center text-xl md:text-2xl">{item.quantity}</div>
                    <div className="text-right text-xl md:text-2xl">{formatCurrency(item.price)}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-300">TOTAL</h2>
          <motion.div
            animate={animateTotal ? { scale: [1, 1.1, 1] } : {}}
            className="text-4xl md:text-5xl font-bold text-primary"
          >
            {formatCurrency(total)}
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerDisplay;
