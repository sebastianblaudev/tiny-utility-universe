import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Plus, 
  Minus, 
  Package, 
  Save, 
  RefreshCw,
  Smartphone,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUserTenantId } from '@/lib/supabase-helpers';

interface Product {
  id: string;
  name: string;
  price: number;
  code?: string;
  stock?: number;
  category?: string;
}

interface StockUpdate {
  id: string;
  currentStock: number;
  newStock: number;
  isModified: boolean;
}

export const QuickInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockUpdates, setStockUpdates] = useState<Record<string, StockUpdate>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.code?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchQuery]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      if (!user) return;

      const tenantId = await getCurrentUserTenantId();
      if (!tenantId) {
        console.error('No tenant ID available');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, code, stock, category')
        .eq('tenant_id', tenantId)
        .order('name');
      
      if (error) throw error;
      
      const filteredProducts = data ? data.filter(product => 
        !product.name.startsWith('__category_placeholder__')
      ) : [];
      
      setProducts(filteredProducts);
      
      // Initialize stock updates
      const initialUpdates: Record<string, StockUpdate> = {};
      filteredProducts.forEach(product => {
        initialUpdates[product.id] = {
          id: product.id,
          currentStock: product.stock || 0,
          newStock: product.stock || 0,
          isModified: false
        };
      });
      setStockUpdates(initialUpdates);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStock = (productId: string, newStock: number) => {
    if (newStock < 0) return;
    
    setStockUpdates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        newStock,
        isModified: newStock !== prev[productId].currentStock
      }
    }));
  };

  const quickAdjust = (productId: string, adjustment: number) => {
    const current = stockUpdates[productId]?.newStock || 0;
    const newStock = Math.max(0, parseFloat((current + adjustment).toFixed(3)));
    updateStock(productId, newStock);
  };

  const saveChanges = async () => {
    const modifiedUpdates = Object.values(stockUpdates).filter(update => update.isModified);
    
    if (modifiedUpdates.length === 0) {
      toast({
        title: "Información",
        description: "No hay cambios para guardar",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const updates = modifiedUpdates.map(update => ({
        id: update.id,
        stock: update.newStock
      }));

      const tenantId = await getCurrentUserTenantId();
      if (!tenantId) {
        throw new Error('No tenant ID available');
      }

      for (const update of updates) {
        const { error } = await supabase
          .from('products')
          .update({ stock: update.stock })
          .eq('id', update.id)
          .eq('tenant_id', tenantId);

        if (error) throw error;
      }

      // Update current stock values after successful save
      setStockUpdates(prev => {
        const updated = { ...prev };
        modifiedUpdates.forEach(update => {
          updated[update.id] = {
            ...updated[update.id],
            currentStock: update.newStock,
            isModified: false
          };
        });
        return updated;
      });

      toast({
        title: "Éxito",
        description: `Se actualizaron ${modifiedUpdates.length} productos`,
      });

      await fetchProducts();
    } catch (error) {
      console.error('Error saving stock updates:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetChanges = () => {
    setStockUpdates(prev => {
      const reset = { ...prev };
      Object.keys(reset).forEach(key => {
        reset[key] = {
          ...reset[key],
          newStock: reset[key].currentStock,
          isModified: false
        };
      });
      return reset;
    });
  };

  const modifiedCount = Object.values(stockUpdates).filter(update => update.isModified).length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2" variant="outline">
          <Smartphone className="h-4 w-4" />
          <Zap className="h-4 w-4" />
          Inventario Rápido
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventario Rápido - Gestión Móvil
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {/* Search and Controls */}
          <div className="px-6 py-4 border-b space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto por nombre, código o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={fetchProducts} 
                  variant="outline" 
                  size="sm" 
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                
                {modifiedCount > 0 && (
                  <Badge variant="secondary">
                    {modifiedCount} productos modificados
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                {modifiedCount > 0 && (
                  <Button onClick={resetChanges} variant="outline" size="sm">
                    Cancelar
                  </Button>
                )}
                <Button 
                  onClick={saveChanges} 
                  disabled={modifiedCount === 0 || isSaving}
                  size="sm"
                  className="gap-2"
                >
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </div>

          {/* Products List */}
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-3 py-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Cargando productos...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>No se encontraron productos</p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const update = stockUpdates[product.id];
                  if (!update) return null;

                  return (
                    <Card 
                      key={product.id} 
                      className={`transition-all ${update.isModified ? 'ring-2 ring-primary' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Product Info */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{product.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {product.code && (
                                  <span className="bg-muted px-2 py-1 rounded text-xs">
                                    {product.code}
                                  </span>
                                )}
                                {product.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {product.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {update.isModified && (
                              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>

                          {/* Stock Controls */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Stock actual: </span>
                              <span className="font-medium">{update.currentStock}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Quick Adjust Buttons */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => quickAdjust(product.id, -10)}
                                className="h-8 w-8 p-0"
                              >
                                -10
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => quickAdjust(product.id, -1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              
                              {/* Stock Input */}
                              <Input
                                type="number"
                                value={update.newStock}
                                onChange={(e) => updateStock(product.id, parseFloat(e.target.value) || 0)}
                                className="w-20 h-8 text-center"
                                min="0"
                                step="0.001"
                              />
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => quickAdjust(product.id, 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => quickAdjust(product.id, 10)}
                                className="h-8 w-8 p-0"
                              >
                                +10
                              </Button>
                            </div>
                          </div>

                          {/* Change Indicator */}
                          {update.isModified && (
                            <div className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                              Cambio: {update.currentStock} → {update.newStock} 
                              ({update.newStock - update.currentStock > 0 ? '+' : ''}{update.newStock - update.currentStock})
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};