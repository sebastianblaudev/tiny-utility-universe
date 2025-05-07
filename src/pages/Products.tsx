import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { initDB } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useProductsData } from "@/hooks/useProductsData";
import { useIngredientsStock } from "@/hooks/useIngredientsStock";

// Function to update ingredients stock when a product is sold
export const updateIngredientsStock = async (productId: string, quantity: number): Promise<boolean> => {
  try {
    console.log(`Updating stock for product ${productId}, quantity: ${quantity}`);
    const db = await initDB();
    
    if (!db) {
      console.error("Database not initialized");
      return false;
    }
    
    // Get the product first to see its ingredients
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const product = await store.get(productId);
    
    if (!product) {
      console.error(`Product not found: ${productId}`);
      return false;
    }
    
    // Check if the product has ingredients
    if (!product.ingredients || !Array.isArray(product.ingredients) || product.ingredients.length === 0) {
      console.log(`Product ${productId} has no ingredients to update`);
      return true; // No ingredients to update, so technically it's successful
    }
    
    // Now update each ingredient's stock
    const ingredientTx = db.transaction('ingredients', 'readwrite');
    const ingredientStore = ingredientTx.objectStore('ingredients');
    
    // Process each ingredient
    for (const prodIngredient of product.ingredients) {
      const ingredient = await ingredientStore.get(prodIngredient.id);
      
      if (!ingredient) {
        console.warn(`Ingredient not found: ${prodIngredient.id}`);
        continue;
      }
      
      // Calculate the amount to reduce based on the product quantity
      const amountToReduce = prodIngredient.quantity * quantity;
      
      // Update the stock
      ingredient.stock = Math.max(0, ingredient.stock - amountToReduce);
      
      // Save the updated ingredient
      await ingredientStore.put(ingredient);
      console.log(`Updated stock for ${ingredient.name}: new value = ${ingredient.stock}`);
    }
    
    // Commit the transaction
    await ingredientTx.done;
    console.log(`Stock updated successfully for product ${product.name}`);
    
    // Trigger a custom event to notify of ingredient stock changes
    // This can be useful for other parts of the app that need to react to stock changes
    const event = new CustomEvent('ingredientsStockUpdated');
    window.dispatchEvent(event);
    
    // Manually update localStorage to ensure UI consistency across tabs
    try {
      const allIngredientsTx = db.transaction('ingredients', 'readonly');
      const allIngredientsStore = allIngredientsTx.objectStore('ingredients');
      const allIngredients = await allIngredientsStore.getAll();
      localStorage.setItem('ingredients', JSON.stringify(allIngredients));
    } catch (err) {
      console.error("Error updating localStorage ingredients:", err);
    }
    
    return true;
  } catch (error) {
    console.error("Error updating ingredients stock:", error);
    return false;
  }
};

// Simple placeholder component to fix TypeScript errors
const Products = () => {
  const { products, categories, productsByCategory, isLoading, error } = useProductsData();
  const { checkProductIngredients } = useIngredientsStock();
  const { toast } = useToast();
  
  // Fix for the TypeScript error about default prices
  const sizes = {
    personal: 0,
    mediana: 0,
    familiar: 0
  };
  
  if (isLoading) {
    return <div className="p-4">Cargando productos...</div>;
  }
  
  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-lg font-bold mb-2">Error al cargar productos</h1>
        <p className="text-red-500">{error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>
      
      {categories.length === 0 ? (
        <Card className="p-4 bg-yellow-50">
          <div className="text-center">
            <p className="mb-2">No hay categorías definidas</p>
            <Button 
              variant="outline" 
              className="mx-auto"
              onClick={() => {
                toast({
                  title: "Función en desarrollo",
                  description: "La funcionalidad para añadir categorías está en desarrollo."
                });
              }}
            >
              Añadir Categoría
            </Button>
          </div>
        </Card>
      ) : Object.keys(productsByCategory).length === 0 ? (
        <Card className="p-4 bg-yellow-50">
          <div className="text-center">
            <p className="mb-2">No hay productos definidos</p>
            <Button 
              variant="outline" 
              className="mx-auto"
              onClick={() => {
                toast({
                  title: "Función en desarrollo",
                  description: "La funcionalidad para añadir productos está en desarrollo."
                });
              }}
            >
              Añadir Producto
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="p-4">
              <h2 className="text-xl font-semibold mb-2" style={{ color: category.color || '#333' }}>
                {category.name}
              </h2>
              
              {productsByCategory[category.id] && productsByCategory[category.id].length > 0 ? (
                <ul className="space-y-2">
                  {productsByCategory[category.id].map((product) => (
                    <li key={product.id} className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <span>{product.name}</span>
                        <span>
                          {product.sizes ? (
                            `Desde ${new Intl.NumberFormat('es-AR', {
                              style: 'currency',
                              currency: 'ARS'
                            }).format(
                              Math.min(
                                ...Object.values(product.sizes).filter(price => typeof price === 'number')
                              )
                            )}`
                          ) : (
                            new Intl.NumberFormat('es-AR', {
                              style: 'currency',
                              currency: 'ARS'
                            }).format(product.price || 0)
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center italic">No hay productos en esta categoría</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
