import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, CreditCard, Clock, Utensils } from 'lucide-react';
import { useDelightMesas } from '@/hooks/useDelightMesas';

interface Mesa {
  id: string;
  numero: number;
  nombre: string;
  estado: 'disponible' | 'ocupada' | 'reservada';
  pedido_activo?: {
    id: string;
    items_count: number;
    total: number;
  };
}

interface PedidoMesaItem {
  id: string;
  product_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
  estado: 'pendiente' | 'enviado_cocina' | 'completado';
  enviado_cocina_at?: string;
  product_name?: string;
}

interface MesaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesa: Mesa | null;
  onCheckout: (pedidoId: string) => void;
}

export const MesaDetailsModal: React.FC<MesaDetailsModalProps> = ({
  isOpen,
  onClose,
  mesa,
  onCheckout
}) => {
  const [items, setItems] = useState<PedidoMesaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { getMesaItems } = useDelightMesas();

  useEffect(() => {
    if (mesa?.pedido_activo?.id && isOpen) {
      loadItems();
    }
  }, [mesa, isOpen]);

  const loadItems = async () => {
    if (!mesa?.pedido_activo?.id) return;
    
    setLoading(true);
    const mesaItems = await getMesaItems(mesa.pedido_activo.id);
    setItems(mesaItems);
    setLoading(false);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'enviado_cocina':
        return 'bg-blue-100 text-blue-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Clock className="h-3 w-3" />;
      case 'enviado_cocina':
        return <Utensils className="h-3 w-3" />;
      case 'completado':
        return <CreditCard className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const handlePrintBill = () => {
    // Implementar impresión de cuenta
    console.log('Printing bill for mesa:', mesa?.nombre);
  };

  const handleCheckout = () => {
    if (mesa?.pedido_activo?.id) {
      onCheckout(mesa.pedido_activo.id);
    }
  };

  if (!mesa) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            {mesa.nombre} - Detalles del Pedido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto">
          {/* Mesa info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <h3 className="font-medium">{mesa.nombre}</h3>
              <p className="text-sm text-muted-foreground">Mesa #{mesa.numero}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">Total: ${mesa.pedido_activo?.total.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground">{mesa.pedido_activo?.items_count || 0} items</p>
            </div>
          </div>

          {/* Items list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="font-medium">Items del Pedido</h4>
              
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay items en este pedido</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{item.product_name}</h5>
                          <Badge
                            variant="outline"
                            className={getEstadoColor(item.estado)}
                          >
                            {getEstadoIcon(item.estado)}
                            <span className="ml-1 capitalize">{item.estado.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Qty: {item.cantidad}</span>
                          <span>@${item.precio_unitario.toFixed(2)}</span>
                          {item.enviado_cocina_at && (
                            <span>Enviado: {new Date(item.enviado_cocina_at).toLocaleTimeString()}</span>
                          )}
                        </div>
                        
                        {item.notas && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Nota: {item.notas}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="gap-2">
          <Button
            onClick={handlePrintBill}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir Cuenta
          </Button>
          <Button
            onClick={handleCheckout}
            className="flex items-center gap-2"
            disabled={!mesa.pedido_activo}
          >
            <CreditCard className="h-4 w-4" />
            Procesar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};