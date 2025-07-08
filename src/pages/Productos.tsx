import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent,
  SidebarInset
} from '@/components/ui/sidebar';
import Sidebar2 from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardImage } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit, 
  Trash, 
  Upload, 
  Loader2, 
  Scale, 
  Tag, 
  Filter, 
  X, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Image as ImageIcon,
  ArrowUpDown,
  FileUp,
  PencilLine
} from 'lucide-react';
import { useToast, toast } from '@/hooks/use-toast';
import { uploadProductImage } from '@/utils/imageUploadUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FormControl, FormField, FormItem, FormLabel, Form, FormDescription } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ProductCSVImport from '@/components/products/ProductCSVImport';
import VoiceCommandButton from '@/components/products/VoiceCommandButton';
import { ProductCommand } from '@/utils/voiceCommandUtils';
import { renderBarcodes } from '@/utils/barcodeUtils';
import BarcodeButton from '@/components/products/BarcodeButton';

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};

interface Product {
  id: string;
  name: string;
  price: number;
  code?: string;
  cost_price?: number;
  stock?: number;
  image_url?: string;
  category?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  is_weight_based?: boolean;
}

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  price: z.string().min(1, "El precio es requerido"),
  code: z.string().min(1, "El código es requerido"),
  cost_price: z.string().optional(),
  stock: z.string().default("0"),
  category: z.string().nullable(),
  image_url: z.string().optional(),
  is_weight_based: z.boolean().default(false)
});

type ProductFormValues = z.infer<typeof productSchema>;

