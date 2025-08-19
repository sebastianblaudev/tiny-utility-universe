import React from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Receipt, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface SimplePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintReceipt: () => void;
  onPrintCommand: () => void;
  onNewSale: () => void;
}

const SimplePrintModal: React.FC<SimplePrintModalProps> = ({ 
  isOpen, 
  onClose, 
  onPrintReceipt,
  onPrintCommand,
  onNewSale 
}) => {
  const handlePrintReceipt = () => {
    try {
      onPrintReceipt();
      onClose();
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast.error("Error al imprimir el recibo");
    }
  };

  const handlePrintCommand = () => {
    try {
      onPrintCommand();
      onClose();
    } catch (error) {
      console.error("Error printing command:", error);
      toast.error("Error al imprimir la comanda");
    }
  };

  const handleNewSale = () => {
    onNewSale();
    onClose();
  };

  return (
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
  );
};

export default SimplePrintModal;