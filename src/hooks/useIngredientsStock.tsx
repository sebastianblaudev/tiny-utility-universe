
import { useState, useEffect } from 'react';
import { ProductIngredient } from '@/components/EditProductIngredientsModal';

type Ingredient = {
  id: string;
  name: string;
  stock: number;
  quantity?: number;
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
          
          // Ensure all ingredients have numeric stock values
          const normalizedIngredients = parsedIngredients.map((ing: Ingredient) => ({
            ...ing,
            stock: typeof ing.stock === 'number' ? ing.stock : parseInt(ing.stock) || 0
          }));
          
          setIngredients(normalizedIngredients);
          
          // Filter ingredients with low stock
          const lowStock = normalizedIngredients.filter((ing: Ingredient) => 
            ing.stock <= lowThreshold && ing.stock > criticalThreshold
          );
          setLowStockIngredients(lowStock);
          
          // Filter ingredients with critical stock
          const criticalStock = normalizedIngredients.filter((ing: Ingredient) => 
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
    
    // Create a custom event listener for local updates
    const handleCustomEvent = () => loadIngredients();
    window.addEventListener('ingredientsUpdated', handleCustomEvent);
    
    // Refresh every 5 minutes
    const intervalId = setInterval(loadIngredients, 300000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ingredientsUpdated', handleCustomEvent);
      clearInterval(intervalId);
    };
  }, [lowThreshold, criticalThreshold]);
  
  const checkProductIngredients = (productIngredients: ProductIngredient[], size?: string, ingredientsBySize?: {[size: string]: ProductIngredient[]}) => {
    if (!productIngredients || !productIngredients.length) return { safe: true };
    
    // Use size-specific ingredients if specified, otherwise use general ingredients
    let ingredientsToCheck = productIngredients;
    
    if (size && ingredientsBySize && ingredientsBySize[size] && ingredientsBySize[size].length > 0) {
      // Use size-specific ingredients if available
      console.log(`Using ${size}-specific ingredients:`, ingredientsBySize[size]);
      ingredientsToCheck = ingredientsBySize[size];
    } else {
      console.log(`Using general ingredients for ${size || 'unknown'} size`);
    }
    
    const lowStockFound = ingredientsToCheck.filter(prodIng => {
      const ing = ingredients.find(i => i.id === prodIng.id);
      return ing && ing.stock <= lowThreshold && ing.stock > criticalThreshold;
    });
    
    const criticalStockFound = ingredientsToCheck.filter(prodIng => {
      const ing = ingredients.find(i => i.id === prodIng.id);
      return ing && ing.stock <= criticalThreshold;
    });
    
    const insufficientStockFound = ingredientsToCheck.filter(prodIng => {
      const ing = ingredients.find(i => i.id === prodIng.id);
      return ing && prodIng.quantity > ing.stock;
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
  
  // Add function to manually update ingredients after stock changes
  const refreshIngredients = () => {
    const event = new Event('ingredientsUpdated');
    window.dispatchEvent(event);
  };
  
  return {
    ingredients,
    lowStockIngredients,
    criticalStockIngredients,
    hasLowStock: lowStockIngredients.length > 0,
    hasCriticalStock: criticalStockIngredients.length > 0,
    checkProductIngredients,
    refreshIngredients,
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
