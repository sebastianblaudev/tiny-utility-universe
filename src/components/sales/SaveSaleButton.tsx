
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save as FileFloppy } from 'lucide-react';
import { saveDraftSale } from '@/utils/draftSalesUtils';
import { toast } from 'sonner';
import SavedDraftsDialog from './SavedDraftsDialog';
import { useCart } from '@/contexts/CartContext';

const SaveSaleButton: React.FC = () => {
  const [showDrafts, setShowDrafts] = useState(false);
  const { 
    cartItems: cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    updateNote, 
    clearCart: resetCart
  } = useCart();
  
  const customer = null;

  const handleSaveSale = () => {
    if (cart.length === 0) {
      toast.error('No hay productos en el carrito');
      return;
    }

    const draftId = saveDraftSale(cart, customer);
    if (draftId) {
      toast.success('Venta guardada correctamente');
    }
  };
  
  const handleLoadDraft = (draft: any) => {
    resetCart();
    draft.items.forEach((item: any) => {
      addToCart(item, item.quantity || 1);
      if (item.notes) {
        updateNote(item.id, item.notes);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSaveSale}
        disabled={cart.length === 0}
        title="Guardar venta"
        className="h-9"
      >
        <FileFloppy className="h-4 w-4 mr-1" />
        <span>Guardar</span>
      </Button>

      <SavedDraftsDialog 
        isOpen={showDrafts} 
        onClose={() => setShowDrafts(false)}
        onLoadDraft={handleLoadDraft}
      />
    </>
  );
};

export default SaveSaleButton;
