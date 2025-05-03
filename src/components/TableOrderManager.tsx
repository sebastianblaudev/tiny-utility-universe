
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Save, Check, Clock, FileEdit, Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { saveTableOrder, getTableOrder, getAllSavedOrders, completeTableOrder } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

interface TableOrderManagerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  selectedCustomer: any;
  activeTable: string | null;
  onOrderSaved: () => void;
  onLoadExistingOrder: (order: any) => void;
}

export function TableOrderManager({
  isOpen,
  onClose,
  cart,
  selectedCustomer,
  activeTable,
  onOrderSaved,
  onLoadExistingOrder
}: TableOrderManagerProps) {
  const [savedOrders, setSavedOrders] = useState<any[]>([]);
  const [showSavedOrders, setShowSavedOrders] = useState(false);
  const [existingOrder, setExistingOrder] = useState<any>(null);
  const navigate = useNavigate();

  // Load the existing order for this table and all saved orders when the dialog opens
  useEffect(() => {
    if (isOpen) {
      loadExistingTable();
      loadAllSavedOrders();
    }
  }, [isOpen, activeTable]);

  const loadExistingTable = async () => {
    if (!activeTable) return;
    
    try {
      const tableNumberAsInt = parseInt(activeTable, 10);
      const orderData = await getTableOrder(tableNumberAsInt);
      setExistingOrder(orderData);
      
      if (orderData) {
        toast({
          title: "Orden existente",
          description: `Esta mesa ya tiene una orden guardada (${orderData.items.length} productos)`
        });
      }
    } catch (error) {
      console.error("Error checking table status:", error);
    }
  };

  const loadAllSavedOrders = async () => {
    try {
      const orders = await getAllSavedOrders();
      console.log("All saved orders:", orders);
      setSavedOrders(orders);
    } catch (error) {
      console.error("Error loading saved orders:", error);
    }
  };

  // Print kitchen order function
  const printKitchenOrder = (order: any) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "No se pudo abrir la ventana de impresión. Por favor, verifica que no esté bloqueado el popup.",
        variant: "destructive"
      });
      return;
    }

    // Current date and time
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    // Define print styles and content
    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda de Cocina - Mesa ${order.tableNumber}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 10px;
              width: 80mm; /* Typical receipt width */
              max-width: 80mm;
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
              font-weight: bold;
            }
            .table-info {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin: 10px 0;
              padding: 5px;
              border-top: 1px dashed black;
              border-bottom: 1px dashed black;
            }
            .item {
              margin-bottom: 5px;
            }
            .footer {
              margin-top: 10px;
              text-align: center;
              border-top: 1px dashed black;
              padding-top: 5px;
              font-size: 10px;
            }
            .quantity {
              font-weight: bold;
              font-size: 14px;
            }
            @media print {
              body {
                width: 100%;
                max-width: 80mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>COMANDA DE COCINA</div>
            <div>${formattedDate}</div>
          </div>
          <div class="table-info">MESA ${order.tableNumber}</div>
    `);

    // Add items
    printWindow.document.write('<div class="items">');
    order.items.forEach((item: any) => {
      printWindow.document.write(`
        <div class="item">
          <span class="quantity">${item.quantity}x</span> ${item.name} ${item.size ? `(${item.size})` : ''}
          ${item.extras && item.extras.length > 0 
            ? `<div style="margin-left: 20px; font-style: italic;">${item.extras.map((extra: any) => `+ ${extra.name}`).join(', ')}</div>` 
            : ''}
        </div>
      `);
    });
    printWindow.document.write('</div>');

    // Customer info if available
    if (order.customerName) {
      printWindow.document.write(`
        <div class="footer">
          <div>Cliente: ${order.customerName}</div>
        </div>
      `);
    }

    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // Wait a moment for content to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }, 500);
  };

  const handleSaveOrder = async () => {
    if (!activeTable || cart.length === 0) {
      toast({
        title: "Error",
        description: "Necesitas seleccionar una mesa y tener productos en el carrito",
        variant: "destructive"
      });
      return;
    }
    
    try {
      let savedOrder;
      // If there's an existing order for this table, update it
      if (existingOrder) {
        const updatedOrder = {
          ...existingOrder,
          items: cart.map(item => ({
            id: item.id,
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            size: item.size,
            extras: item.extras
          })),
          total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          customerId: selectedCustomer ? selectedCustomer.id : existingOrder.customerId,
          customerName: selectedCustomer ? selectedCustomer.name : existingOrder.customerName
        };
        
        const tableNumberAsInt = parseInt(activeTable, 10);
        await saveTableOrder(tableNumberAsInt, updatedOrder);
        savedOrder = updatedOrder;
        
        toast({
          title: "Orden actualizada",
          description: `La orden de mesa ${activeTable} ha sido actualizada`,
          variant: "default"
        });
      } else {
        // Create a new order if none exists
        const newOrder = {
          id: uuidv4(),
          customerId: selectedCustomer ? selectedCustomer.id : null,
          customerName: selectedCustomer ? selectedCustomer.name : null,
          items: cart.map(item => ({
            id: item.id,
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            size: item.size,
            extras: item.extras
          })),
          total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          orderType: 'mesa' as const,
          tableNumber: parseInt(activeTable, 10),
          status: 'saved' as const,
          createdAt: new Date().toISOString(),
          paymentMethod: 'efectivo' as const
        };
        
        const tableNumberAsInt = parseInt(activeTable, 10);
        await saveTableOrder(tableNumberAsInt, newOrder);
        savedOrder = newOrder;
        
        toast({
          title: "Orden guardada",
          description: `La orden se ha guardado para la mesa ${activeTable}`,
          variant: "default"
        });
      }
      
      // Print kitchen order after saving
      printKitchenOrder({
        ...savedOrder,
        tableNumber: activeTable
      });
      
      onOrderSaved();
      onClose();
      
    } catch (error) {
      console.error("Error saving order:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la orden",
        variant: "destructive"
      });
    }
  };

  const handleLoadOrder = async (order: any) => {
    try {
      console.log("Loading order:", order);
      onLoadExistingOrder(order);
      toast({
        title: "Orden cargada",
        description: `La orden de la mesa ${order.tableNumber} se ha cargado`,
        variant: "default"
      });
      setShowSavedOrders(false);
      onClose();
    } catch (error) {
      console.error("Error loading order:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la orden",
        variant: "destructive"
      });
    }
  };

  const handleCompleteOrder = async (tableNumber: string) => {
    try {
      const tableNumberAsInt = parseInt(tableNumber, 10);
      await completeTableOrder(tableNumberAsInt);
      toast({
        title: "Orden finalizada",
        description: "La orden se ha marcado como completada",
        variant: "default"
      });
      loadAllSavedOrders();
    } catch (error) {
      console.error("Error completing order:", error);
      toast({
        title: "Error",
        description: "No se pudo finalizar la orden",
        variant: "destructive"
      });
    }
  };

  // If we're showing the list of all saved orders
  if (showSavedOrders) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-md mx-auto bg-[#111111] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Órdenes guardadas</DialogTitle>
          </DialogHeader>

          {savedOrders.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {savedOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="bg-[#1A1A1A] p-3 rounded-lg border border-zinc-800 hover:border-orange-500/30"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-orange-600">Mesa {order.tableNumber}</Badge>
                          <p className="text-sm">{order.items.length} items</p>
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                          onClick={() => handleLoadOrder(order)}
                        >
                          <FileEdit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          onClick={() => {
                            handleLoadOrder(order);
                            navigate("/", { state: { completeOrder: true } });
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Cobrar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                          onClick={() => printKitchenOrder(order)}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2 border-t border-zinc-800 pt-2">
                      <ul className="text-sm text-zinc-300">
                        {order.items.slice(0, 3).map((item: any, idx: number) => (
                          <li key={idx} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                        {order.items.length > 3 && (
                          <li className="text-zinc-500">+ {order.items.length - 3} más...</li>
                        )}
                      </ul>
                      <div className="mt-2 flex justify-between font-medium">
                        <span>Total:</span>
                        <span>${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-zinc-500">
              <Clock className="h-12 w-12 mb-2 opacity-50" />
              <p>No hay órdenes guardadas</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavedOrders(false)}>
              Volver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Main dialog for saving/viewing current table order
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto bg-[#111111] border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {activeTable ? `Guardar orden en Mesa ${activeTable}` : 'Seleccione una mesa'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {activeTable ? (
            <>
              <p className="text-sm text-zinc-400 mb-4">
                La orden se guardará para esta mesa y podrá ser finalizada más tarde.
              </p>
              
              {existingOrder && (
                <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/40 mb-4">
                  <p className="font-medium text-orange-400">Esta mesa ya tiene una orden guardada</p>
                  <p className="text-sm text-zinc-300">
                    {existingOrder.items.length} productos por un total de ${existingOrder.total.toFixed(2)}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/50"
                    onClick={() => handleLoadOrder(existingOrder)}
                  >
                    Retomar esta orden
                  </Button>
                </div>
              )}
              
              <div className="bg-[#1A1A1A] p-3 rounded-lg border border-zinc-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p>Total de productos: {cart.length}</p>
                    <p className="text-sm text-zinc-400">
                      {selectedCustomer ? `Cliente: ${selectedCustomer.name}` : 'Sin cliente asignado'}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold">
                      ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[100px] text-zinc-500">
              <p>Seleccione una mesa para continuar</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2">
          <div className="flex space-x-2 w-full justify-between">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-[#1A1A1A] border-zinc-700 hover:bg-[#252525]"
            >
              Cancelar
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowSavedOrders(true)}
              className="bg-[#1A1A1A] border-zinc-700 hover:bg-[#252525] hover:border-orange-500/30"
            >
              <Clock className="h-4 w-4 mr-2" />
              Ver órdenes guardadas
            </Button>
          </div>
          
          <Button 
            onClick={handleSaveOrder}
            disabled={!activeTable || cart.length === 0}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 border-0 w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar orden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
