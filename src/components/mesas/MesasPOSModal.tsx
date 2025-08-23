import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, ChefHat, Send, ArrowLeft } from "lucide-react";
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
    enviarACocina,
    completarPedido,
    getPedidoActivoByMesa
  } = usePedidosMesa();

  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [pedido, setPedido] = useState<PedidoMesaDetalle | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
      setSelectedMesa(null);
      setPedido(null);
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
        .select('id, name, price, category')
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
      setPedido(null);
    }
  };

  const handleSelectMesa = async (mesa: Mesa) => {
    setSelectedMesa(mesa);
    setLoading(true);
    
    try {
      // Verificar si ya existe un pedido
      const pedidoExistente = await getPedidoActivoByMesa(mesa.id);
      
      if (!pedidoExistente) {
        // Crear pedido automáticamente
        const nuevoPedido = await createPedidoMesa(mesa.id, 'Mesero');
        if (nuevoPedido) {
          setPedido(nuevoPedido as PedidoMesaDetalle);
          await ocuparMesa(mesa.id);
        }
      } else {
        setPedido(pedidoExistente as PedidoMesaDetalle);
      }
    } catch (error) {
      console.error('Error al preparar mesa:', error);
      toast.error('Error al preparar la mesa');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (product: Product) => {
    if (!pedido || !selectedMesa) return;
    
    try {
      await addItemToPedido(pedido.id, product.id, 1, product.price);
      await loadPedidoForMesa();
      toast.success(`${product.name} agregado`);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error al agregar producto');
    }
  };

  const handleEnviarACocina = async () => {
    if (!pedido) return;
    
    try {
      setLoading(true);
      const success = await enviarACocina(pedido.id);
      if (success) {
        toast.success('¡Pedido enviado a cocina!');
        printComanda();
        await loadPedidoForMesa();
      }
    } catch (error) {
      console.error('Error enviando a cocina:', error);
      toast.error('Error al enviar a cocina');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletarPedido = async () => {
    if (!pedido || !selectedMesa) return;
    
    try {
      setLoading(true);
      const success = await completarPedido(pedido.id);
      if (success) {
        await liberarMesa(selectedMesa.id);
        setSelectedMesa(null);
        setPedido(null);
        toast.success('¡Pedido completado!');
      }
    } catch (error) {
      console.error('Error completando pedido:', error);
      toast.error('Error al completar pedido');
    } finally {
      setLoading(false);
    }
  };

  const printComanda = () => {
    if (!pedido || !selectedMesa) return;
    
    const printContent = `
      <div style="font-family: monospace; padding: 20px; max-width: 300px;">
        <h2 style="text-align: center; margin-bottom: 20px;">COMANDA DE COCINA</h2>
        <div style="border-bottom: 2px dashed #000; margin-bottom: 15px; padding-bottom: 15px;">
          <strong>Mesa: ${selectedMesa.numero}</strong><br>
          <strong>Pedido: #${pedido.numero_pedido}</strong><br>
          <strong>Hora: ${new Date().toLocaleTimeString()}</strong>
        </div>
        <div style="margin-bottom: 20px;">
          ${pedido.items.map(item => `
            <div style="margin-bottom: 10px; padding: 8px; border: 1px solid #ccc;">
              <strong>${item.cantidad}x ${item.product.name}</strong>
              ${item.notas ? `<br><em>Nota: ${item.notas}</em>` : ''}
            </div>
          `).join('')}
        </div>
        <div style="text-align: center; border-top: 2px dashed #000; padding-top: 15px;">
          <strong>TOTAL ITEMS: ${pedido.items.length}</strong>
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableMesas = mesas.filter(mesa => mesa.estado !== 'fuera_servicio');

  // Vista de selección de mesas
  if (!selectedMesa) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
          <div className="flex items-center justify-between p-4 border-b bg-orange-50">
            <div className="flex items-center gap-3">
              <ChefHat className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-bold text-orange-800">Seleccionar Mesa</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-6">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {availableMesas.map((mesa) => (
                <Card 
                  key={mesa.id}
                  className={`cursor-pointer transition-all hover:scale-105 border-2 ${
                    mesa.estado === 'ocupada' ? 'border-red-300 bg-red-50 hover:bg-red-100' :
                    mesa.estado === 'reservada' ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100' :
                    'border-green-300 bg-green-50 hover:bg-green-100'
                  }`}
                  onClick={() => handleSelectMesa(mesa)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                      mesa.estado === 'ocupada' ? 'bg-red-500' :
                      mesa.estado === 'reservada' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <h3 className="font-bold text-lg">{mesa.numero}</h3>
                    {mesa.nombre && <p className="text-xs text-muted-foreground">{mesa.nombre}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  // Vista de toma de pedido
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        {/* Header simplificado */}
        <div className="flex items-center justify-between p-3 border-b bg-orange-50">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedMesa(null)} disabled={loading}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-bold text-orange-800">Mesa {selectedMesa.numero}</h2>
            <Badge variant={selectedMesa.estado === 'ocupada' ? 'destructive' : 'secondary'}>
              {selectedMesa.estado}
            </Badge>
            {pedido && (
              <Badge variant="outline">
                Pedido #{pedido.numero_pedido}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Panel de productos - más compacto */}
          <div className="flex-1 flex flex-col border-r">
            <div className="p-3 border-b">
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-3 grid grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="h-16 p-2 flex flex-col justify-center items-center hover:bg-orange-50 hover:border-orange-300"
                    onClick={() => handleAddProduct(product)}
                    disabled={loading}
                  >
                    <span className="text-xs font-medium text-center leading-tight">
                      {product.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ${product.price.toFixed(0)}
                    </span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Panel de pedido - más compacto */}
          <div className="w-80 flex flex-col bg-gray-50">
            <div className="p-3 border-b">
              <h3 className="font-bold">Pedido Actual</h3>
            </div>
            
            <ScrollArea className="flex-1">
              {!pedido || pedido.items.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Agrega productos al pedido
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {pedido.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded border">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{item.cantidad}x {item.product.name}</span>
                      </div>
                      <span className="text-sm font-bold">${item.subtotal.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Botones de acción */}
            {pedido && pedido.items.length > 0 && (
              <div className="p-3 border-t space-y-2">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span>${pedido.total.toFixed(0)}</span>
                </div>
                
                {pedido.estado === 'activo' && (
                  <Button 
                    onClick={handleEnviarACocina} 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={loading}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? 'Enviando...' : 'Enviar a Cocina'}
                  </Button>
                )}
                
                {pedido.estado === 'enviado_cocina' && (
                  <Button 
                    onClick={handleCompletarPedido} 
                    className="w-full"
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? 'Completando...' : 'Completar Pedido'}
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