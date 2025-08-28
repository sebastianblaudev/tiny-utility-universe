
import React from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Receipt, ShoppingCart } from 'lucide-react';
import usePrintReceipt from '@/hooks/usePrintReceipt';
import { toast } from 'sonner';

interface CompleteSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId?: string;
  onNewSale: () => void;
}

const CompleteSaleModal = ({ 
  isOpen, 
  onClose, 
  saleId,
  onNewSale 
}: CompleteSaleModalProps) => {
  const { openPrintReceipt, printReceiptDirectly, PrintReceiptModal } = usePrintReceipt();

  const handlePrintReceipt = async () => {
    if (saleId) {
      try {
        // Try to print directly first
        const success = await printReceiptDirectly(saleId);
        
        if (!success) {
          // Fall back to modal if direct printing fails
          openPrintReceipt(saleId, true);
        }
        
        // Modal stays open after printing
      } catch (error) {
        console.error("Error printing receipt:", error);
        toast.error("Error al imprimir el recibo");
        // Fall back to modal if direct printing fails with an error
        openPrintReceipt(saleId, true);
      }
    }
  };

  const handlePrintCommand = () => {
    // This could be implemented to print a kitchen command or similar
    // Modal stays open after printing command
    toast.success("Comanda enviada a impresión");
  };

  const handleNewSale = () => {
    onNewSale();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Imprimir</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-6">
              La venta ha sido completada exitosamente
            </p>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handlePrintReceipt} 
                className="flex items-center justify-center gap-2 py-6 bg-green-600 hover:bg-green-700"
              >
                <Printer className="h-5 w-5" />
                <span className="text-base">Imprimir recibo</span>
              </Button>
              
              <Button 
                onClick={handlePrintCommand} 
                variant="outline" 
                className="flex items-center justify-center gap-2 py-6 border-2"
              >
                <Receipt className="h-5 w-5" />
                <span className="text-base">Imprimir comanda</span>
              </Button>
              
              <Button 
                onClick={handleNewSale} 
                variant="outline" 
                className="flex items-center justify-center gap-2 py-6 border-2"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-base">Nueva venta</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <PrintReceiptModal />
    </>
  );
};

export default CompleteSaleModal;
