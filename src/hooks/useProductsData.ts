
import { useEffect, useState } from "react";
import { initDB } from "@/lib/db";
import type { Product, Category } from "@/lib/db";
import { toast } from "sonner";

// Define the database version for consistency
const DB_VERSION = 9;
const DB_NAME = 'pizza-pos-db';

// Define the fixed categories that should always exist
const FIXED_CATEGORIES = [
  { id: 'cat_pizza', name: 'Pizzas', color: '#FF5733' },
  { id: 'cat_extras', name: 'Extras', color: '#33FF57' },
  { id: 'cat_bebidas', name: 'Bebidas', color: '#3357FF' }
];

export function useProductsData() {
  const [error, setError] = useState<Error | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<{ [key: string]: Product[] }>({});
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [exactBarcodeMatch, setExactBarcodeMatch] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add this flag to force reload
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const db = await initDB();
        if (!db) {
          throw new Error("Database not initialized");
        }

        // Load categories first
        const catTx = db.transaction('categories', 'readonly');
        const catStore = catTx.objectStore('categories');
        let cats = await catStore.getAll();
        
        // Check if we need to create the fixed categories
        const fixedCategoryIds = FIXED_CATEGORIES.map(cat => cat.id);
        const existingCategoryIds = cats.map((cat: Category) => cat.id);
        const missingCategories = FIXED_CATEGORIES.filter(
          fixedCat => !existingCategoryIds.includes(fixedCat.id)
        );

        // If we have missing fixed categories, create them
        if (missingCategories.length > 0) {
          const writeTx = db.transaction('categories', 'readwrite');
          const writeStore = writeTx.objectStore('categories');
          
          for (const category of missingCategories) {
            await writeStore.add(category);
          }
          
          await writeTx.done;
          
          // Reload categories after adding the fixed ones
          const reloadTx = db.transaction('categories', 'readonly');
          const reloadStore = reloadTx.objectStore('categories');
          cats = await reloadStore.getAll();
        }
        
        setCategories(cats);

        // Load products
        const tx = db.transaction('products', 'readonly');
        const productStore = tx.objectStore('products');
        const allProducts = await productStore.getAll();
        
        // Ensure products have the categoryId property
        const normalizedProducts = allProducts.map((prod: Product) => {
          // If product has category but not categoryId, use category as categoryId
          if (prod.category && !prod.categoryId) {
            return { ...prod, categoryId: prod.category };
          }
          return prod;
        });
        
        setProducts(normalizedProducts);

        // Organize products by category
        const grouped: { [key: string]: Product[] } = {};
        
        // Initialize all categories with empty arrays
        cats.forEach(cat => {
          grouped[cat.id] = [];
        });

        // Get all pizza categories (name contains "pizza")
        const pizzaCategories = cats
          .filter(cat => cat.name.toLowerCase().includes('pizza'))
          .map(cat => cat.id);

        // Distribute products to their categories
        normalizedProducts.forEach((prod: Product) => {
          // Use categoryId if exists, otherwise use category
          const catId = prod.categoryId || prod.category;
          
          // Make sure we have a valid category ID
          if (!catId) {
            // Create an "otros" (others) group for uncategorized products
            if (!grouped["otros"]) {
              grouped["otros"] = [];
            }
            grouped["otros"].push(prod);
            return;
          }
          
          if (grouped[catId]) {
            // Check if product belongs to a pizza category
            const isPizza = pizzaCategories.includes(catId);
            
            if (isPizza && !prod.sizes) {
              // If it's a pizza but doesn't have sizes defined, create default sizes
              prod.sizes = {
                personal: prod.price || 0,
                mediana: (prod.price || 0) * 1.5,
                familiar: (prod.price || 0) * 2
              };
            }
            
            grouped[catId].push(prod);
          } else {
            // If category doesn't exist, create an "otros" group
            if (!grouped["otros"]) {
              grouped["otros"] = [];
            }
            grouped["otros"].push(prod);
          }
        });

        setProductsByCategory(grouped);
        
        // If we have products but no categories established, create a default one
        if (normalizedProducts.length > 0 && cats.length === 0) {
          toast("Advertencia", {
            description: "Se encontraron productos pero no hay categorías definidas"
          });
        }
        
      } catch (err) {
        console.error("Error loading product data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        toast.error("Error cargando productos", {
          description: "No se pudieron cargar los productos"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [refreshFlag]);

  // Search function that searches by barcode or product name
  const searchProducts = (query: string) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setIsSearchActive(false);
      setExactBarcodeMatch(null);
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results = products.filter(product => {
      // Search by barcode (exact match)
      if (product.barcode && product.barcode === normalizedQuery) {
        return true;
      }
      
      // Search by name (partial match)
      if (product.name && product.name.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      return false;
    });
    
    // Check for exact barcode match
    const exactMatch = products.find(product => product.barcode === normalizedQuery);
    setExactBarcodeMatch(exactMatch || null);
    
    setSearchResults(results);
    setIsSearchActive(true);
  };

  // Function to handle barcode scanner input
  const handleBarcodeScanned = (barcode: string) => {
    // We're using the same search function but we know it's a barcode
    searchProducts(barcode);
    return products.find(product => product.barcode === barcode) || null;
  };

  // Clear search results and deactivate search
  const clearSearch = () => {
    setSearchResults([]);
    setIsSearchActive(false);
    setExactBarcodeMatch(null);
  };

  // Function to add a custom size to a product
  const addCustomSizeToProduct = async (productId: string, sizeName: string, price: number) => {
    try {
      const db = await initDB();
      if (!db) {
        throw new Error("Database not initialized");
      }

      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const product = await store.get(productId);

      if (!product) {
        throw new Error("Product not found");
      }

      // Ensure the sizes object exists
      if (!product.sizes) {
        product.sizes = {};
      }

      // Add the new size
      product.sizes[sizeName.toLowerCase()] = price;

      // Save the updated product
      await store.put(product);
      await tx.done;

      // Refresh the products data
      setRefreshFlag(prev => prev + 1);

      toast("Tamaño personalizado agregado", {
        description: `Se agregó "${sizeName}" a las opciones de tamaño.`
      });

      return true;
    } catch (err) {
      console.error("Error adding custom size:", err);
      toast.error("Error", {
        description: "No se pudo agregar el tamaño personalizado."
      });
      return false;
    }
  };
  
  // Add new function to rename a size
  const renameSizeForProduct = async (productId: string, oldSizeName: string, newSizeName: string) => {
    try {
      const db = await initDB();
      if (!db) {
        throw new Error("Database not initialized");
      }

      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const product = await store.get(productId);

      if (!product) {
        throw new Error("Product not found");
      }

      // Ensure the sizes object exists
      if (!product.sizes) {
        return false;
      }

      // Get the price of the old size
      const price = product.sizes[oldSizeName];
      
      if (price === undefined) {
        return false;
      }
      
      // Create a new sizes object
      const newSizes = { ...product.sizes };
      
      // Delete the old size
      delete newSizes[oldSizeName];
      
      // Add the new size with the same price
      newSizes[newSizeName.toLowerCase()] = price;
      
      // Update the product
      product.sizes = newSizes;
      
      // Save the updated product
      await store.put(product);
      await tx.done;

      // Refresh the products data
      setRefreshFlag(prev => prev + 1);

      toast("Tamaño renombrado", {
        description: `Se renombró "${oldSizeName}" a "${newSizeName}"`
      });

      return true;
    } catch (err) {
      console.error("Error renaming size:", err);
      toast.error("Error", {
        description: "No se pudo renombrar el tamaño."
      });
      return false;
    }
  };

  return {
    products,
    categories,
    productsByCategory,
    error,
    searchProducts,
    searchResults,
    isSearchActive,
    clearSearch,
    handleBarcodeScanned,
    exactBarcodeMatch,
    isLoading,
    refresh: () => {
      // Force a reload of the data by incrementing the refresh flag
      setRefreshFlag(prev => prev + 1);
    },
    addCustomSizeToProduct,
    renameSizeForProduct
  };
}
