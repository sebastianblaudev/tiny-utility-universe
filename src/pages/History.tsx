
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { useRef, useState } from "react";
import { openDB } from "idb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { BackButton } from "@/components/BackButton";
import { OrderReceipt } from "@/components/OrderReceipt";
import { printElement } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function HiddenReceiptPrint({ order, onReady }: { order: any, onReady: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // Imprime después de renderizar
  // eslint-disable-next-line
  import("react").then(() => {
    setTimeout(() => {
      if (ref.current) {
        printElement(ref.current);
        onReady();
      }
    }, 100);
  });
  return (
    <div style={{ display: "none" }}>
      <div ref={ref}>
        <OrderReceipt order={order} receiptType="customer" />
      </div>
    </div>
  );
}

export default function History() {
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [printingOrder, setPrintingOrder] = useState<any | null>(null);
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', currentPage],
    queryFn: async () => {
      try {
        const start = (currentPage - 1) * ordersPerPage;
        const end = start + ordersPerPage - 1;
        
        // Updated to use version 4 instead of 3
        const db = await openDB('pizzaPos', 4);
        if (!db) {
          console.error("No se pudo abrir la base de datos");
          return [];
        }
        const tx = db.transaction('orders', 'readonly');
        const store = tx.objectStore('orders');
        
        // Get total count for pagination
        const allOrders = await store.getAll();
        
        // Sort orders by date (descending)
        const sortedOrders = allOrders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Get current page orders
        return sortedOrders.slice(start, start + ordersPerPage);
      } catch (error) {
        console.error("Error al obtener órdenes:", error);
        toast({
          title: "Error",
          description: "Error al cargar el historial de ventas",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto p-4 relative">
        <BackButton />
        <div className="max-w-7xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-white">Historial de Ventas</h1>
          
          <div className="bg-[#111111] rounded-lg shadow-lg border border-[#333333]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#333333] hover:bg-[#1A1A1A]">
                    <TableHead className="text-white">Fecha</TableHead>
                    <TableHead className="text-white">Cliente</TableHead>
                    <TableHead className="text-white">Método de Pago</TableHead>
                    <TableHead className="text-white">Total</TableHead>
                    <TableHead className="text-white">Estado</TableHead>
                    <TableHead className="text-right text-white">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-zinc-400">
                        Cargando órdenes...
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-zinc-400">
                        No hay órdenes para mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id} className="border-b border-[#333333] hover:bg-[#1A1A1A]">
                        <TableCell className="text-white">{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-white">{order.customerName || (order.customerId ? order.customerId : 'Sin nombre')}</TableCell>
                        <TableCell className="capitalize text-white">{order.paymentMethod || order.type}</TableCell>
                        <TableCell className="text-white">{formatCurrency(order.total)}</TableCell>
                        <TableCell className="capitalize text-white">{order.status}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333]"
                              onClick={() => setPrintingOrder(order)}
                            >
                              <Receipt className="h-4 w-4 mr-1" />
                              Reimprimir Recibo
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 border-t border-[#333333]">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] text-white"
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink className="bg-[#1A1A1A] border-[#333333] text-white">
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] text-white"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
          {/* Renderiza el recibo oculto para impresión */}
          {printingOrder && (
            <HiddenReceiptPrint order={printingOrder} onReady={() => setPrintingOrder(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
