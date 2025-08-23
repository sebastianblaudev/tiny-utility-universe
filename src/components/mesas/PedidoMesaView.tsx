import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Plus, Minus, Trash2, ChefHat, CheckCircle, Search } from "lucide-react";
import { usePedidosMesa, type PedidoMesaDetalle, type Product } from "@/hooks/usePedidosMesa";
import { useMesas, type Mesa } from "@/hooks/useMesas";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PrintReceiptModal } from "@/components/mesas/PrintReceiptModal";

interface PedidoMesaViewProps {
  mesa: Mesa;
  onBack: () => void;
}

export function PedidoMesaView({ mesa, onBack }: PedidoMesaViewProps) {
  const { tenantId } = useAuth();
  const { ocuparMesa, liberarMesa } = useMesas();
  const {
    getPedidoActivoByMesa,
    createPedidoMesa,
    addItemToPedido,
    removeItemFromPedido,
    enviarACocina,
    completarPedido
  } = usePedidosMesa();

  const [pedido, setPedido] = useState<PedidoMesaDetalle | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [meseroNombre, setMeseroNombre] = useState('');

  useEffect(() => {
    loadPedidoAndProducts();
  }, [mesa.id]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredProducts(
        products.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const loadPedidoAndProducts = async () => {
    setLoading(true);
    try {
      // Cargar pedido activo
      const pedidoActivo = await getPedidoActivoByMesa(mesa.id);
      setPedido(pedidoActivo as PedidoMesaDetalle);

      // Cargar productos
      const { data: productsData, error } = await supabase
        .from('products')
        .select('id, name, price, cost_price, stock, is_by_weight, category, image_url')
        .eq('tenant_id', tenantId)
        .order('name');

      if (error) throw error;
      setProducts(productsData || []);
      setFilteredProducts(productsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePedido = async () => {
    const nuevoPedido = await createPedidoMesa(mesa.id, meseroNombre);
    if (nuevoPedido) {
      setPedido(nuevoPedido as PedidoMesaDetalle);
      await ocuparMesa(mesa.id);
    }
  };

  const handleAddProduct = async (product: Product, cantidad: number = 1) => {
    if (!pedido) return;
    
    await addItemToPedido(pedido.id, product.id, cantidad, product.price);
    loadPedidoAndProducts();
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!pedido) return;
    
    await removeItemFromPedido(itemId, pedido.id);
    loadPedidoAndProducts();
  };

  const handleEnviarACocina = async () => {
    if (!pedido) return;
    
    const success = await enviarACocina(pedido.id);
    if (success) {
      setShowPrintModal(true);
      loadPedidoAndProducts();
    }
  };

  const handleCompletarPedido = async () => {
    if (!pedido) return;
    
    const success = await completarPedido(pedido.id);
    if (success) {
      await liberarMesa(mesa.id);
      onBack();
    }
  };

  const getComandaData = () => {
    if (!pedido) return null;
    
    return {
      mesa: `Mesa ${mesa.numero}${mesa.nombre ? ` - ${mesa.nombre}` : ''}`,
      numeroPedido: pedido.numero_pedido,
      mesero: pedido.mesero_nombre || 'Sin asignar',
      fecha: new Date().toLocaleString(),
      items: pedido.items
        .filter(item => item.estado === 'enviado_cocina')
        .map(item => ({
          nombre: item.product.name,
          cantidad: item.cantidad,
          notas: item.notas || ''
        }))
    };
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">
          Mesa {mesa.numero}
          {mesa.nombre && <span className="text-muted-foreground"> - {mesa.nombre}</span>}
        </h1>
        <Badge variant={mesa.estado === 'ocupada' ? 'destructive' : 'secondary'}>
          {mesa.estado}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de productos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-1 gap-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${product.price.toFixed(2)}
                        {product.category && ` • ${product.category}`}
                      </p>
                      {product.stock <= 0 && (
                        <Badge variant="destructive" className="mt-1">Sin stock</Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={product.stock <= 0 || !pedido}
                      onClick={() => handleAddProduct(product)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Panel de pedido */}
        <Card>
          <CardHeader>
            <CardTitle>Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            {!pedido ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">No hay pedido activo para esta mesa</p>
                <Input
                  placeholder="Nombre del mesero (opcional)"
                  value={meseroNombre}
                  onChange={(e) => setMeseroNombre(e.target.value)}
                />
                <Button onClick={handleCreatePedido} className="w-full">
                  Crear Pedido
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Pedido #{pedido.numero_pedido}</h3>
                    {pedido.mesero_nombre && (
                      <p className="text-sm text-muted-foreground">
                        Mesero: {pedido.mesero_nombre}
                      </p>
                    )}
                  </div>
                  <Badge variant={pedido.estado === 'activo' ? 'default' : 'secondary'}>
                    {pedido.estado}
                  </Badge>
                </div>

                <Separator />

                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {pedido.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.cantidad}x ${item.precio_unitario.toFixed(2)} = ${item.subtotal.toFixed(2)}
                          </p>
                          {item.notas && (
                            <p className="text-xs text-muted-foreground italic">
                              Nota: {item.notas}
                            </p>
                          )}
                          <Badge 
                            variant={item.estado === 'enviado_cocina' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {item.estado}
                          </Badge>
                        </div>
                        {item.estado === 'pendiente' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>${pedido.total.toFixed(2)}</span>
                  </div>
                </div>

                {pedido.estado === 'activo' && pedido.items.length > 0 && (
                  <Button onClick={handleEnviarACocina} className="w-full">
                    <ChefHat className="w-4 h-4 mr-2" />
                    Enviar a Cocina
                  </Button>
                )}

                {pedido.estado === 'enviado_cocina' && (
                  <Button onClick={handleCompletarPedido} className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completar Pedido
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showPrintModal && (
        <PrintReceiptModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          receiptData={getComandaData()}
          isComanda={true}
        />
      )}
    </div>
  );
}