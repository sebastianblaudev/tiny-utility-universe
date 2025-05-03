
import React, { createContext, useState, useContext, useCallback } from 'react';
import { getTableOrder } from '@/lib/db';
import { Order } from '@/lib/db';
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
  updateItemNote: (itemIndex: number, note: string) => void; // New function to update item notes
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
  const closeTableOrderDialog = () => setIsTableOrderDialogOpen(false);

  const handleOrderSaved = () => {
    clearCart();
    closeTableOrderDialog();
  };

  const handleLoadExistingOrder = (order: Order) => {
    if (order && order.items) {
      const cartItems = order.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        notes: item.notes,
        productId: item.productId
      }));
      
      setCart(cartItems);
      
      if (order.tableNumber) {
        setActiveTable(order.tableNumber.toString());
      }
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
      updateItemNote
    }}>
      {children}
    </TableOrderContext.Provider>
  );
};
