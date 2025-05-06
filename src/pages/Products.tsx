import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash, Save, Utensils, Barcode, X, Check, Pencil, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { initDB } from '@/lib/db';
import type { Product, Category } from '@/lib/db';
import { BackButton } from "@/components/BackButton";
import { EditProductIngredientsModal } from "@/components/EditProductIngredientsModal";
import type { ProductIngredient } from "@/components/EditProductIngredientsModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCsvImporter } from '@/components/products/ProductCsvImporter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Database version and name constants to match with src/lib/db.ts
const DB_VERSION = 9;
const DB_NAME = 'pizza-pos-db';

async function cleanupHardcodedProducts() {
  try {
    const db = await initDB();
    if (!db) return;
    const allProducts = await db.getAll('products');

    const allCategories = await db.getAll('categories');
    const validCategoryIds = allCategories.map((cat: any) => cat.id);

    const productsToDelete = allProducts.filter(
      (prod: any) =>
        !validCategoryIds.includes(prod.category) &&
        !validCategoryIds.includes(prod.categoryId)
    );

    for (const prod of productsToDelete) {
      await db.delete('products', prod.id);
      console.log("Producto eliminado por categoría inválida:", prod);
    }
  } catch (e) {
    console.warn("No se pudo limpiar productos en duro:", e);
  }
}

