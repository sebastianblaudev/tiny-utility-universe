import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, Minus, ChefHat, Send } from "lucide-react";
import { useMesas, type Mesa } from "@/hooks/useMesas";
import { usePedidosMesa, type PedidoMesaDetalle, type Product } from "@/hooks/usePedidosMesa";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MesasPOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MesasPOSModal({ isOpen, onClose }: MesasPOSModalProps) {
  const { tenantId } = useAuth();
  const { mesas, ocuparMesa, liberarMesa } = useMesas();
  const {
    createPedidoMesa,
    addItemToPedido,
    removeItemFromPedido,
    enviarACocina,
    completarPedido,
    getPedidoActivoByMesa
  } = usePedidosMesa();

  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [pedido, setPedido] = useState<PedidoMesaDetalle | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen, tenantId]);

  useEffect(() => {
    if (selectedMesa) {
      loadPedidoForMesa();
    }
  }, [selectedMesa]);

  const loadProducts = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, cost_price, stock, is_by_weight, category, image_url')
        .eq('tenant_id', tenantId)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar productos');
    }
  };

  const loadPedidoForMesa = async () => {
    if (!selectedMesa) return;
    
    try {
      const pedidoActivo = await getPedidoActivoByMesa(selectedMesa.id);
      setPedido(pedidoActivo as PedidoMesaDetalle);
    } catch (error) {
      console.error('Error loading pedido:', error);
    }
  };

  const handleCreatePedido = async () => {
    if (!selectedMesa) return;
    
    const nuevoPedido = await createPedidoMesa(selectedMesa.id);
    if (nuevoPedido) {
      setPedido(nuevoPedido as PedidoMesaDetalle);
      await ocuparMesa(selectedMesa.id);
    }
  };

  const handleAddProduct = async (product: Product) => {
    if (!pedido) {
      await handleCreatePedido();
      return;
    }
    
    const quantity = quantities[product.id] || 1;
    await addItemToPedido(pedido.id, product.id, quantity, product.price);
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
    loadPedidoForMesa();
  };

  const handleEnviarACocina = async () => {
    if (!pedido) return;
    
    const success = await enviarACocina(pedido.id);
    if (success) {
      toast.success('Pedido enviado a cocina');
      loadPedidoForMesa();
    }
  };

  const handleCompletarPedido = async () => {
    if (!pedido || !selectedMesa) return;
    
    const success = await completarPedido(pedido.id);
    if (success) {
      await liberarMesa(selectedMesa.id);
      setSelectedMesa(null);
      setPedido(null);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableMesas = mesas.filter(mesa => mesa.estado !== 'fuera_servicio');

  if (!selectedMesa) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <ChefHat className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Sistema de Mesas</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableMesas.map((mesa) => (
                <Card 
                  key={mesa.id}
                  className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                    mesa.estado === 'ocupada' ? 'border-red-200 bg-red-50' :
                    mesa.estado === 'reservada' ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }`}
                  onClick={() => setSelectedMesa(mesa)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                      mesa.estado === 'ocupada' ? 'bg-red-500' :
                      mesa.estado === 'reservada' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <h3 className="font-bold text-lg">Mesa {mesa.numero}</h3>
                    {mesa.nombre && <p className="text-sm text-muted-foreground">{mesa.nombre}</p>}
                    <Badge variant="outline" className="mt-2">
                      {mesa.estado === 'disponible' ? 'Disponible' :
                       mesa.estado === 'ocupada' ? 'Ocupada' : 'Reservada'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 gap-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedMesa(null)}>
              ← Volver
            </Button>
            <h2 className="text-xl font-bold">Mesa {selectedMesa.numero}</h2>
            <Badge variant={selectedMesa.estado === 'ocupada' ? 'destructive' : 'secondary'}>
              {selectedMesa.estado}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Products Panel */}
          <div className="flex-1 flex flex-col border-r">
            <div className="p-4 border-b">
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            ${product.price.toFixed(2)}
                          </p>
                          {product.stock <= 0 && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Sin stock
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setQuantities(prev => ({
                                ...prev,
                                [product.id]: Math.max(1, (prev[product.id] || 1) - 1)
                              }))}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm w-6 text-center">
                              {quantities[product.id] || 1}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setQuantities(prev => ({
                                ...prev,
                                [product.id]: (prev[product.id] || 1) + 1
                              }))}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddProduct(product)}
                            className="h-8"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Order Panel */}
          <div className="w-96 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg">Pedido</h3>
              {pedido && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">
                    #{pedido.numero_pedido}
                  </span>
                  <Badge variant={pedido.estado === 'activo' ? 'default' : 'secondary'}>
                    {pedido.estado}
                  </Badge>
                </div>
              )}
            </div>
            
            <ScrollArea className="flex-1">
              {!pedido ? (
                <div className="p-4">
                  <p className="text-muted-foreground mb-4">No hay pedido activo</p>
                  <Button onClick={handleCreatePedido} className="w-full">
                    Crear Pedido
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {pedido.items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.product.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {item.cantidad}x ${item.precio_unitario.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              ${item.subtotal.toFixed(2)}
                            </span>
                            {item.estado === 'pendiente' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => removeItemFromPedido(item.id, pedido.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {pedido && (
              <div className="p-4 border-t space-y-3">
                <div className="flex justify-between items-center font-bold">
                  <span>Total:</span>
                  <span>${pedido.total.toFixed(2)}</span>
                </div>
                
                {pedido.estado === 'activo' && pedido.items.length > 0 && (
                  <Button onClick={handleEnviarACocina} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar a Cocina
                  </Button>
                )}
                
                {pedido.estado === 'enviado_cocina' && (
                  <Button onClick={handleCompletarPedido} className="w-full" variant="outline">
                    Completar Pedido
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}