
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt, Search } from "lucide-react";
import { useRef, useState } from "react";
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
import { DeleteOrderDialog } from "@/components/DeleteOrderDialog";
import { initDB } from "@/lib/db";
import { Input } from "@/components/ui/input";
import ExportHistoryData from "./ExportHistoryData";

function HiddenReceiptPrint({ order, onReady }: { order: any, onReady: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
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
  const [searchQuery, setSearchQuery] = useState("");
  const ordersPerPage = 10;
  const [printingOrder, setPrintingOrder] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: allOrders = [], error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        const db = await initDB();
        if (!db) {
          console.error("No se pudo abrir la base de datos");
          return [];
        }
        const tx = db.transaction('orders', 'readonly');
        const store = tx.objectStore('orders');
        
        const allOrders = await store.getAll();
        
        const sortedOrders = allOrders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        return sortedOrders;
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
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
  
  // Filter orders based on search query
  const filteredOrders = allOrders.filter((order) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const orderNumber = order.id.slice(-4);
    
    return (
      order.id.toLowerCase().includes(searchLower) ||
      orderNumber.includes(searchLower) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
      (order.customerId && order.customerId.toLowerCase().includes(searchLower)) ||
      (order.paymentMethod && order.paymentMethod.toLowerCase().includes(searchLower))
    );
  });
  
  // Pagination logic for filtered orders
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const displayedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

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

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const db = await initDB();
      await db.delete('orders', orderId);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Éxito",
        description: "Venta eliminada correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar la orden:", error);
      toast({
        title: "Error",
        description: "Error al eliminar la venta",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center p-6 bg-[#1A1A1A] rounded-lg border border-[#333333] max-w-md">
          <h2 className="text-xl font-bold mb-4 text-red-400">Error</h2>
          <p>No se pudo cargar el historial de ventas. Por favor, intente nuevamente.</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto p-4 relative">
        <BackButton />
        <div className="max-w-7xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-white">Historial de Ventas</h1>
          
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por ID, número de orden, cliente o método de pago..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1A1A1A] border-[#333333] text-white"
              />
            </div>
            
            <ExportHistoryData />
          </div>
          
          <div className="bg-[#111111] rounded-lg shadow-lg border border-[#333333]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#333333] hover:bg-[#1A1A1A]">
                    <TableHead className="text-white"># Orden</TableHead>
                    <TableHead className="text-white w-28 max-w-[7rem] truncate">ID</TableHead>
                    <TableHead className="text-white">Fecha</TableHead>
                    <TableHead className="text-white">Cliente</TableHead>
                    <TableHead className="text-white">Método de Pago</TableHead>
                    <TableHead className="text-white">Total</TableHead>
                    <TableHead className="text-white">Estado</TableHead>
                    <TableHead className="text-right text-white">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-zinc-400">
                        No hay órdenes para mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedOrders.map((order) => (
                      <TableRow key={order.id} className="border-b border-[#333333] hover:bg-[#1A1A1A]">
                        <TableCell className="text-white font-bold">#{order.id.slice(-4)}</TableCell>
                        <TableCell className="text-white font-mono text-xs opacity-70 w-28 max-w-[7rem] truncate">{order.id}</TableCell>
                        <TableCell className="text-white">{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-white">{order.customerName || (order.customerId ? order.customerId : 'Sin nombre')}</TableCell>
                        <TableCell className="capitalize text-white">{order.paymentMethod}</TableCell>
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
                            <DeleteOrderDialog 
                              orderId={order.id} 
                              onDelete={() => handleDeleteOrder(order.id)} 
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 0 && (
              <div className="p-4 border-t border-[#333333]">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] text-white"
                        aria-disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink className="bg-[#1A1A1A] border-[#333333] text-white">
                        {currentPage} / {Math.max(1, totalPages)}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] text-white"
                        aria-disabled={currentPage >= totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
          {printingOrder && (
            <HiddenReceiptPrint order={printingOrder} onReady={() => setPrintingOrder(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
