
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/ticketUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronRight, Eye, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePrintReceipt from '@/hooks/usePrintReceipt';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Ticket from '@/components/Ticket';
import { getReceiptData } from '@/services/ReceiptService';
import { Receipt } from '@/services/ReceiptService';
import { toast } from 'sonner';

interface RecentPurchasesViewProps {
  customerId: string;
  limit?: number;
  standalone?: boolean;
  initialPurchases?: Receipt[];
  isLoading?: boolean;
}

const RecentPurchasesView: React.FC<RecentPurchasesViewProps> = ({
  customerId,
  limit = 5,
  standalone = false,
  initialPurchases,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Receipt[]>(initialPurchases || []);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const { openPrintReceipt } = usePrintReceipt();

  const viewAllPurchases = () => {
    navigate(`/customer-purchases?id=${customerId}`);
  };

  const viewSaleDetails = (saleId: string) => {
    navigate(`/sales/details?id=${saleId}`);
  };

  const printReceipt = (saleId: string) => {
    openPrintReceipt(saleId);
  };

  const viewReceipt = async (saleId: string) => {
    setLoadingReceipt(true);
    try {
      const receipt = await getReceiptData(saleId);
      if (receipt) {
        setSelectedReceipt(receipt);
        setShowReceiptDialog(true);
      } else {
        toast.error("No se pudieron cargar los detalles del recibo");
      }
    } catch (error) {
      console.error("Error loading receipt:", error);
      toast.error("Error al cargar el recibo");
    } finally {
      setLoadingReceipt(false);
    }
  };

  // Use the initialPurchases passed from parent component
  React.useEffect(() => {
    if (initialPurchases) {
      setPurchases(initialPurchases);
    }
  }, [initialPurchases]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p>Cargando historial de compras...</p>
        </CardContent>
      </Card>
    );
  }

  if (!purchases || purchases.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p>Este cliente no tiene compras registradas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className={standalone ? "" : "pb-2"}>
          <div className="flex justify-between items-center">
            <CardTitle>Compras Recientes</CardTitle>
            {!standalone && (
              <Button variant="link" size="sm" className="text-primary" onClick={viewAllPurchases}>
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.saleId}>
                  <TableCell>{format(new Date(purchase.date), 'dd/MM/yyyy HH:mm', { locale: es })}</TableCell>
                  <TableCell>{formatCurrency(purchase.total)}</TableCell>
                  <TableCell className="capitalize">{purchase.paymentMethod || 'Efectivo'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => viewReceipt(purchase.saleId)}
                        disabled={loadingReceipt}
                        title="Ver recibo"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => printReceipt(purchase.saleId)}
                        title="Imprimir recibo"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => viewSaleDetails(purchase.saleId)}
                        title="Ver detalles de venta"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recibo de Compra</DialogTitle>
          </DialogHeader>
          {selectedReceipt ? (
            <Ticket ticketData={selectedReceipt} />
          ) : (
            <div className="py-4 text-center">
              Cargando recibo...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecentPurchasesView;
