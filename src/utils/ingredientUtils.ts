
import { supabase } from "@/integrations/supabase/client";
import { ProductType } from "@/types";

// Define the Ingredient type
export interface Ingredient {
  id?: string;
  name: string;
  stock?: number;
  unit?: string;
  reorder_level?: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

// Get all ingredients
export const getIngredients = async (): Promise<Ingredient[]> => {
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching ingredients:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getIngredients:', error);
    return [];
  }
};

// Add a new ingredient
export const addIngredient = async (ingredient: Ingredient): Promise<{ success: boolean, data?: Ingredient, error?: string }> => {
  try {
    // Ensure name is not empty
    if (!ingredient.name?.trim()) {
      return { 
        success: false, 
        error: 'El nombre del ingrediente es obligatorio' 
      };
    }
    
    const { data, error } = await supabase
      .from('ingredients')
      .insert([ingredient])
      .select()
      .single();
    
    if (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    return { 
      success: true, 
      data 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

// Update an ingredient
export const updateIngredient = async (id: string, updates: Partial<Ingredient>): Promise<{ success: boolean, data?: Ingredient, error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    return { 
      success: true, 
      data 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

// Delete an ingredient
export const deleteIngredient = async (id: string): Promise<{ success: boolean, error?: string }> => {
  try {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);
    
    if (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

// Reduce ingredient stock when a product is sold
export const reduceIngredientStock = async (items: ProductType[]): Promise<void> => {
  try {
    // Get all product-ingredient relationships for the sold products
    const productIds = items.map(item => item.id);
    
    const { data: relationships, error: relError } = await supabase
      .from('product_ingredients')
      .select('*')
      .in('product_id', productIds);
    
    if (relError) {
      console.error('Error fetching product ingredients:', relError);
      return;
    }
    
    if (!relationships || relationships.length === 0) {
      // No ingredients associated with these products
      return;
    }
    
    // Calculate the amount to reduce for each ingredient
    const ingredientReductions: Record<string, number> = {};
    
    relationships.forEach(rel => {
      const item = items.find(i => i.id === rel.product_id);
      if (item && item.quantity) {
        const totalAmount = rel.amount * item.quantity;
        
        if (ingredientReductions[rel.ingredient_id]) {
          ingredientReductions[rel.ingredient_id] += totalAmount;
        } else {
          ingredientReductions[rel.ingredient_id] = totalAmount;
        }
      }
    });
    
    // Get current stock for these ingredients
    const ingredientIds = Object.keys(ingredientReductions);
    
    const { data: ingredients, error: ingError } = await supabase
      .from('ingredients')
      .select('id, stock')
      .in('id', ingredientIds);
    
    if (ingError) {
      console.error('Error fetching ingredient stock:', ingError);
      return;
    }
    
    // Update stock for each ingredient
    for (const ingredient of ingredients || []) {
      const reduction = ingredientReductions[ingredient.id];
      const newStock = Math.max(0, (ingredient.stock || 0) - reduction);
      
      const { error: updateError } = await supabase
        .from('ingredients')
        .update({ stock: newStock })
        .eq('id', ingredient.id);
      
      if (updateError) {
        console.error(`Error updating stock for ingredient ${ingredient.id}:`, updateError);
      }
      
      // Record the transaction
      await supabase
        .from('ingredient_transactions')
        .insert({
          ingredient_id: ingredient.id,
          amount: -reduction,
          transaction_type: 'sale',
          notes: `Reducción automática por venta de productos`
        });
    }
  } catch (error) {
    console.error('Error in reduceIngredientStock:', error);
  }
};
