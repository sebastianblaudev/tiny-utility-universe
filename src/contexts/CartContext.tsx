
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ProductType } from '@/types';
import { 
  addItemToCart, 
  removeItemFromCart, 
  updateItemQuantity, 
  updateItemNote,
  calculateCartTotal 
} from '@/utils/cartUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCurrentCashier } from '@/utils/turnosUtils';
import { associateSaleWithActiveTurno } from '@/utils/salesUtils';

interface CartContextType {
  cartItems: ProductType[];
  addToCart: (product: ProductType, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNote: (productId: string, note: string) => void;
  clearCart: () => void;
  cartTotal: number;
  broadcastCartToCustomerDisplay: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

// Extend Window interface for SII integration
declare global {
  interface Window {
    cartItemsForSII?: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
      notes?: string;
    }>;
  }
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<ProductType[]>([]);
  const { tenantId } = useAuth();
  const cartTotal = calculateCartTotal(cartItems);
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState<any>(null);

  const addToCart = (product: ProductType, quantity: number = 1) => {
    setCartItems(currentItems => addItemToCart(currentItems, product, quantity));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(currentItems => removeItemFromCart(currentItems, productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems(currentItems => updateItemQuantity(currentItems, productId, quantity));
  };

  const updateNote = (productId: string, note: string) => {
    setCartItems(currentItems => updateItemNote(currentItems, productId, note));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const associateSaleWithCurrentTurno = async (saleId: string) => {
    if (!tenantId) return;
    
    const currentCashier = getCurrentCashier();
    
    if (currentCashier && currentCashier.active) {
      await associateSaleWithActiveTurno(saleId, currentCashier.name, tenantId);
    }
  };

  useEffect(() => {
    const handleSaleCompleted = async (event: CustomEvent) => {
      const { saleId } = event.detail;
      if (saleId) {
        await associateSaleWithCurrentTurno(saleId);
      }
    };
    
    window.addEventListener('sale-completed' as any, handleSaleCompleted as EventListener);
    
    return () => {
      window.removeEventListener('sale-completed' as any, handleSaleCompleted as EventListener);
    };
  }, [tenantId]);

  const broadcastCartToCustomerDisplay = () => {
    const effectiveTenantId = tenantId || localStorage.getItem('current_tenant_id');
    
    if (!effectiveTenantId) {
      console.warn('No se puede transmitir el carrito sin tenant_id');
      toast({
        title: "Error",
        description: "No se pudo determinar el ID del negocio para transmitir el carrito",
        variant: "destructive"
      });
      return;
    }

    const formattedItems = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price,
      subtotal: (item.price * (item.quantity || 1)),
      notes: item.notes || '' // Include notes in customer display
    }));

    const payload = {
      items: formattedItems,
      total: cartTotal,
      tenantId: effectiveTenantId
    };
    
    const channelName = `customer-display-${effectiveTenantId}`;
    
    console.log(`Enviando actualización de carrito a canal: ${channelName}`, {
      totalItems: formattedItems.length,
      total: cartTotal,
      tenantId: effectiveTenantId,
      channelActive: !!activeChannel
    });
    
    try {
      if (!activeChannel) {
        const channel = supabase.channel(channelName);
        
        channel.subscribe((status) => {
          console.log(`Estado de la suscripción al canal ${channelName}:`, status);
          
          if (status === 'SUBSCRIBED') {
            console.log(`Canal ${channelName} suscrito, guardando referencia y enviando mensaje...`);
            setActiveChannel(channel);
            
            sendCartUpdate(channel, payload);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error al suscribirse al canal ${channelName}`);
            toast({
              title: "Error de conexión",
              description: "No se pudo conectar al canal para la pantalla del cliente",
              variant: "destructive"
            });
          }
        });
      } else {
        sendCartUpdate(activeChannel, payload);
      }
    } catch (error) {
      console.error('Error al crear o suscribirse al canal:', error);
      toast({
        title: "Error",
        description: "Error al transmitir datos a la pantalla del cliente",
        variant: "destructive"
      });
    }
  };

  const sendCartUpdate = (channel: any, payload: any) => {
    // Save cart items for SII integration
    window.cartItemsForSII = payload.items.map((item: any) => ({
      ...item,
      quantity: item.quantity,
      price: item.price
    }));
    
    channel.send({
      type: 'broadcast',
      event: 'cart-update',
      payload
    })
    .then(() => {
      console.log('Mensaje enviado con éxito');
    })
    .catch((error: any) => {
      console.error('Error al enviar mensaje:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar actualización a la pantalla del cliente",
        variant: "destructive"
      });
    });
  };

  useEffect(() => {
    return () => {
      if (activeChannel) {
        console.log('Limpiando canal al desmontar componente');
        supabase.removeChannel(activeChannel);
      }
    };
  }, [activeChannel]);

  useEffect(() => {
    const effectiveTenantId = tenantId || localStorage.getItem('current_tenant_id');
    
    if (cartItems.length > 0 && effectiveTenantId) {
      console.log('Carrito actualizado, transmitiendo cambios...');
      broadcastCartToCustomerDisplay();
    }
  }, [cartItems, cartTotal, tenantId]);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateNote,
      clearCart,
      cartTotal,
      broadcastCartToCustomerDisplay
    }}>
      {children}
    </CartContext.Provider>
  );
};
