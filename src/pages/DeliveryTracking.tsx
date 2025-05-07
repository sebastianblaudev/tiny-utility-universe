import { useState, useEffect } from 'react';
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Truck, Check, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { initDB } from "@/lib/db";
import { formatDate } from "@/lib/utils";

// Tipo para los estados de entrega
type DeliveryStatus = "pending" | "dispatched" | "delivered";

export default function DeliveryTracking() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Cargar todos los pedidos de delivery
  useEffect(() => {
    loadDeliveryOrders();
  }, []);

  const loadDeliveryOrders = async () => {
    try {
      const db = await initDB();
      const tx = db.transaction(['orders', 'customers'], 'readonly');
      const orderStore = tx.objectStore('orders');
      const customerStore = tx.objectStore('customers');
      
      const orders = await orderStore.getAll();
      const deliveryOrders = [];

      for (const order of orders) {
        if (order.orderType === 'delivery') {
          const customer = await customerStore.get(order.customerId);
          if (customer) {
            deliveryOrders.push({
              ...order,
              customer: {
                name: customer.name,
                phone: customer.phone,
                address: customer.address
              }
            });
          }
        }
      }

      setDeliveries(deliveryOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando pedidos de delivery:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos de delivery",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // Actualizar el estado de un pedido
  const updateDeliveryStatus = async (orderId: string, newStatus: DeliveryStatus) => {
    try {
      const db = await initDB();
      const tx = db.transaction('orders', 'readwrite');
      const orderStore = tx.objectStore('orders');
      
      const order = await orderStore.get(orderId);
      if (!order) {
        throw new Error(`Pedido no encontrado: ${orderId}`);
      }
      
      order.deliveryStatus = newStatus;
      if (newStatus === 'delivered') {
        order.status = 'completed';
        order.completedAt = new Date().toISOString();
      }
      
      await orderStore.put(order);
      await tx.done;
      
      toast({
        title: "Estado actualizado",
        description: `Pedido marcado como ${getStatusText(newStatus)}`
      });
      
      // Actualizar la UI
      loadDeliveryOrders();
    } catch (error) {
      console.error('Error actualizando estado del pedido:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive"
      });
    }
  };

  // Obtener texto descriptivo del estado
  const getStatusText = (status: DeliveryStatus): string => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'dispatched': return 'En despacho';
      case 'delivered': return 'Entregado';
      default: return 'Desconocido';
    }
  };

  // Obtener color para el badge según estado
  const getStatusColor = (status: DeliveryStatus): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'dispatched': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Enviar información por WhatsApp
  const sendToWhatsApp = (delivery: any) => {
    const { customer, items } = delivery;
    const mapsUrl = customer.address?.coordinates ? 
      `https://www.google.com/maps?q=${customer.address.coordinates.lat},${customer.address.coordinates.lng}` :
      '';

    const itemsList = items.map((item: any) => 
      `- ${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ''}`
    ).join('%0A');

    const message = `🍕 *Pedido Delivery*%0A%0A` +
      `*Cliente:* ${customer.name}%0A` +
      `*Teléfono:* ${customer.phone}%0A` +
      `*Dirección:* ${customer.address?.street}%0A` +
      (customer.address?.reference ? `*Referencia:* ${customer.address.reference}%0A%0A` : '%0A') +
      `*Pedido:*%0A${itemsList}%0A%0A` +
      (mapsUrl ? `📍 *Ubicación:* ${mapsUrl}` : '');

    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="w-full min-h-screen bg-black">
      <div className="container mx-auto max-w-6xl p-4 space-y-6 bg-black text-white min-h-screen">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold whitespace-nowrap">Seguimiento de Delivery</h1>
          </div>
          <Button 
            onClick={loadDeliveryOrders} 
            variant="outline"
            className="border-zinc-700 bg-[#1A1A1A] text-white hover:bg-[#252525] hover:text-white">
            Actualizar
          </Button>
        </div>

        <Card className="border-zinc-700 bg-[#1A1A1A] shadow-md">
          <CardHeader className="border-b border-zinc-700">
            <CardTitle className="flex items-center gap-2 text-white">
              <Truck className="h-6 w-6" />
              Pedidos de Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-zinc-400">Cargando pedidos...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700 hover:bg-[#252525]">
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                    <TableHead className="text-zinc-400">Cliente</TableHead>
                    <TableHead className="text-zinc-400">Dirección</TableHead>
                    <TableHead className="text-zinc-400">Items</TableHead>
                    <TableHead className="text-zinc-400">Estado</TableHead>
                    <TableHead className="text-zinc-400">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.length > 0 ? (
                    deliveries.map((delivery) => (
                      <TableRow key={delivery.id} className="border-zinc-700 hover:bg-[#252525]">
                        <TableCell className="font-medium text-white">{formatDate(delivery.createdAt)}</TableCell>
                        <TableCell>
                          <div className="text-white">{delivery.customer.name}</div>
                          <div className="text-sm text-zinc-400">{delivery.customer.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-white">{delivery.customer.address?.street}</div>
                          {delivery.customer.address?.reference && (
                            <div className="text-sm text-zinc-400">
                              Ref: {delivery.customer.address.reference}
                            </div>
                          )}
                          {delivery.customer.address?.coordinates && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 h-auto text-xs flex items-center gap-1 text-blue-400" 
                              onClick={() => window.open(`https://www.google.com/maps?q=${delivery.customer.address.coordinates.lat},${delivery.customer.address.coordinates.lng}`, '_blank')}
                            >
                              <MapPin className="h-3 w-3" /> Ver mapa
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] text-white">
                          {delivery.items.map((item: any, index: number) => (
                            <div key={index} className="text-sm truncate">
                              {item.quantity}x {item.name}
                              {item.size && ` (${item.size})`}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(delivery.deliveryStatus || 'pending')}`}>
                            {getStatusText(delivery.deliveryStatus || 'pending')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {(!delivery.deliveryStatus || delivery.deliveryStatus === 'pending') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-blue-500 text-white hover:bg-blue-600"
                                onClick={() => updateDeliveryStatus(delivery.id, 'dispatched')}
                              >
                                <Truck className="h-3 w-3 mr-1" />
                                En despacho
                              </Button>
                            )}
                            
                            {delivery.deliveryStatus === 'dispatched' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-500 text-white hover:bg-green-600"
                                onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Entregado
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-500 border-green-500 hover:bg-green-500/10"
                              onClick={() => sendToWhatsApp(delivery)}
                              title="Enviar por WhatsApp"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                              </svg>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-zinc-400">
                        No hay pedidos de delivery pendientes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
