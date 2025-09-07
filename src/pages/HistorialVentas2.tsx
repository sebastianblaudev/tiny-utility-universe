
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { FilePenIcon, RefreshCwIcon, Trash2Icon, ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { updateMissingSaleTenantIds } from "@/utils/salesUtils";
import UnlockDialog from "@/components/UnlockDialog";
import usePrintReceipt from "@/hooks/usePrintReceipt";
import { useNavigate } from "react-router-dom";
import { loadRobustSalesHistory } from "@/utils/robustOfflineUtils";

interface Sale {
  id: string;
  date: string;
  total: number;
  payment_method: string;
  status: string;
  tenant_id?: string | null;
  customer_id?: string | null;
}

// Create an interface for the result of deleteSale
interface DeleteSaleResult {
  success: boolean;
  message?: string;
}

// Update the deleteSale function in integrations/supabase/client.ts
const deleteSale = async (saleId: string): Promise<DeleteSaleResult> => {
  try {
    // First delete sale items
    const { error: saleItemsError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', saleId);
      
    if (saleItemsError) {
      console.error('Error deleting sale items:', saleItemsError);
      return { success: false, message: saleItemsError.message };
    }
    
    // Then delete the sale
    const { error: saleError } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId);
      
    if (saleError) {
      console.error('Error deleting sale:', saleError);
      return { success: false, message: saleError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteSale:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: errorMessage };
  }
};

const HistorialVentas2 = () => {
  const [currency, setCurrency] = useState("CLP");
  const { tenantId, user, userRole } = useAuth();
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { openPrintReceipt, printReceiptDirectly, PrintReceiptModal } = usePrintReceipt();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserCurrency = async () => {
      if (user?.user_metadata?.currency) {
        setCurrency(user.user_metadata.currency);
      }
    };

    loadUserCurrency();
  }, [user]);

  const handleUpdateSales = async () => {
    if (isAutoUpdating || !tenantId) return;
    
    setIsAutoUpdating(true);
    await updateMissingSaleTenantIds(tenantId, () => {
      refetch();
    });
    setIsAutoUpdating(false);
  };

  useEffect(() => {
    if (tenantId) {
      handleUpdateSales();
    }
  }, [tenantId]);

  useEffect(() => {
    const checkAllSales = async () => {
      try {
        const { data, error } = await supabase
          .from("sales")
          .select("*");
        
        if (error) {
          console.error("Error checking all sales:", error);
          return;
        }
        
        console.log("All sales in database:", data);
        console.log("Current tenant ID from context:", tenantId);
      } catch (err) {
        console.error("Error in debug check:", err);
      }
    };
    
    checkAllSales();
  }, [tenantId]);

  const { 
    data: sales = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['sales', tenantId],
    queryFn: async () => {
      // Use robust sales history loading that works offline
      return await loadRobustSalesHistory();
    },
    enabled: !!(tenantId || localStorage.getItem('current_tenant_id')),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleGenerateReceipt = (saleId: string) => {
    // Removed SII integration - no toast needed
  };

  const handlePrintReceipt = async (saleId: string) => {
    try {
      const success = await printReceiptDirectly(saleId);
      
      if (!success) {
        openPrintReceipt(saleId, true);
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      openPrintReceipt(saleId);
    }
  };

  const confirmDeleteSale = (sale: Sale) => {
    if (userRole !== 'admin') {
      toast.error("No autorizado", {
        description: "Solo los administradores pueden eliminar ventas."
      });
      return;
    }

    setSaleToDelete(sale);
    setIsUnlockDialogOpen(true);
  };

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const result = await deleteSale(saleToDelete.id);
      
      if (result.success) {
        toast.success("Venta eliminada", {
          description: "La venta ha sido eliminada correctamente."
        });
        refetch();
      } else {
        toast.error("Error al eliminar", {
          description: result.message || "No se pudo eliminar la venta."
        });
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Error al eliminar", {
        description: "Ocurrió un error al intentar eliminar la venta."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP 'a las' p", { locale: es });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString;
    }
  };

  return (
    <Layout>
      <div className="container px-4 py-6 mx-auto max-w-7xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-2xl font-bold">Historial de Ventas</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleUpdateSales()}
              disabled={isAutoUpdating}
              title="Actualizar ventas sin ID de negocio"
            >
              <RefreshCwIcon size={16} className="mr-2" />
              Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <p className="text-sm text-muted-foreground">Cargando historial de ventas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error al cargar las ventas. Por favor, intenta nuevamente.
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay ventas registradas para este negocio. 
                <p className="mt-2">
                  Si has realizado ventas y no aparecen, haz clic en 'Reparar Ventas' para asignarlas a este negocio.
                </p>
              </div>
            ) : (
              <Table>
                <TableCaption>Listado de todas las ventas realizadas</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell>{formatCurrency(sale.total, currency)}</TableCell>
                      <TableCell>
                        {sale.payment_method === "cash"
                          ? "Efectivo"
                          : sale.payment_method === "card"
                          ? "Tarjeta"
                          : sale.payment_method === "transfer"
                          ? "Transferencia"
                          : sale.payment_method === "mixed"
                          ? "Pago Mixto"
                          : sale.payment_method}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sale.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                          }`}
                        >
                          {sale.status === "completed" ? "Completada" : sale.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">                     
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateReceipt(sale.id)}
                            title="Imprimir Boleta"
                          >
                            <FilePenIcon size={16} className="mr-1" />
                            Boleta
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintReceipt(sale.id)}
                            title="Imprimir recibo de venta"
                          >
                            <ReceiptIcon size={16} className="mr-1" />
                            Recibo
                          </Button>
                          {userRole === 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => confirmDeleteSale(sale)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              title="Eliminar venta"
                            >
                              <Trash2Icon size={16} className="mr-1" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <UnlockDialog
        isOpen={isUnlockDialogOpen}
        onClose={() => setIsUnlockDialogOpen(false)}
        onUnlock={handleDeleteSale}
        itemName={`Eliminar Venta ${saleToDelete ? formatDate(saleToDelete.date) : ""}`}
      />
      
      <PrintReceiptModal />
    </Layout>
  );
};

export default HistorialVentas2;
