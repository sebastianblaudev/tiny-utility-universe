
import { useEffect, useState } from "react";
import { initDB } from "@/lib/db";
import type { Product, Category } from "@/lib/db";

export function useProductsData() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<{ [key: string]: Product[] }>({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const db = await initDB();
        if (!db) {
          throw new Error("Database not initialized");
        }

        // Cargar categorías
        const catTx = db.transaction('categories', 'readonly');
        const catStore = catTx.objectStore('categories');
        const cats = await catStore.getAll();
        setCategories(cats);

        // Cargar productos
        const tx = db.transaction('products', 'readonly');
        const productStore = tx.objectStore('products');
        const allProducts = await productStore.getAll();
        
        // Asegurarse de que los productos tengan la propiedad categoryId
        const normalizedProducts = allProducts.map((prod: Product) => {
          // Si el producto tiene category pero no categoryId, usar category como categoryId
          if (prod.category && !prod.categoryId) {
            return { ...prod, categoryId: prod.category };
          }
          return prod;
        });
        
        setProducts(normalizedProducts);

        // Organizar productos por categoría
        const grouped: { [key: string]: Product[] } = {};
        
        // Inicializar todas las categorías con arrays vacíos
        cats.forEach(cat => {
          grouped[cat.id] = [];
        });

        // Obtener todas las categorías de pizza (nombre contiene "pizza")
        const pizzaCategories = cats
          .filter(cat => cat.name.toLowerCase().includes('pizza'))
          .map(cat => cat.id);

        console.log("Categorías de pizza identificadas:", pizzaCategories);

        // Distribuir productos en sus categorías
        normalizedProducts.forEach((prod: Product) => {
          // Usar categoryId si existe, sino usar category
          const catId = prod.categoryId || prod.category;
          
          if (grouped[catId]) {
            // Verificar si el producto pertenece a una categoría de pizza
            const isPizza = pizzaCategories.includes(catId);
            
            if (isPizza && !prod.sizes) {
              // Si es una pizza pero no tiene sizes definido, crear tamaños por defecto
              prod.sizes = {
                personal: prod.price || 0,
                mediana: (prod.price || 0) * 1.5,
                familiar: (prod.price || 0) * 2
              };
              console.log(`Producto ${prod.name} detectado como pizza. Añadiendo tamaños:`, prod.sizes);
            }
            
            grouped[catId].push(prod);
          } else {
            console.warn(`Producto ${prod.id} - ${prod.name} tiene una categoría no reconocida: ${catId}`);
            // Si no existe la categoría, creamos un grupo para "otros"
            if (!grouped["otros"]) {
              grouped["otros"] = [];
            }
            grouped["otros"].push(prod);
          }
        });

        setProductsByCategory(grouped);
        console.log("Productos cargados por categoría:", grouped);
      } catch (err) {
        console.error("Error loading product data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    products,
    categories,
    productsByCategory,
    isLoading,
    error,
    refresh: () => {
      // Esta función puede ser llamada para recargar los datos
      setIsLoading(true);
      // Forzamos un nuevo efecto estableciendo isLoading a true
    }
  };
}
