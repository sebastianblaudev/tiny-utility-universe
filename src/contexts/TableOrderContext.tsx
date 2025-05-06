import React, { createContext, useState, useContext, useCallback } from 'react';
import { getTableOrder, markItemsAsSentToKitchen, getNewOrderItems } from '@/lib/db';
import { Order, OrderItem } from '@/lib/db';
import { useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface TableOrderContextType {
  activeTable: string | null;
  setActiveTable: (table: string | null) => void;
  isTableOrderDialogOpen: boolean;
  openTableOrderDialog: () => void;
  closeTableOrderDialog: () => void;
  loadExistingTableOrder: (tableNumber: string) => Promise<Order | null>;
  handleOrderSaved: () => void;
  handleLoadExistingOrder: (order: Order) => void;
  updateItemNote: (itemIndex: number, note: string) => void;
  getNewItems: (tableNumber: string) => Promise<OrderItem[]>;
  markItemsAsSent: (tableNumber: string, itemIds: string[]) => Promise<boolean>;
  showSavedOrdersDialog: () => void;
  showSavedOrdersOnly: boolean;
}

const TableOrderContext = createContext<TableOrderContextType | null>(null);

export const useTableOrder = () => {
  const context = useContext(TableOrderContext);
  if (!context) {
    throw new Error('useTableOrder must be used within a TableOrderProvider');
  }
  return context;
};

interface TableOrderProviderProps {
  children: React.ReactNode;
  cart: any[];
  setCart: (cart: any[]) => void;
  clearCart: () => void;
}

export const TableOrderProvider: React.FC<TableOrderProviderProps> = ({ 
  children, 
  cart, 
  setCart,
  clearCart
}) => {
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [isTableOrderDialogOpen, setIsTableOrderDialogOpen] = useState<boolean>(false);
  const [showSavedOrdersOnly, setShowSavedOrdersOnly] = useState<boolean>(false);
  const location = useLocation();

  // Check if we have a selected table from navigation
  React.useEffect(() => {
    const state = location.state as { selectedTable?: string; orderType?: string } | null;
    
    if (state?.selectedTable) {
      setActiveTable(state.selectedTable);
      loadExistingTableOrder(state.selectedTable);
    }
  }, [location]);

  const loadExistingTableOrder = useCallback(async (tableNumber: string) => {
    if (!tableNumber) return null;
    
    try {
      const tableNumberAsInt = parseInt(tableNumber, 10);
      const orderData = await getTableOrder(tableNumberAsInt);
      
      if (orderData && orderData.items && orderData.items.length > 0) {
        console.log("Found existing order for table:", orderData);
        return orderData;
      }
      return null;
    } catch (error) {
      console.error("Error loading table order:", error);
      return null;
    }
  }, []);

  const openTableOrderDialog = () => setIsTableOrderDialogOpen(true);
  const closeTableOrderDialog = () => {
    setIsTableOrderDialogOpen(false);
    setShowSavedOrdersOnly(false); // Reset the flag when closing
  };

  const handleOrderSaved = () => {
    clearCart();
    closeTableOrderDialog();
  };

  const handleLoadExistingOrder = (order: Order) => {
    if (order && order.items) {
      // Solo cargar los items que no han sido enviados a cocina
      const cartItems = order.items
        .filter(item => !item.sentToKitchen)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          notes: item.notes,
          extras: item.extras || [],
          productId: item.productId
        }));
      
      setCart(cartItems);
      
      if (order.tableNumber) {
        setActiveTable(order.tableNumber.toString());
      }
      
      // Mostrar mensaje informativo sobre los items ya enviados a cocina
      const sentItems = order.items.filter(item => item.sentToKitchen);
      if (sentItems.length > 0) {
        toast({
          title: "Información",
          description: `${sentItems.length} productos ya fueron enviados a cocina y no aparecen en el carrito`,
          variant: "default"
        });
      }
    }
  };

  const getNewItems = async (tableNumber: string) => {
    if (!tableNumber) return [];
    
    try {
      const tableNumberAsInt = parseInt(tableNumber, 10);
      const newItems = await getNewOrderItems(tableNumberAsInt);
      return newItems || [];
    } catch (error) {
      console.error("Error getting new items:", error);
      return [];
    }
  };

  const markItemsAsSent = async (tableNumber: string, itemIds: string[]) => {
    if (!tableNumber || !itemIds || itemIds.length === 0) return false;
    
    try {
      const tableNumberAsInt = parseInt(tableNumber, 10);
      const result = await markItemsAsSentToKitchen(tableNumberAsInt, itemIds);
      return result;
    } catch (error) {
      console.error("Error marking items as sent:", error);
      return false;
    }
  };

  // Fix the type error by specifying the correct return type
  const updateItemNote = (itemIndex: number, note: string) => {
    if (itemIndex < 0 || itemIndex >= cart.length) return;
    
    const newCart = [...cart];
    newCart[itemIndex] = {
      ...newCart[itemIndex],
      notes: note
    };
    setCart(newCart);

    toast({
      title: "Comentario guardado",
      description: "El comentario ha sido agregado al producto",
      variant: "default"
    });
  };

  const showSavedOrdersDialog = () => {
    setShowSavedOrdersOnly(true);
    setIsTableOrderDialogOpen(true);
  };

  return (
    <TableOrderContext.Provider value={{
      activeTable,
      setActiveTable,
      isTableOrderDialogOpen,
      openTableOrderDialog,
      closeTableOrderDialog,
      loadExistingTableOrder,
      handleOrderSaved,
      handleLoadExistingOrder,
      updateItemNote,
      getNewItems,
      markItemsAsSent,
      showSavedOrdersDialog,
      showSavedOrdersOnly
    }}>
      {children}
    </TableOrderContext.Provider>
  );
};
