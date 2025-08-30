import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, Trash2, Save, Building, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { parseCSV } from '@/utils/csvUtils';

interface ProductRow {
  id: string;
  nombre: string;
  imagenUrl: string;
  categoria: string;
  precio: string;
  stock: string;
}

const Massive = () => {
  const { toast } = useToast();
  const { user, tenantId, loading } = useAuth();
  const [isProcessingCSV, setIsProcessingCSV] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([
    {
      id: '1',
      nombre: '',
      imagenUrl: '',
      categoria: '',
      precio: '',
      stock: ''
    }
  ]);

  const addRow = () => {
    const newId = (products.length + 1).toString();
    setProducts([
      ...products,
      {
        id: newId,
        nombre: '',
        imagenUrl: '',
        categoria: '',
        precio: '',
        stock: ''
      }
    ]);
  };

  const removeRow = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(product => product.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof ProductRow, value: string) => {
    setProducts(products.map(product => 
      product.id === id ? { ...product, [field]: value } : product
    ));
  };

  const handleSave = async () => {
    if (!tenantId) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo identificar el tenant. Inicia sesión nuevamente.",
        variant: "destructive"
      });
      return;
    }

    const validProducts = products.filter(p => 
      p.nombre.trim() && p.precio.trim() && p.stock.trim()
    );

    if (validProducts.length === 0) {
      toast({
        title: "Sin productos válidos",
        description: "Debes completar al menos un producto con nombre, precio y stock.",
        variant: "destructive"
      });
      return;
    }
    
    // Preparar productos para inserción con tenant_id
    const productsToInsert = validProducts.map(product => ({
      name: product.nombre.trim(),
      price: parseFloat(product.precio),
      stock: parseInt(product.stock),
      cost_price: 0, // Valor por defecto
      category: product.categoria.trim() || null,
      image_url: product.imagenUrl.trim() || null,
      tenant_id: tenantId,
      user_id: user?.id,
      code: `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
      is_weight_based: false,
      is_by_weight: false
    }));

    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select();

      if (error) {
        console.error('Error insertando productos:', error);
        toast({
          title: "Error al guardar productos",
          description: `Error: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "¡Productos guardados exitosamente!",
        description: `Se guardaron ${data.length} productos en tu tenant.`,
      });

      // Limpiar formulario
      setProducts([{
        id: '1',
        nombre: '',
        imagenUrl: '',
        categoria: '',
        precio: '',
        stock: ''
      }]);

    } catch (error) {
      console.error('Error inesperado:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al guardar los productos.",
        variant: "destructive"
      });
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    if (!tenantId) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo identificar el tenant. Inicia sesión nuevamente.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingCSV(true);
    
    try {
      // Usar la función parseCSV existente del proyecto
      const csvData = await parseCSV(file, []);
      
      // Convertir los datos del CSV al formato de ProductRow
      const csvProducts: ProductRow[] = csvData.map((item, index) => ({
        id: (products.length + index + 1).toString(),
        nombre: item.name || '',
        imagenUrl: item.image_url || '',
        categoria: item.category || '',
        precio: item.price?.toString() || '',
        stock: item.stock?.toString() || ''
      }));

      if (csvProducts.length === 0) {
        toast({
          title: "Archivo CSV vacío",
          description: "El archivo CSV no contiene productos válidos.",
          variant: "destructive"
        });
        return;
      }

      // Agregar los productos del CSV a la lista existente
      setProducts([...products, ...csvProducts]);

      toast({
        title: "CSV procesado exitosamente",
        description: `Se cargaron ${csvProducts.length} productos desde el archivo CSV.`,
      });

    } catch (error: any) {
      console.error('Error procesando CSV:', error);
      toast({
        title: "Error al procesar CSV",
        description: error.message || "Ocurrió un error al procesar el archivo CSV.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingCSV(false);
      // Limpiar el input para permitir cargar el mismo archivo nuevamente
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Carga Masiva de Productos</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground">
                Los productos se cargarán en tu tenant personal
              </p>
              {tenantId && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  Tenant: {tenantId.slice(-8)}
                </Badge>
              )}
              {user && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {user.email}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={addRow} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Fila
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Guardar Productos
            </Button>
          </div>
        </div>

        {/* CSV Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Carga desde CSV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
                disabled={isProcessingCSV}
              />
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="space-y-2">
                  {isProcessingCSV ? (
                    <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {isProcessingCSV ? "Procesando archivo CSV..." : "Haz clic aquí o arrastra un archivo CSV"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formato esperado: Nombre, Categoría, Precio, Precio de Costo, Stock, Código, URL de Imagen
                  </p>
                </div>
              </Label>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Manual Entry Section */}
        <Card>
          <CardHeader>
            <CardTitle>Entrada Manual de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Headers */}
                <div className="grid grid-cols-6 gap-4 p-3 bg-muted/50 rounded-t-lg font-medium text-sm">
                  <div>Nombre *</div>
                  <div>Imagen URL</div>
                  <div>Categoría</div>
                  <div>Precio *</div>
                  <div>Stock *</div>
                  <div className="text-center">Acciones</div>
                </div>
                
                {/* Rows */}
                <div className="space-y-2 mt-2">
                  {products.map((product, index) => (
                    <div key={product.id} className="grid grid-cols-6 gap-4 p-3 border border-border rounded-lg">
                      <Input
                        placeholder="Nombre del producto"
                        value={product.nombre}
                        onChange={(e) => updateProduct(product.id, 'nombre', e.target.value)}
                        className="h-9"
                      />
                      <Input
                        placeholder="https://imagen.com/producto.jpg"
                        value={product.imagenUrl}
                        onChange={(e) => updateProduct(product.id, 'imagenUrl', e.target.value)}
                        className="h-9"
                      />
                      <Input
                        placeholder="Categoría"
                        value={product.categoria}
                        onChange={(e) => updateProduct(product.id, 'categoria', e.target.value)}
                        className="h-9"
                      />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={product.precio}
                        onChange={(e) => updateProduct(product.id, 'precio', e.target.value)}
                        className="h-9"
                      />
                      <Input
                        type="number"
                        placeholder="0"
                        value={product.stock}
                        onChange={(e) => updateProduct(product.id, 'stock', e.target.value)}
                        className="h-9"
                      />
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(product.id)}
                          disabled={products.length === 1}
                          className="h-9 w-9 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                Total de productos: {products.length} | 
                Productos válidos: {products.filter(p => p.nombre.trim() && p.precio.trim() && p.stock.trim()).length}
              </div>
              <div className="text-xs text-muted-foreground">
                * Campos requeridos: Nombre, Precio y Stock
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Massive;