const categorySchema = z.object({
  name: z.string().min(1, "El nombre de la categoría es requerido"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const Productos = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const scrollTopRef = useRef<HTMLDivElement>(null);

  const addForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: '',
      code: '',
      cost_price: '',
      stock: '0',
      category: null,
      image_url: '',
      is_weight_based: false
    }
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: '',
      code: '',
      cost_price: '',
      stock: '0',
      category: null,
      image_url: '',
      is_weight_based: false
    }
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: ''
    }
  });

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCategories();
    }
  }, [user]);

  useEffect(() => {
    if (currentProduct) {
      editForm.reset({
        name: currentProduct.name,
        price: currentProduct.price.toString(),
        code: currentProduct.code || '',
        cost_price: currentProduct.cost_price?.toString() || '',
        stock: currentProduct.stock?.toString() || '0',
        category: currentProduct.category || null,
        image_url: currentProduct.image_url || '',
        is_weight_based: currentProduct.is_weight_based || false
      });
    }
  }, [currentProduct, editForm]);

  useEffect(() => {
    let filtered = [...products];
    
    if (activeCategory) {
      filtered = filtered.filter(product => product.category === activeCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.code?.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, activeCategory, searchQuery]);

  useEffect(() => {
    if (products.length > 0) {
      const timer = setTimeout(() => {
        renderBarcodes();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [products]);

  const fetchProducts = async () => {
    try {
      if (!user) {
        console.error("TENANT_SECURITY_ERROR: No authenticated user found");
        return;
      }

      // Obtener tenant_id de forma segura
      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        console.error("TENANT_SECURITY_ERROR: No tenant_id found for user:", user.id);
        toast({
          title: "Error de Seguridad",
          description: "No se puede acceder a los productos sin contexto de tenant",
          variant: "destructive",
        });
        return;
      }

      console.log("Fetching products for tenant:", tenantId);
      
      // Consulta con tenant_id para aislamiento completo
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');
      
      if (error) throw error;
      
      const categoryPrefix = `__category_placeholder__`;
      const filteredProducts = data ? data.filter(product => 
        !product.name.startsWith(categoryPrefix)
      ) : [];
      
      setProducts(filteredProducts);
      console.info('Productos cargados para tenant:', tenantId, filteredProducts);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      if (!user) {
        console.error("TENANT_SECURITY_ERROR: No authenticated user found");
        return;
      }
      
      // Obtener tenant_id de forma segura
      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        console.error("TENANT_SECURITY_ERROR: No tenant_id found for user:", user.id);
        return;
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('tenant_id', tenantId)
        .not('category', 'is', null);
      
      if (error) throw error;
      
      const uniqueCategories = [...new Set(data.map(item => item.category))].filter(Boolean);
      setCategories(uniqueCategories);
      console.log('Categorías cargadas para tenant:', tenantId, uniqueCategories);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleAddCategory = async (values: CategoryFormValues) => {
    try {
      setIsLoading(true);
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debe iniciar sesión para agregar categorías",
          variant: "destructive",
        });
        return;
      }
      
      if (categories.includes(values.name)) {
        toast({
          title: "Información",
          description: "Esta categoría ya existe",
        });
        setIsCategoryDialogOpen(false);
        return;
      }
      
      const categoryName = values.name;
      const categoryPrefix = `__category_placeholder__`;
      const placeholderProduct = {
        name: `${categoryPrefix}${categoryName}`,
        price: 0,
        code: `cat_${Date.now()}`,
        cost_price: 0,
        stock: 0,
        category: categoryName,
        user_id: user.id,
        is_weight_based: false
      };

      console.log('Adding category placeholder:', placeholderProduct);

      const { data, error } = await supabase
        .from('products')
        .insert([placeholderProduct])
        .select();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Categoría creada correctamente",
      });

      setCategories(prev => [...prev, categoryName]);
      categoryForm.reset();
      setIsCategoryDialogOpen(false);
      
      fetchProducts();
    } catch (error) {
      console.error('Error al agregar categoría:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la categoría: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${category}"? Los productos asociados a esta categoría quedarán sin categoría.`)) return;
    
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "Debe iniciar sesión para eliminar categorías",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      
      const categoryPrefix = `__category_placeholder__`;
      
      const { error } = await supabase
        .from('products')
        .update({ category: null })
        .eq('user_id', user.id)
        .eq('category', category);

      if (error) throw error;

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('user_id', user.id)
        .eq('name', `${categoryPrefix}${category}`);
      
      if (deleteError) {
        console.error('Error deleting category placeholder:', deleteError);
      }

      setCategories(categories.filter(c => c !== category));
      
      if (activeCategory === category) {
        setActiveCategory(null);
      }

      toast({
        title: "Éxito",
        description: "Categoría eliminada correctamente",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "El archivo debe ser una imagen",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedImage(file);
    
    try {
      setIsUploading(true);
      
      const imageUrl = await uploadProductImage(file);
      
      if (isAddDialogOpen) {
        addForm.setValue('image_url', imageUrl);
      } else if (isEditDialogOpen) {
        editForm.setValue('image_url', imageUrl);
      }
      
      toast({
        title: "Éxito",
        description: "Imagen subida correctamente",
      });
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddProduct = async (values: ProductFormValues) => {
    try {
      setIsLoading(true);
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debe iniciar sesión para agregar productos",
          variant: "destructive",
        });
        return;
      }
      
      const newProduct = {
        name: values.name,
        price: parseFloat(values.price) || 0,
        code: values.code,
        cost_price: parseFloat(values.cost_price || '0') || 0,
        stock: parseInt(values.stock || '0') || 0,
        image_url: values.image_url || null,
        category: values.category,
        is_weight_based: values.is_weight_based,
        user_id: user.id,
      };

      console.log('Adding product:', newProduct);

      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Producto agregado correctamente",
      });

      fetchProducts();
      addForm.reset();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error al agregar producto:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    console.log("Edit clicked for product:", product);
    setCurrentProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async (values: ProductFormValues) => {
    if (!currentProduct) return;
    
    try {
      setIsLoading(true);
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debe iniciar sesión para actualizar productos",
          variant: "destructive",
        });
        return;
      }
      
      const updatedProduct = {
        name: values.name,
        price: parseFloat(values.price) || 0,
        code: values.code,
        cost_price: parseFloat(values.cost_price || '0') || 0,
        stock: parseInt(values.stock || '0') || 0,
        image_url: values.image_url || null,
        category: values.category,
        is_weight_based: values.is_weight_based,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', currentProduct.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      });

      fetchProducts();
      setIsEditDialogOpen(false);
      setCurrentProduct(null);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "Debe iniciar sesión para eliminar productos",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto: " + error.message,
        variant: "destructive",
      });
    }
  };

  const ImageUploadField = ({ form }: { form: any }) => {
    const imageUrl = form.watch('image_url');
    const imageInputRef = useRef<HTMLInputElement>(null);
    
    const handleImageContainerClick = () => {
      if (!imageUrl) {
        imageInputRef.current?.click();
      }
    };
    
    return (
      <div className="grid gap-2">
        <label htmlFor="product-image">Imagen del producto</label>
        <div className="flex flex-col items-center gap-4">
          {imageUrl ? (
            <div className="relative w-full max-w-[200px] h-[200px] mx-auto border rounded-md overflow-hidden">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <Button 
                variant="destructive" 
                size="sm" 
                className="absolute top-2 right-2 w-8 h-8 p-0 rounded-full"
                onClick={() => form.setValue('image_url', '')}
              >
                <Trash size={14} />
              </Button>
            </div>
          ) : (
            <div 
              className="w-full h-[140px] border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer bg-muted/50"
              onClick={handleImageContainerClick}
            >
              <Upload size={30} className="text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Haz clic para subir una imagen</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG o GIF (200x200px)</p>
            </div>
          )}
          
          <div className="w-full">
            <input
              id="product-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
              ref={imageInputRef}
            />
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => imageInputRef.current?.click()} 
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  {imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const scrollToTop = () => {
    scrollTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'ascending'
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedProducts = () => {
    const sortableProducts = [...filteredProducts];
    if (sortConfig.key) {
      sortableProducts.sort((a, b) => {
        if (a[sortConfig.key] === null) return 1;
        if (b[sortConfig.key] === null) return -1;
        if (a[sortConfig.key] === null && b[sortConfig.key] === null) return 0;
        
        if (typeof a[sortConfig.key] === 'string') {
          return sortConfig.direction === 'ascending'
            ? a[sortConfig.key].localeCompare(b[sortConfig.key])
            : b[sortConfig.key].localeCompare(a[sortConfig.key]);
        } else {
          return sortConfig.direction === 'ascending'
            ? a[sortConfig.key] - b[sortConfig.key]
            : b[sortConfig.key] - a[sortConfig.key];
        }
      });
    }
    return sortableProducts;
  };

  const sortedProducts = getSortedProducts();

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} />;
    return sortConfig.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRowExpansion = (productId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleVoiceCommand = async (command: ProductCommand) => {
    if (!user) {
      toast.error("Debe iniciar sesión para utilizar comandos de voz");
      return;
    }
    
    try {
      console.log("Handling voice command:", command);
      
      switch (command.action) {
        case 'crear':
          if (!command.name || !command.price) {
            toast.error("Faltan datos obligatorios: nombre y precio");
            return;
          }
          
          const newProduct = {
            name: command.name,
            price: command.price,
            code: command.code || `SKU${Date.now().toString().slice(-6)}`,
            cost_price: command.cost_price || 0,
            stock: command.stock || 0,
            category: command.category || null,
            is_weight_based: false,
            user_id: user.id,
          };
          
          console.log("Creating product via voice command:", newProduct);
          
          const { data: createdProduct, error: createError } = await supabase
            .from('products')
            .insert([newProduct])
            .select();
            
          if (createError) throw createError;
          
          toast.success(`Producto "${command.name}" creado correctamente`);
          await fetchProducts();
          break;
          
        case 'buscar':
          if (command.name) {
            setSearchQuery(command.name);
          }
          
          if (command.category) {
            const matchingCategory = categories.find(
              cat => cat.toLowerCase().includes(command.category?.toLowerCase() || '')
            );
            if (matchingCategory) {
              setActiveCategory(matchingCategory);
            }
          }
          
          toast.success(`Buscando productos con "${command.name || ''}" ${command.category ? `en categoría ${command.category}` : ''}`);
          break;
          
        case 'editar':
          if (!command.name) {
            toast.error("Debes especificar el nombre del producto a editar");
            return;
          }
          
          // Find the product to edit by name (partial match)
          const productToEdit = products.find(p => 
            p.name.toLowerCase().includes(command.name?.toLowerCase() || ''));
            
          if (!productToEdit) {
            toast.error(`No se encontró el producto "${command.name}"`);
            return;
          }
          
          // Prepare update data
          const updateData: Record<string, any> = {};
          
          if (command.price) updateData.price = command.price;
          if (command.cost_price) updateData.cost_price = command.cost_price;
          if (command.stock) updateData.stock = command.stock;
          if (command.category) updateData.category = command.category;
          
          if (Object.keys(updateData).length === 0) {
            toast.error("No se especificaron datos para actualizar");
            return;
          }
          
          const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', productToEdit.id)
            .eq('user_id', user.id);
            
          if (updateError) throw updateError;
          
          toast.success(`Producto "${productToEdit.name}" actualizado correctamente`);
          await fetchProducts();
          break;
          
        case 'eliminar':
          if (!command.name) {
            toast.error("Debes especificar el nombre del producto a eliminar");
            return;
          }
          
          // Find product to delete by name (partial match)
          const productToDelete = products.find(p => 
            p.name.toLowerCase().includes(command.name?.toLowerCase() || ''));
            
          if (!productToDelete) {
            toast.error(`No se encontró el producto "${command.name}"`);
            return;
          }
          
          // Confirm deletion
          if (!confirm(`¿Estás seguro de eliminar el producto "${productToDelete.name}"?`)) {
            return;
          }
          
          const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', productToDelete.id)
            .eq('user_id', user.id);
            
          if (deleteError) throw deleteError;
          
          toast.success(`Producto "${productToDelete.name}" eliminado correctamente`);
          await fetchProducts();
          break;
      }
    } catch (error) {
      console.error("Error procesando comando de voz:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar2 />
        <SidebarInset className="p-4">
          <TenantSecurityMonitor />
          <div className="flex flex-col h-full" ref={scrollTopRef}>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Gestión de Productos</h1>
              <div className="flex gap-2">
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Tag size={16} />
                      Gestionar Categorías
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Gestionar categorías</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Form {...categoryForm}>
                        <form onSubmit={categoryForm.handleSubmit(handleAddCategory)} className="space-y-4">
                          <FormField
                            control={categoryForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre de la categoría</FormLabel>
                                <div className="flex gap-2">
                                  <FormControl>
                                    <Input 
                                      placeholder="Ej: Bebidas, Snacks, etc." 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <Button 
                                    type="submit"
                                    disabled={isLoading}
                                    size="sm"
                                  >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                  </Button>
                                </div>
                              </FormItem>
                            )}
                          />
                        </form>
                      </Form>
                      
                      <div className="border rounded-md">
                        <ScrollArea className="h-[200px] w-full rounded-md">
                          <div className="p-4 space-y-2">
                            {categories.length > 0 ? (
                              categories.map((category) => (
                                <div 
                                  key={category} 
                                  className="flex items-center justify-between py-2 px-3 bg-secondary/20 rounded-md"
                                >
                                  <span>{category}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDeleteCategory(category)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash size={16} className="text-destructive" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">
                                No hay categorías disponibles
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {user && <ProductCSVImport onImportComplete={fetchProducts} userId={user.id} />}
                
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus size={16} />
                      Agregar Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Agregar nuevo producto</DialogTitle>
                    </DialogHeader>
                    <Form {...addForm}>
                      <form onSubmit={addForm.handleSubmit(handleAddProduct)} className="space-y-4">
                        
                        <FormField
                          control={addForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre*</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Nombre del producto" 
                                  {...field} 
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={addForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Precio de venta*</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0.00" 
                                    {...field} 
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addForm.control}
                            name="cost_price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Precio de costo</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0.00" 
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={addForm.control}
                            name="code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código*</FormLabel>
                                <div className="flex gap-2">
                                  <FormControl>
                                    <Input 
                                      placeholder="SKU o código de barras" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <BarcodeButton 
                                    currentBarcode={field.value}
                                    onGenerate={(barcode) => field.onChange(barcode)}
                                    disabled={isLoading}
                                  />
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addForm.control}
                            name="stock"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stock</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0" 
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={addForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoría</FormLabel>
                              <Select 
                                value={field.value || "no-category"} 
                                onValueChange={(value) => field.onChange(value === "no-category" ? null : value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no-category">Sin categoría</SelectItem>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addForm.control}
                          name="is_weight_based"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer">Producto por peso</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <ImageUploadField form={addForm} />
                        
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              addForm.reset();
                              setIsAddDialogOpen(false);
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit"
                            disabled={isLoading || isUploading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <Plus size={16} className="mr-2" />
                                Guardar Producto
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                
                <VoiceCommandButton 
                  onCommand={handleVoiceCommand}
                  isListening={isListening}
                  setIsListening={setIsListening}
                />
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={scrollToTop}
                  className="ml-auto"
                  title="Volver arriba"
                >
                  <ChevronUp size={16} />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4 items-start">
              <div className="w-full sm:w-auto lg:flex-1 flex gap-2">
                <div className="relative w-full">
                  <Search 
                    size={16} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                  />
                  <Input
                    className="pl-9 w-full"
                    placeholder="Buscar productos por nombre o código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 items-center">
                <Label className="text-sm whitespace-nowrap">Filtrar por categoría:</Label>
                <Select
                  value={activeCategory || "all"}
                  onValueChange={(value) => setActiveCategory(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="hidden lg:table-cell w-[50px]"
                      >
                        #
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer" 
                        onClick={() => requestSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Nombre {renderSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hidden sm:table-cell"
                        onClick={() => requestSort('price')}
                      >
                        <div className="flex items-center gap-1">
                          Precio {renderSortIcon('price')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hidden lg:table-cell"
                        onClick={() => requestSort('cost_price')}
                      >
                        <div className="flex items-center gap-1">
                          Costo {renderSortIcon('cost_price')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hidden md:table-cell"
                        onClick={() => requestSort('stock')}
                      >
                        <div className="flex items-center gap-1">
                          Stock {renderSortIcon('stock')}
                        </div>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">Código</TableHead>
                      <TableHead className="hidden md:table-cell">Categoría</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.map((product, index) => (
                      <React.Fragment key={product.id}>
                        <TableRow 
                          className={expandedRows[product.id] ? "border-b-0" : ""}
                          onClick={() => toggleRowExpansion(product.id)}
                        >
                          <TableCell className="hidden lg:table-cell w-[50px]">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {product.image_url ? (
                                <div className="w-8 h-8 rounded overflow-hidden bg-muted">
                                  <img 
                                    src={product.image_url} 
                                    alt={product.name}
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded flex items-center justify-center bg-muted">
                                  <ImageIcon size={16} className="text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-muted-foreground sm:hidden">
                                  {formatPrice(product.price)}
                                </div>
                              </div>
                              {product.is_weight_based && (
                                <div className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-sm flex items-center gap-1">
                                  <Scale size={12} />
                                  <span>Por peso</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {formatPrice(product.price)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {product.cost_price ? formatPrice(product.cost_price) : "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {product.stock ?? "0"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div 
                              className="w-full overflow-hidden text-ellipsis whitespace-nowrap"
                              style={{ maxWidth: "150px" }}
                            >
                              {product.code || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {product.category || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(product);
                                }}
                                title="Editar"
                              >
                                <Edit size={16} className="text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProduct(product.id);
                                }}
                                title="Eliminar"
                              >
                                <Trash size={16} className="text-destructive" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 md:hidden"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRowExpansion(product.id);
                                }}
                                title={expandedRows[product.id] ? "Contraer" : "Expandir"}
                              >
                                {expandedRows[product.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {expandedRows[product.id] && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={8} className="py-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-2">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">Código:</h4>
                                  <p className="text-sm">{product.code || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">Stock:</h4>
                                  <p className="text-sm">{product.stock ?? "0"}</p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">Categoría:</h4>
                                  <p className="text-sm">{product.category || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">Precio de venta:</h4>
                                  <p className="text-sm">{formatPrice(product.price)}</p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">Precio de costo:</h4>
                                  <p className="text-sm">{product.cost_price ? formatPrice(product.cost_price) : "-"}</p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">Tipo:</h4>
                                  <p className="text-sm">{product.is_weight_based ? "Por peso" : "Por unidad"}</p>
                                </div>
                                
                                {product.code && /^\d{13}$/.test(product.code) && (
                                  <div className="col-span-full">
                                    <h4 className="text-sm font-semibold mb-1">Código de barras:</h4>
                                    <div className="bg-white p-3 rounded-md inline-block">
                                      <svg
                                        className="h-14"
                                        jsbarcode-format="ean13"
                                        jsbarcode-value={product.code}
                                        jsbarcode-textmargin="0"
                                        jsbarcode-fontoptions="bold"
                                      ></svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border rounded-md flex flex-col items-center justify-center py-12 px-4">
                <div className="mb-4 bg-muted/30 p-4 rounded-full">
                  <Tag size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No hay productos disponibles</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {searchQuery || activeCategory 
                    ? "No se encontraron productos con los filtros seleccionados. Intenta con otra búsqueda o categoría."
                    : "Aún no has agregado productos. Haz clic en el botón 'Agregar Producto' para comenzar."}
                </p>
                <Button 
                  onClick={() => {
                    if (searchQuery || activeCategory) {
                      setSearchQuery('');
                      setActiveCategory(null);
                    } else {
                      setIsAddDialogOpen(true)
                    }
                  }}
                >
                  {searchQuery || activeCategory 
                    ? "Limpiar filtros" 
                    : "Agregar primer producto"}
                </Button>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateProduct)} className="space-y-4">
              
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nombre del producto" 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio de venta*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="cost_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio de costo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código*</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            placeholder="SKU o código de barras" 
                            {...field} 
                          />
                        </FormControl>
                        <BarcodeButton 
                          currentBarcode={field.value}
                          onGenerate={(barcode) => field.onChange(barcode)}
                          disabled={isLoading}
                        />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select 
                      value={field.value || "no-category"} 
                      onValueChange={(value) => field.onChange(value === "no-category" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-category">Sin categoría</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="is_weight_based"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Producto por peso</FormLabel>
                  </FormItem>
                )}
              />
              
              <ImageUploadField form={editForm} />
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setCurrentProduct(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading || isUploading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <PencilLine size={16} className="mr-2" />
                      Actualizar Producto
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default Productos;
