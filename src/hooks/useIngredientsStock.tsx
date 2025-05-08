
import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";

type Ingredient = {
  id: string;
  name: string;
  stock: number;
  quantity?: number;
};

type ProductIngredient = {
  id: string;
  name: string;
  quantity: number;
  sizeQuantities?: {
    personal?: number;
    mediana?: number;
    familiar?: number;
    [key: string]: number | undefined;
  };
};

export const useIngredientsStock = (lowThreshold = 200, criticalThreshold = 100) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lowStockIngredients, setLowStockIngredients] = useState<Ingredient[]>([]);
  const [criticalStockIngredients, setCriticalStockIngredients] = useState<Ingredient[]>([]);
  
  useEffect(() => {
    const loadIngredients = () => {
      try {
        const stored = localStorage.getItem("ingredients");
        if (stored) {
          const parsedIngredients = JSON.parse(stored);
          setIngredients(parsedIngredients);
          
          // Filter ingredients with low stock
          const lowStock = parsedIngredients.filter((ing: Ingredient) => 
            ing.stock <= lowThreshold && ing.stock > criticalThreshold
          );
          setLowStockIngredients(lowStock);
          
          // Filter ingredients with critical stock
          const criticalStock = parsedIngredients.filter((ing: Ingredient) => 
            ing.stock <= criticalThreshold
          );
          setCriticalStockIngredients(criticalStock);
        }
      } catch (error) {
        console.error("Error loading ingredients for stock monitoring:", error);
      }
    };
    
    loadIngredients();
    
    // Set up event listener for ingredient updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ingredients") {
        loadIngredients();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Refresh every 5 minutes
    const intervalId = setInterval(loadIngredients, 300000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [lowThreshold, criticalThreshold]);
  
  const getIngredientQuantityForSize = (ingredient: ProductIngredient, size?: string): number => {
    if (!size || !ingredient.sizeQuantities) {
      return ingredient.quantity;
    }
    
    // Return size-specific quantity if available, otherwise calculate based on the base quantity
    const sizeQuantity = ingredient.sizeQuantities[size];
    if (sizeQuantity !== undefined) {
      return sizeQuantity;
    }
    
    // Default multipliers if no specific quantity is set
    switch (size) {
      case 'personal': return ingredient.quantity;
      case 'mediana': return Math.round(ingredient.quantity * 1.5);
      case 'familiar': return ingredient.quantity * 2;
      default: return ingredient.quantity;
    }
  };
  
  const checkProductIngredients = (productIngredients: ProductIngredient[], size?: string) => {
    if (!productIngredients || !productIngredients.length) return { safe: true };
    
    console.log(`Checking product ingredients for size: ${size || 'default'}`);
    
    const lowStockFound = productIngredients.filter(prodIng => {
      const ing = ingredients.find(i => i.id === prodIng.id);
      return ing && ing.stock <= lowThreshold && ing.stock > criticalThreshold;
    });
    
    const criticalStockFound = productIngredients.filter(prodIng => {
      const ing = ingredients.find(i => i.id === prodIng.id);
      return ing && ing.stock <= criticalThreshold;
    });
    
    const insufficientStockFound = productIngredients.filter(prodIng => {
      const ing = ingredients.find(i => i.id === prodIng.id);
      const requiredQuantity = getIngredientQuantityForSize(prodIng, size);
      
      console.log(`Ingredient ${prodIng.id} requires ${requiredQuantity}g (size: ${size || 'default'}), stock: ${ing?.stock}g`);
      
      return ing && requiredQuantity > ing.stock;
    });
    
    return {
      safe: lowStockFound.length === 0 && criticalStockFound.length === 0,
      warning: lowStockFound.length > 0,
      critical: criticalStockFound.length > 0,
      insufficient: insufficientStockFound.length > 0,
      lowStockIngredients: lowStockFound,
      criticalStockIngredients: criticalStockFound,
      insufficientStockIngredients: insufficientStockFound
    };
  };
  
  // Function to simulate ingredient usage without actually updating stock
  const simulateIngredientUsage = (productIngredients: ProductIngredient[], size?: string) => {
    if (!productIngredients || !productIngredients.length) {
      return { canBeMade: true, missingIngredients: [] };
    }
    
    const missingIngredients = productIngredients.filter(prodIng => {
      const ing = ingredients.find(i => i.id === prodIng.id);
      const requiredQuantity = getIngredientQuantityForSize(prodIng, size);
      return !ing || ing.stock < requiredQuantity;
    });
    
    return {
      canBeMade: missingIngredients.length === 0,
      missingIngredients
    };
  };
  
  // Function to update ingredients stock based on what was used
  const updateIngredientsStock = (productIngredients: ProductIngredient[], quantity = 1, size?: string) => {
    if (!productIngredients || !productIngredients.length) {
      return true;
    }
    
    console.log(`Updating stock for ${quantity} items of size: ${size || 'default'}`);
    
    try {
      const updatedIngredients = ingredients.map(ingredient => {
        const productIngredient = productIngredients.find(pi => pi.id === ingredient.id);
        
        if (!productIngredient) {
          return ingredient;
        }
        
        const requiredQuantity = getIngredientQuantityForSize(productIngredient, size);
        const totalRequired = requiredQuantity * quantity;
        
        console.log(`Ingredient ${ingredient.name}: required ${totalRequired}g (${requiredQuantity}g x ${quantity}), current stock: ${ingredient.stock}g`);
        
        if (ingredient.stock < totalRequired) {
          console.warn(`Insufficient stock for ${ingredient.name}: needed ${totalRequired}g but only ${ingredient.stock}g available`);
          
          toast({
            title: "Stock insuficiente",
            description: `Falta ${ingredient.name} (${totalRequired - ingredient.stock}g)`,
            variant: "destructive",
          });
        }
        
        const newStock = Math.max(0, ingredient.stock - totalRequired);
        console.log(`New stock for ${ingredient.name}: ${newStock}g`);
        
        return {
          ...ingredient,
          stock: newStock
        };
      });
      
      // Save updated ingredients to localStorage
      localStorage.setItem("ingredients", JSON.stringify(updatedIngredients));
      
      if (quantity > 0) {
        toast({
          title: "Stock actualizado",
          description: "Se ha descontado el stock de los ingredientes utilizados.",
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error updating ingredients stock:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el stock de ingredientes",
        variant: "destructive",
      });
      return false;
    }
  };
  
  return {
    ingredients,
    lowStockIngredients,
    criticalStockIngredients,
    hasLowStock: lowStockIngredients.length > 0,
    hasCriticalStock: criticalStockIngredients.length > 0,
    checkProductIngredients,
    simulateIngredientUsage,
    updateIngredientsStock,
    isLowStock: (id: string) => {
      const ing = ingredients.find(i => i.id === id);
      return ing && ing.stock <= lowThreshold && ing.stock > criticalThreshold;
    },
    isCriticalStock: (id: string) => {
      const ing = ingredients.find(i => i.id === id);
      return ing && ing.stock <= criticalThreshold;
    }
  };
};
