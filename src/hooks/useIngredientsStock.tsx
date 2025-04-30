
import { useState, useEffect } from 'react';

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
  
  const checkProductIngredients = (productIngredients: any[]) => {
    if (!productIngredients || !productIngredients.length) return { safe: true };
    
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
  
  return {
    ingredients,
    lowStockIngredients,
    criticalStockIngredients,
    hasLowStock: lowStockIngredients.length > 0,
    hasCriticalStock: criticalStockIngredients.length > 0,
    checkProductIngredients,
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
