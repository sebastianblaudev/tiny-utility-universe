import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getProducts, saveProduct, deleteProduct, type Product } from "@/lib/db-service";
import { Pencil, Trash2, PlusCircle, Search, Tag, FileDown, FileUp, Download } from "lucide-react";
import { formatCLP } from "@/lib/utils";
import * as XLSX from 'xlsx';

// Form schema
const productFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "El nombre del producto es requerido"),
  category: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  sku: z.string().optional(),
  stock: z.coerce.number().min(0, "El stock debe ser mayor o igual a 0").default(0),
  available: z.boolean().default(true),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category: "",
      unitPrice: 0,
      sku: "",
      stock: 0,
      available: true,
      description: "",
    },
  });

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Error al cargar los productos");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Reset form and editing state
  const resetForm = () => {
    form.reset({
      id: undefined,
      name: "",
      category: "",
      unitPrice: 0,
      sku: "",
      stock: 0,
      available: true,
      description: "",
    });
    setEditingProduct(null);
  };

  // Open dialog for editing
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      id: product.id,
      name: product.name,
      category: product.category || "",
      unitPrice: product.unitPrice,
      sku: product.sku || "",
      stock: product.stock || 0,
      available: product.available !== false,
      description: product.description || "",
    });
    setIsDialogOpen(true);
  };

  // Handle product delete
  const handleDelete = async (id?: number) => {
    if (!id) return;

    if (confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await deleteProduct(id);
        setProducts(products.filter((product) => product.id !== id));
        toast.success("Producto eliminado exitosamente");
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Error al eliminar el producto");
      }
    }
  };

  // Handle form submission
  const onSubmit = async (values: ProductFormValues) => {
    try {
      const productData: Product = {
        id: values.id,
        name: values.name,
        category: values.category || undefined,
        unitPrice: values.unitPrice,
        sku: values.sku || undefined,
        stock: values.stock,
        available: values.available,
        description: values.description || undefined,
      };

      const savedProduct = await saveProduct(productData);

      // Update products list
      if (values.id) {
        setProducts(
          products.map((p) => (p.id === savedProduct.id ? savedProduct : p))
        );
      } else {
        setProducts([...products, savedProduct]);
      }

      toast.success(
        `Producto ${values.id ? "actualizado" : "creado"} exitosamente`
      );
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(`Error al ${values.id ? "actualizar" : "crear"} el producto`);
    }
  };

  // Export products to CSV
  const handleExportCSV = () => {
    try {
      const exportData = products.map(product => ({
        nombre: product.name,
        categoria: product.category || '',
        precio: product.unitPrice,
        sku: product.sku || '',
        stock: product.stock || 0,
        disponible: product.available ? 'Sí' : 'No',
        descripcion: product.description || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const fileName = `productos_${date}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      toast.success("Productos exportados exitosamente");
    } catch (error) {
      console.error("Error exporting products:", error);
      toast.error("Error al exportar productos");
    }
  };

  // Import products from CSV
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target || !event.target.result) return;
        
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        if (jsonData.length === 0) {
          toast.error("El archivo no contiene datos");
          return;
        }
        
        // Map the imported data to our product structure
        const importedProducts: Product[] = jsonData.map((row: any) => ({
          id: undefined, // new products don't have IDs yet
          name: row.nombre || row.name || "",
          category: row.categoria || row.category || undefined,
          unitPrice: Number(row.precio || row.unitPrice || 0),
          sku: row.sku || undefined,
          stock: Number(row.stock || 0),
          available: row.disponible === 'Sí' || row.available === true || row.available === "true",
          description: row.descripcion || row.description || undefined,
        }));
        
        // Save each imported product
        let savedCount = 0;
        let errorCount = 0;
        
        for (const product of importedProducts) {
          if (!product.name) {
            errorCount++;
            continue;
          }
          
          try {
            await saveProduct(product);
            savedCount++;
          } catch (error) {
            console.error(`Error importing product ${product.name}:`, error);
            errorCount++;
          }
        }
        
        // Refresh products list
        const updatedProducts = await getProducts();
        setProducts(updatedProducts);
        
        if (errorCount === 0) {
          toast.success(`${savedCount} productos importados exitosamente`);
        } else {
          toast.warning(`${savedCount} productos importados. ${errorCount} productos con errores.`);
        }
        
        // Reset file input
        e.target.value = '';
        setCsvDialogOpen(false);
      } catch (error) {
        console.error("Error importing products:", error);
        toast.error("Error al importar productos");
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Download CSV import template
  const handleDownloadTemplate = () => {
    try {
      // Create sample data with column headers
      const templateData = [
        {
          nombre: "",
          categoria: "",
          precio: "",
          sku: "",
          stock: "",
          disponible: "Sí", // Default value
          descripcion: ""
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
      
      // Generate template filename
      const fileName = `plantilla_importacion_productos.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      toast.success("Plantilla descargada exitosamente");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Error al descargar la plantilla");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-chile-blue mb-2">
            Productos y Servicios
          </h1>
          <p className="text-muted-foreground">
            Administra tu catálogo de productos y servicios para incluirlos en tus cotizaciones
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2 flex-wrap">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 py-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del producto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <FormControl>
                          <Input placeholder="Categoría" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio unitario *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU / Código</FormLabel>
                          <FormControl>
                            <Input placeholder="Código del producto" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="available"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Disponible</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Input placeholder="Descripción" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingProduct ? "Actualizar" : "Guardar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* CSV Import/Export Dialog */}
          <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileUp className="h-4 w-4 mr-2" />
                Importar CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Importar productos desde CSV</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Selecciona un archivo CSV o Excel (.xlsx) para importar productos. 
                  El archivo debe contener las siguientes columnas: nombre, categoria, precio, sku, stock, disponible y descripcion.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadTemplate}
                  className="w-full mb-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar plantilla
                </Button>
                <Input 
                  type="file" 
                  accept=".csv,.xlsx" 
                  onChange={handleImportCSV}
                  className="mb-4"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCsvDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleExportCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card className="cotipro-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Catálogo de productos</CardTitle>
          <CardDescription>
            {products.length} producto(s) en el catálogo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Cargando productos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay productos en el catálogo. Crea tu primer producto usando el botón "Nuevo Producto".
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Categoría</th>
                    <th className="p-3 text-left">SKU</th>
                    <th className="p-3 text-right">Precio</th>
                    <th className="p-3 text-right">Stock</th>
                    <th className="p-3 text-center">Disponible</th>
                    <th className="p-3 text-left">Descripción</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-3">{product.name}</td>
                      <td className="p-3">{product.category || "-"}</td>
                      <td className="p-3">{product.sku || "-"}</td>
                      <td className="p-3 text-right">{formatCLP(product.unitPrice)}</td>
                      <td className="p-3 text-right">{product.stock || 0}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.available !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.available !== false ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="p-3 max-w-[200px] truncate">
                        {product.description || "-"}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
