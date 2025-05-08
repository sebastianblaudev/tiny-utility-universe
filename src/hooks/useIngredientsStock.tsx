
import { useState, useEffect } from 'react';
import { ProductIngredient } from '@/components/EditProductIngredientsModal';
import { toast } from '@/components/ui/use-toast';

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
    let sizeInfo = '';
    
    if (size && ingredientsBySize && ingredientsBySize[size] && ingredientsBySize[size].length > 0) {
      // Use size-specific ingredients if available
      ingredientsToCheck = ingredientsBySize[size];
      sizeInfo = `(tamaño específico: ${size})`;
      console.log(`Usando ${ingredientsToCheck.length} ingredientes específicos para tamaño ${size}:`, ingredientsToCheck);
    } else {
      console.log(`Usando ${ingredientsToCheck.length} ingredientes generales para ${size || 'tamaño desconocido'}`);
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
      const requiredQuantity = prodIng.quantity || 0;
      const availableStock = ing?.stock || 0;
      
      if (ing && requiredQuantity > availableStock) {
        console.log(`Stock insuficiente para ${ing.name}: se requiere ${requiredQuantity}g pero hay ${availableStock}g disponibles ${sizeInfo}`);
        return true;
      }
      return false;
    });
    
    if (insufficientStockFound.length > 0) {
      console.log(`¡ATENCIÓN! ${insufficientStockFound.length} ingredientes con stock insuficiente ${sizeInfo}`);
    }
    
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
    toast({
      title: "Stock actualizado",
      description: "Se ha actualizado la información de ingredientes",
    });
  };
  
  // Nueva función para visualizar el uso de ingredientes sin reducir stock
  const simulateIngredientUsage = (productId: string, size?: string) => {
    return async () => {
      try {
        const db = await import('@/lib/db').then(m => m.initDB());
        if (!db) {
          console.error("No se pudo abrir la base de datos");
          return [];
        }
        
        const product = await db.get('products', productId);
        if (!product) return [];
        
        // Determinar qué set de ingredientes usar
        let ingredientsToUse = product.ingredients || [];
        
        // Si se especificó un tamaño y existen ingredientes para ese tamaño, usar esos
        if (size && product.ingredientsBySize && product.ingredientsBySize[size] && product.ingredientsBySize[size].length > 0) {
          ingredientsToUse = product.ingredientsBySize[size];
          console.log(`SIMULACIÓN: Usando ${ingredientsToUse.length} ingredientes específicos para tamaño ${size}:`, 
            ingredientsToUse.map(ing => `${ing.name}: ${ing.quantity}g`));
        } else {
          console.log(`SIMULACIÓN: Usando ${ingredientsToUse.length} ingredientes generales:`,
            ingredientsToUse.map(ing => `${ing.name}: ${ing.quantity}g`));
        }
        
        return ingredientsToUse;
      } catch (error) {
        console.error("Error al simular uso de ingredientes:", error);
        return [];
      }
    };
  };
  
  return {
    ingredients,
    lowStockIngredients,
    criticalStockIngredients,
    hasLowStock: lowStockIngredients.length > 0,
    hasCriticalStock: criticalStockIngredients.length > 0,
    checkProductIngredients,
    refreshIngredients,
    simulateIngredientUsage,
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
