
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { FileSearchIcon, PrinterIcon } from "lucide-react";
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
import TableRowAnimation from "@/components/animations/TableRowAnimation";
import { useTenantValidation } from "@/hooks/useTenantValidation";
import { validateSaleAccess } from "@/utils/salesSecurityValidator";

interface Sale {
  id: string;
  date: string;
  total: number;
  payment_method: string;
  status: string;
  tenant_id?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
}

const HistorialVentas = () => {
  const [currency, setCurrency] = useState("CLP");
  const { tenantId, user } = useAuth();
  
  // Add tenant validation
  const { isValid } = useTenantValidation(tenantId);

  useEffect(() => {
    const loadUserCurrency = async () => {
      if (user?.user_metadata?.currency) {
        setCurrency(user.user_metadata.currency);
      }
    };

    loadUserCurrency();
  }, [user]);

  const { 
    data: sales = [], 
    isLoading, 
    error
  } = useQuery({
    queryKey: ['sales', tenantId],
    queryFn: async () => {
      if (!tenantId || !isValid) {
        throw new Error("No tenant ID found or invalid tenant");
      }
      
      console.log(`Fetching sales for tenant: ${tenantId}`);
      
      const { data: salesData, error } = await supabase
        .from("sales")
        .select("*, customers(name)")
        .eq("tenant_id", tenantId)
        .order("date", { ascending: false });
      
      if (error) {
        console.error("Error loading sales:", error);
        throw error;
      }
      
      // Validate all returned sales belong to current tenant
      const validSales = salesData?.filter(sale => sale.tenant_id === tenantId) || [];
      
      return validSales.map(sale => ({
        ...sale,
        customer_name: sale.customers?.name || null
      }));
    },
    enabled: !!tenantId && isValid,
    meta: {
      onError: (error: Error) => {
        console.error("Error loading sales:", error);
        toast.error("Error al cargar el historial de ventas");
      }
    }
  });

  const handleViewSaleDetails = async (saleId: string) => {
    // Validate sale access before showing details
    const hasAccess = await validateSaleAccess(saleId);
    if (!hasAccess) {
      toast.error("Error de seguridad: No tiene acceso a esta venta");
      return;
    }
    
    toast.info("Viendo detalles", {
      description: `Accediendo a los detalles de la venta ${saleId.substring(0, 8)}...`
    });
  };

  const handlePrintReceipt = async (saleId: string) => {
    // Validate sale access before printing
    const hasAccess = await validateSaleAccess(saleId);
    if (!hasAccess) {
      toast.error("Error de seguridad: No puede imprimir esta venta");
      return;
    }
    
    toast.info("Imprimiendo boleta", {
      description: `Preparando impresión para la venta ${saleId.substring(0, 8)}...`
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP 'a las' p", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "card": return "Tarjeta";
      case "transfer": return "Transferencia";
      case "mixed": return "Pago Mixto";
      default: return method;
    }
  };

  // Don't render if tenant validation fails
  if (!isValid) {
    return (
      <Layout>
        <div className="container px-4 py-6 mx-auto max-w-7xl">
          <div className="text-center py-8 text-red-500">
            Error de seguridad: No se puede acceder al historial sin validación de tenant.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-6 mx-auto max-w-7xl">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">Historial de Ventas</CardTitle>
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
              </div>
            ) : (
              <Table>
                <TableCaption>Listado de todas las ventas realizadas</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>ID Venta</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale, index) => (
                    <TableRowAnimation key={sale.id} index={index}>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {sale.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>{formatCurrency(sale.total, currency)}</TableCell>
                      <TableCell>
                        {getPaymentMethodName(sale.payment_method)}
                      </TableCell>
                      <TableCell>
                        {sale.customer_name || 'Cliente no registrado'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSaleDetails(sale.id)}
                            title="Ver detalles"
                          >
                            <FileSearchIcon size={16} className="mr-1" />
                            Detalles
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintReceipt(sale.id)}
                            title="Imprimir Boleta"
                          >
                            <PrinterIcon size={16} className="mr-1" />
                            Imprimir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRowAnimation>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HistorialVentas;
