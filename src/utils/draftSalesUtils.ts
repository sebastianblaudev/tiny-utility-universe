
import { toast } from 'sonner';
import { ProductType } from '@/types';

export interface DraftSale {
  id: string;
  name: string;
  items: ProductType[];
  total: number;
  customer?: any;
  createdAt: string;
  notes?: string;
}

// Get all draft sales from local storage
export const getDraftSales = (): DraftSale[] => {
  try {
    const drafts = localStorage.getItem('pos_draft_sales');
    return drafts ? JSON.parse(drafts) : [];
  } catch (error) {
    console.error('Error loading draft sales:', error);
    return [];
  }
};

// Save a new draft sale to local storage
export const saveDraftSale = (cart: ProductType[], customer: any | null, notes?: string): string | null => {
  try {
    const drafts = getDraftSales();
    
    // Calculate total
    const total = cart.reduce((sum, item) => {
      return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);
    
    // Create a new draft with timestamp ID
    const newDraft: DraftSale = {
      id: `draft_${Date.now()}`,
      name: `Venta ${drafts.length + 1}`,
      items: cart,
      total,
      customer: customer || undefined,
      createdAt: new Date().toISOString(),
      notes
    };
    
    // Add to existing drafts and save
    localStorage.setItem('pos_draft_sales', JSON.stringify([...drafts, newDraft]));
    
    return newDraft.id;
  } catch (error) {
    console.error('Error saving draft sale:', error);
    toast.error('No se pudo guardar la venta');
    return null;
  }
};

// Delete a draft sale from local storage
export const deleteDraftSale = (id: string): boolean => {
  try {
    const drafts = getDraftSales();
    const filteredDrafts = drafts.filter(draft => draft.id !== id);
    localStorage.setItem('pos_draft_sales', JSON.stringify(filteredDrafts));
    return true;
  } catch (error) {
    console.error('Error deleting draft sale:', error);
    return false;
  }
};

// Update an existing draft sale
export const updateDraftSale = (id: string, updates: Partial<DraftSale>): boolean => {
  try {
    const drafts = getDraftSales();
    const updatedDrafts = drafts.map(draft => 
      draft.id === id ? { ...draft, ...updates } : draft
    );
    localStorage.setItem('pos_draft_sales', JSON.stringify(updatedDrafts));
    return true;
  } catch (error) {
    console.error('Error updating draft sale:', error);
    return false;
  }
};

// Rename a draft sale
export const renameDraftSale = (id: string, newName: string): boolean => {
  return updateDraftSale(id, { name: newName });
};
