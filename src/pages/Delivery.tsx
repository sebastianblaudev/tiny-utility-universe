import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Send, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { initDB } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface DeliveryForm {
  name: string;
  address: string;
  phone: string;
  reference: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
}

export default function Delivery() {
  const [formData, setFormData] = useState<DeliveryForm>({
    name: '',
    address: '',
    phone: '',
    reference: '',
    coordinates: null
  });
  const [loading, setLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    try {
      const db = await initDB();
      const tx = db.transaction(['orders', 'customers'], 'readonly');
      const orderStore = tx.objectStore('orders');
      const customerStore = tx.objectStore('customers');
      
      const orders = await orderStore.getAll();
      const pendingDeliveries = [];

      for (const order of orders) {
        if (order.orderType === 'delivery' && order.status === 'pending') {
          const customer = await customerStore.get(order.customerId);
          if (customer) {
            pendingDeliveries.push({
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

      setPendingOrders(pendingDeliveries);
    } catch (error) {
      console.error('Error loading pending orders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos pendientes",
        variant: "destructive"
      });
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
        setLoading(false);
        toast({
          title: "Ubicación obtenida",
          description: "Tu ubicación se ha guardado correctamente"
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        setLoading(false);
        toast({
          title: "Error",
          description: "No se pudo obtener tu ubicación",
          variant: "destructive"
        });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.coordinates) {
      toast({
        title: "Error",
        description: "Por favor obtén tu ubicación antes de enviar",
        variant: "destructive"
      });
      return;
    }

    try {
      const db = await initDB();
      
      const tx = db.transaction('customers', 'readwrite');
      const customerStore = tx.objectStore('customers');
      const customerIndex = customerStore.index('by-phone');
      let customer = await customerIndex.get(formData.phone);
      
      if (!customer) {
        customer = {
          id: crypto.randomUUID(),
          name: formData.name,
          phone: formData.phone,
          orders: [],
          address: {
            street: formData.address,
            reference: formData.reference,
            coordinates: formData.coordinates
          }
        };
        await customerStore.add(customer);
      } else {
        customer.address = {
          street: formData.address,
          reference: formData.reference,
          coordinates: formData.coordinates
        };
        await customerStore.put(customer);
      }

      const orderTx = db.transaction('orders', 'readwrite');
      const orderStore = orderTx.objectStore('orders');
      
      const order = {
        id: crypto.randomUUID(),
        customerId: customer.id,
        createdAt: new Date(),
        status: 'pending' as const, // Fix type to match the Order interface
        orderType: 'delivery' as const, // Fix type to match the Order interface
        items: [], // Se llenará cuando se implemente el carrito
        total: 0, // Se calculará cuando se implemente el carrito
        subtotal: 0,
        paymentMethod: 'efectivo' as const // Add required paymentMethod property
      };
      
      await orderStore.add(order);

      customer.orders.push(order.id);
      await customerStore.put(customer);

      const mapsUrl = `https://www.google.com/maps?q=${formData.coordinates.lat},${formData.coordinates.lng}`;
      const message = `🍕 *Nuevo Pedido Delivery*%0A%0A` +
        `*Cliente:* ${formData.name}%0A` +
        `*Teléfono:* ${formData.phone}%0A` +
        `*Dirección:* ${formData.address}%0A` +
        `*Referencia:* ${formData.reference}%0A%0A` +
        `📍 *Ubicación:* ${mapsUrl}`;

      const deliveryPhone = "1234567890";
      
      window.open(`https://wa.me/${deliveryPhone}?text=${message}`, '_blank');

      toast({
        title: "¡Pedido enviado!",
        description: "Tu pedido ha sido registrado y enviado al delivery"
      });

      setFormData({
        name: '',
        address: '',
        phone: '',
        reference: '',
        coordinates: null
      });

    } catch (error) {
      console.error("Error saving order:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar tu pedido",
        variant: "destructive"
      });
    }
  };

  const handleSendToDelivery = (order: any) => {
    const { customer, items } = order;
    const mapsUrl = customer.address?.coordinates ? 
      `https://www.google.com/maps?q=${customer.address.coordinates.lat},${customer.address.coordinates.lng}` :
      '';

    const itemsList = items.map((item: any) => 
      `- ${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ''}`
    ).join('%0A');

    const message = `🍕 *Nuevo Pedido Delivery*%0A%0A` +
      `*Cliente:* ${customer.name}%0A` +
      `*Teléfono:* ${customer.phone}%0A` +
      `*Dirección:* ${customer.address?.street}%0A` +
      `*Referencia:* ${customer.address?.reference}%0A%0A` +
      `*Pedido:*%0A${itemsList}%0A%0A` +
      (mapsUrl ? `📍 *Ubicación:* ${mapsUrl}` : '');

    const deliveryPhone = "1234567890";
    
    window.open(`https://wa.me/${deliveryPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Nuevo Pedido Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Nombre completo"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Input
                placeholder="Teléfono"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Input
                placeholder="Dirección"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Input
                placeholder="Referencia (ej: casa azul, cerca al parque)"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button 
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleGetLocation}
                disabled={loading}
              >
                <Navigation className="h-4 w-4 mr-2" />
                {loading ? "Obteniendo ubicación..." : "Obtener Ubicación"}
              </Button>
            </div>

            {formData.coordinates && (
              <div className="text-sm text-muted-foreground">
                Ubicación guardada: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!formData.coordinates}>
              <Send className="h-4 w-4 mr-2" />
              Enviar Pedido
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Pedidos Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    <div>{order.customer.name}</div>
                    <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div>{order.customer.address?.street}</div>
                    {order.customer.address?.reference && (
                      <div className="text-sm text-muted-foreground">
                        Ref: {order.customer.address.reference}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.items.map((item: any, index: number) => (
                      <div key={index}>
                        {item.quantity}x {item.name}
                        {item.size && ` (${item.size})`}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSendToDelivery(order)}
                      className="flex items-center gap-2"
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
                      Enviar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pendingOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay pedidos pendientes
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