const generateBarcode = () => {
  let barcode = '200';
  for(let i = 0; i < 9; i++) {
    barcode += Math.floor(Math.random() * 10);
  }
  let sum = 0;
  for(let i = 0; i < 12; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  barcode += checkDigit;
  return barcode;
};

export const updateIngredientsStock = async (productId: string, quantity: number = 1) => {
  try {
    console.log(`Actualizando stock para producto ID: ${productId}, cantidad: ${quantity}`);
    
    const db = await initDB();
    if (!db) {
      console.error("No se pudo abrir la base de datos");
      return false;
    }
    
    const product = await db.get('products', productId);
    
    console.log("Producto encontrado:", product);
    
    if (!product || !product.ingredients || product.ingredients.length === 0) {
      console.log("El producto no tiene ingredientes configurados");
      return true;
    }
    
    let ingredients;
    try {
      const storedIngredients = localStorage.getItem("ingredients");
      if (!storedIngredients) {
        console.log("No hay ingredientes almacenados en localStorage");
        return true;
      }
      
      ingredients = JSON.parse(storedIngredients);
      console.log("Ingredientes actuales:", ingredients);
    } catch (err) {
      console.error("Error al parsear ingredientes:", err);
      return false;
    }
    
    let updated = false;
    const updatedIngredients = ingredients.map(ingredient => {
      const productIngredient = product.ingredients.find(pi => pi.id === ingredient.id);
      
      if (!productIngredient) {
        console.log(`Ingrediente ${ingredient.name} no encontrado en el producto`);
        return ingredient;
      }
      
      console.log(`Ingrediente ${ingredient.name} encontrado en el producto, cantidad: ${productIngredient.quantity}`);
      
      const amountToSubtract = productIngredient.quantity * quantity;
      console.log(`Cantidad a descontar: ${amountToSubtract}g`);
      
      if (ingredient.stock === undefined) {
        ingredient.stock = ingredient.quantity ? ingredient.quantity * 1000 : 0;
        console.log(`Stock inicial asignado: ${ingredient.stock}g`);
      }
      
      const newStock = Math.max(0, ingredient.stock - amountToSubtract);
      console.log(`Stock anterior: ${ingredient.stock}g, nuevo stock: ${newStock}g`);
      
      if (newStock !== ingredient.stock) {
        updated = true;
        return { ...ingredient, stock: newStock };
      }
    });
    
    if (updated) {
      try {
        console.log("Guardando ingredientes actualizados:", updatedIngredients);
        localStorage.setItem("ingredients", JSON.stringify(updatedIngredients));
        
        if (quantity > 0) {
          toast("Stock actualizado", {
            description: "Se ha descontado el stock de los ingredientes utilizados."
          });
        }
      } catch (error) {
        console.error("Error al guardar ingredientes en localStorage:", error);
        return false;
      }
    } else {
      console.log("No hubo cambios que guardar");
    }
    
    return true;
  } catch (error) {
    console.error("Error al actualizar el stock de ingredientes:", error);
    toast.error("Error", {
      description: "No se pudo actualizar el stock de ingredientes"
    });
    return false;
  }
};

const Products = () => {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [newProduct, setNewProduct] = React.useState<Partial<Product>>({
    name: '',
    price: 0,
    category: '',
    sizes: {
      personal: 0,
      mediana: 0,
      familiar: 0
    },
    barcode: ''
  });
  const [ingredientModalOpen, setIngredientModalOpen] = React.useState(false);
  const [selectedProductIngredients, setSelectedProductIngredients] = React.useState<ProductIngredient[]>([]);
  const [activeProductId, setActiveProductId] = React.useState<string | null>(null);

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = React.useState(false);
  
  // State for editing size names
  const [editingSizeName, setEditingSizeName] = React.useState<string | null>(null);
  const [editedSizeName, setEditedSizeName] = React.useState<string>('');
  
  // State for product search
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  
  // Add active tab state
  const [activeTab, setActiveTab] = React.useState<string>("products");

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const db = await initDB();
        const cats = await db.getAll('categories');
        setCategories(cats);
        setCategoriesLoaded(true);
        
        if (cats.length > 0) {
          setNewProduct((current) => ({
            ...current,
            category: cats[0]?.id || '',
            sizes: {
              personal: 0,
              mediana: 0,
              familiar: 0
            }
          }));
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error("Error", {
          description: "No se pudieron cargar las categorías"
        });
      }
    };
    fetchCategories();
  }, []);

  React.useEffect(() => {
    cleanupHardcodedProducts();
  }, []);

  const { data: products, refetch, isLoading, isFetching } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const db = await initDB();
        if (!db) {
          console.error("No se pudo abrir la base de datos");
          return [];
        }
        return db.getAll('products');
      } catch (error) {
        console.error("Error al obtener productos:", error);
        return [];
      }
    },
    // Add these options to prevent infinite loading issues
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // useEffect to filter products based on search query
  React.useEffect(() => {
    if (!searchQuery.trim() || !products) {
      setFilteredProducts(products || []);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = products.filter((product: Product) => {
      // Search by name, barcode, or category name
      const categoryName = getCategoryName(product.category).toLowerCase();
      const productName = product.name.toLowerCase();
      const productBarcode = product.barcode?.toLowerCase() || '';
      
      return productName.includes(query) || 
             productBarcode.includes(query) || 
             categoryName.includes(query);
    });
    
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const handleSizePriceChange = (size: string, value: number) => {
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        sizes: {
          ...(editingProduct.sizes || { personal: 0, mediana: 0, familiar: 0 }),
          [size]: value
        }
      });
    } else {
      setNewProduct({
        ...newProduct,
        sizes: {
          ...(newProduct.sizes || { personal: 0, mediana: 0, familiar: 0 }),
          [size]: value
        }
      });
    }
  };
  
  // Add new function to handle size name editing
  const handleStartEditSizeName = (size: string) => {
    setEditingSizeName(size);
    setEditedSizeName(size);
  };

  // Add new function to save edited size name
  const handleSaveEditedSizeName = () => {
    if (editingSizeName !== null && editedSizeName.trim() !== '' && editingProduct) {
      const newSizes = { ...editingProduct.sizes } || {};
      
      // Get the price of the original size
      const originalPrice = newSizes[editingSizeName];
      
      // Delete the original size
      delete newSizes[editingSizeName];
      
      // Add the new size with the original price
      newSizes[editedSizeName.toLowerCase()] = originalPrice;
      
      // Update the editingProduct state with the new sizes
      setEditingProduct({
        ...editingProduct,
        sizes: newSizes
      });
      
      // Reset editing state
      setEditingSizeName(null);
      setEditedSizeName('');
      
      toast("Nombre de tamaño editado", {
        description: `El tamaño "${editingSizeName}" ha sido cambiado a "${editedSizeName}"`
      });
    }
  };

  const getCategoryName = (id: string) => {
    return categories.find(cat => cat.id === id)?.name || id;
  };

  const isPizzaCategory = (categoryId: string) => {
    if (!categoryId) return false;
    const category = categories.find(cat => cat.id === categoryId);
    
    if (category) {
      return /pizza/i.test(category.name);
    } else if (categoryId) {
      return /pizza/i.test(categoryId);
    }
    
    return false;
  };

  const handleCategoryChange = (value: string, context: 'edit' | 'new') => {
    if (context === 'edit' && editingProduct) {
      setEditingProduct({
        ...editingProduct,
        category: value
      });
    } else {
      setNewProduct({
        ...newProduct,
        category: value
      });
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!newProduct.category) {
        toast.error("Error", {
          description: "Seleccione una categoría" 
        });
        return;
      }
      const db = await initDB();
      if (!db) {
        console.error("No se pudo abrir la base de datos");
        toast.error("Error", {
          description: "No se pudo abrir la base de datos"
        });
        return;
      }

      const id = `p${Date.now()}`;
      // Fix the error: Ensure sizes always has required properties
      const defaultSizes = {
        personal: 0,
        mediana: 0,
        familiar: 0
      };
      
      const productData = {
        ...newProduct,
        id,
        image: null,
        barcode: newProduct.barcode || null,
        // Ensure sizes always has the required properties
        sizes: newProduct.sizes ? {
          ...defaultSizes,
          ...newProduct.sizes
        } : defaultSizes
      } as Product;
      
      await db.add('products', productData);
      
      toast("Producto agregado exitosamente");

      setNewProduct({ 
        name: '', 
        price: 0, 
        category: categories[0]?.id || '',
        barcode: '',
        sizes: {
          personal: 0,
          mediana: 0,
          familiar: 0
        }
      });
      
      // Use invalidateQueries instead of direct refetch
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error("Error al agregar el producto:", error);
      toast.error("Error al agregar el producto");
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      if (!product.category) {
        toast.error("Error", {
          description: "Seleccione una categoría"
        });
        return;
      }
      const db = await initDB();
      await db.put('products', product);
      toast("Producto actualizado exitosamente");
      setEditingProduct(null);
      // Use invalidateQueries instead of direct refetch
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      toast.error("Error al actualizar el producto");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const db = await initDB();
      await db.delete('products', id);
      toast("Producto eliminado exitosamente");
      // Use invalidateQueries instead of direct refetch
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      toast.error("Error al eliminar el producto");
    }
  };

  const handleSaveIngredients = async (ingredients: ProductIngredient[]) => {
    try {
      const db = await initDB();
      const product = products.find((p: any) => p.id === activeProductId);
      if (!product) return;
      await db.put('products', { ...product, ingredients });
      toast("Ingredientes actualizados");
      setIngredientModalOpen(false);
      setActiveProductId(null);
      setSelectedProductIngredients([]);
      
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (e) {
      toast.error("Error guardando ingredientes");
    }
  };

  const handleOpenIngredients = (product: any) => {
    setSelectedProductIngredients(product.ingredients || []);
    setActiveProductId(product.id);
    setIngredientModalOpen(true);
  };

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setActiveTab("products"); // Switch to products tab after successful import
  };
  
  // Function to handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Function to clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Function to handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 bg-black text-white min-h-screen font-sans">
      <BackButton />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6 w-full md:w-1/2 mx-auto bg-neutral-900 border border-neutral-700">
          <TabsTrigger value="products" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            Productos
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            Importar Productos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="space-y-6">
          {/* CSV Importer Component */}
          <ProductCsvImporter onImportComplete={handleImportComplete} />
        </TabsContent>
        
        <TabsContent value="products" className="space-y-6">
          {/* New Search Component */}
          <Card className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg">
            <CardContent className="py-4">
              <div className="relative">
                <Input
                  placeholder="Buscar por nombre, código de barras o categoría..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="bg-neutral-800 border border-neutral-700 text-white placeholder-gray-400 rounded-md shadow-inner pl-10 pr-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={handleClearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-2 text-sm text-gray-400">
                  {filteredProducts.length === 0 ? (
                    <span>No se encontraron productos que coincidan con "{searchQuery}"</span>
                  ) : (
                    <span>Se encontraron {filteredProducts.length} producto(s) que coinciden con "{searchQuery}"</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold tracking-wide text-white">Nuevo Producto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-5 md:flex-row">
                  <Input
                    placeholder="Nombre del producto"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="bg-neutral-800 border border-neutral-700 text-white placeholder-gray-400 rounded-md shadow-inner"
                  />
                  <div className="flex gap-2 w-full">
                    <Input
                      placeholder="Código de barras"
                      value={newProduct.barcode || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                      className="bg-neutral-800 border border-neutral-700 text-white placeholder-gray-400 rounded-md shadow-inner"
                    />
                    <Button
                      onClick={() => setNewProduct({ ...newProduct, barcode: generateBarcode() })}
                      variant="outline"
                      className="border border-purple-600 text-purple-400 hover:bg-purple-700/30"
                    >
                      <Barcode className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => handleCategoryChange(value, 'new')}
                    disabled={!categoriesLoaded || categories.length === 0}
                  >
                    <SelectTrigger className="flex h-12 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-base text-white shadow-inner">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border border-neutral-700 text-white">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-neutral-700">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!isPizzaCategory(newProduct.category) ? (
                  <Input
                    type="number"
                    placeholder="Precio"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="bg-neutral-800 border border-neutral-700 text-white placeholder-gray-400 rounded-md shadow-inner"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {['personal', 'mediana', 'familiar'].map((size) => (
                      <div key={size} className="flex flex-col gap-2">
                        <label className="text-sm text-purple-300 uppercase tracking-wider">{`Precio ${size.charAt(0).toUpperCase() + size.slice(1)}`}</label>
                        <Input
                          type="number"
                          placeholder={`Precio ${size.charAt(0).toUpperCase() + size.slice(1)}`}
                          value={newProduct.sizes?.[size] || 0}
                          onChange={(e) => handleSizePriceChange(size, Number(e.target.value))}
                          className="bg-neutral-800 border border-neutral-700 text-white placeholder-gray-400 rounded-md shadow-inner h-10"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleAddProduct}
                  className="bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-md py-3 hover:opacity-90 transition"
                  disabled={isLoading || isFetching}
                >
                  {isLoading || isFetching ? (
                    <div className="flex items-center">
                      <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      Cargando...
                    </div>
                  ) : (
                    <>
                      <Plus className="mr-2" size={18} />
                      Agregar Producto
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold tracking-wide text-white">Lista de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || isFetching ? (
                <div className="flex justify-center items-center p-8">
                  <div className="h-8 w-8 border-4 border-t-transparent border-purple-600 rounded-full animate-spin"></div>
                  <span className="ml-3 text-lg">Cargando productos...</span>
                </div>
              ) : (
                <Table className="bg-neutral-800 rounded-lg overflow-hidden shadow-xl border border-neutral-700">
                  <TableHeader>
                    <TableRow className="border-b border-neutral-700 hover:bg-neutral-700/40 transition-colors duration-300">
                      <TableHead className="text-white tracking-wide">Nombre</TableHead>
                      <TableHead className="text-white tracking-wide">Código</TableHead>
                      <TableHead className="text-white tracking-wide">Precio</TableHead>
                      <TableHead className="text-white tracking-wide">Categoría</TableHead>
                      <TableHead className="text-white tracking-wide">Ingredientes</TableHead>
                      <TableHead className="text-white tracking-wide">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(searchQuery ? filteredProducts : products)?.map((product) => (
                      <TableRow
                        key={product.id}
                        className="border-b border-neutral-700 hover:bg-neutral-700/40 transition-colors duration-300"
                      >
                        <TableCell>
                          {editingProduct?.id === product.id ? (
                            <Input
                              value={editingProduct.name}
                              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                              className="bg-neutral-800 border border-neutral-700 text-white"
                            />
                          ) : (
                            <span className="text-white font-medium">{product.name}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingProduct?.id === product.id ? (
                            <div className="flex gap-2">
                              <Input
                                value={editingProduct.barcode || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                                className="bg-neutral-800 border border-neutral-700 text-white"
                                placeholder="Código de barras"
                              />
                              <Button
                                onClick={() => setEditingProduct({ ...editingProduct, barcode: generateBarcode() })}
                                variant="outline"
                                className="border border-purple-600 text-purple-400 hover:bg-purple-700/30"
                              >
                                <Barcode className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-white font-medium">{product.barcode || '-'}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingProduct?.id === product.id ? (
                            isPizzaCategory(editingProduct.category) ? (
                              <div className="space-y-2">
                                {Object.keys(editingProduct.sizes || { personal: 0, mediana: 0, familiar: 0 }).map((size) => (
                                  <div key={size} className="flex items-center gap-2">
                                    {editingSizeName === size ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={editedSizeName}
                                          onChange={(e) => setEditedSizeName(e.target.value)}
                                          className="bg-neutral-800 border border-neutral-700 text-white h-8 w-32"
                                          autoFocus
                                        />
                                        <Button 
                                          onClick={handleSaveEditedSizeName}
                                          size="sm"
                                          className="bg-green-700 hover:bg-green-800 h-8 px-2"
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <span 
                                        className="text-sm w-20 text-purple-300 flex items-center gap-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {size.charAt(0).toUpperCase() + size.slice(1)}:
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-gray-400 hover:text-purple-400"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleStartEditSizeName(size);
                                          }}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                      </span>
                                    )}
                                    <Input
                                      type="number"
                                      value={editingProduct.sizes?.[size] || 0}
                                      onChange={(e) => handleSizePriceChange(size, Number(e.target.value))}
                                      className="bg-neutral-800 border border-neutral-700 text-white h-8"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <Input
                                type="number"
                                value={editingProduct.price}
                                onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                                className="bg-neutral-800 border border-neutral-700 text-white"
                              />
                            )
                          ) : (
                            <div>
                              {isPizzaCategory(product.category) ? (
                                <div className="space-y-1">
                                  <p className="text-sm text-purple-300">Personal: ${product.sizes?.personal}</p>
                                  <p className="text-sm text-purple-300">Mediana: ${product.sizes?.mediana}</p>
                                  <p className="text-sm text-purple-300">Familiar: ${product.sizes?.familiar}</p>
                                </div>
                              ) : (
                                <span className="text-white font-medium">${product.price}</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingProduct?.id === product.id ? (
                            <Select
                              value={editingProduct.category}
                              onValueChange={(value) => handleCategoryChange(value, 'edit')}
                              disabled={!categoriesLoaded || categories.length === 0}
                            >
                              <SelectTrigger className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white">
                                <SelectValue placeholder="Seleccionar categoría" />
                              </SelectTrigger>
                              <SelectContent className="bg-neutral-800 border border-neutral-700 text-white">
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-neutral-700">
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-purple-300 font-semibold">{getCategoryName(product.category)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex gap-1 items-center border border-purple-600 text-purple-400 hover:bg-purple-700/30 transition"
                            onClick={() => handleOpenIngredients(product)}
                          >
                            <Utensils size={18} />
                            <span className="hidden md:inline">Ver/Editar</span>
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingProduct?.id === product.id ? (
                              <Button
                                onClick={() => handleUpdateProduct(editingProduct)}
                                className="bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-md py-2 px-4 hover:opacity-90 transition"
                                size="sm"
                                disabled={isLoading || isFetching}
                              >
                                {isLoading || isFetching ? (
                                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-1"></div>
                                ) : (
                                  <Save className="mr-2" size={16} />
                                )}
                                Guardar
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setEditingProduct(product)}
                                className="bg-neutral-800 text-white hover:bg-purple-700"
                                size="sm"
                              >
                                <Edit className="mr-2" size={16} />
                                Editar
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-red-700 text-white hover:bg-red-800"
                              size="sm"
                              disabled={isLoading || isFetching}
                            >
                              {isLoading || isFetching ? (
                                <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-1"></div>
                              ) : (
                                <Trash className="mr-2" size={16} />
                              )}
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditProductIngredientsModal
        open={ingredientModalOpen}
        onClose={() => setIngredientModalOpen(false)}
        productIngredients={selectedProductIngredients}
        onSave={handleSaveIngredients}
      />
    </div>
  );
};

export default Products;
