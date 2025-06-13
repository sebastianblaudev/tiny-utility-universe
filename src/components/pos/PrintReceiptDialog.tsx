
import React, { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogHeader
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sale } from '@/types';
import { useBarber } from '@/contexts/BarberContext';
import ReceiptTemplate from './ReceiptTemplate';
import { Check, Printer } from 'lucide-react';

interface PrintReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
}

const PrintReceiptDialog: React.FC<PrintReceiptDialogProps> = ({ 
  open, 
  onClose, 
  sale 
}) => {
  const { toast } = useToast();
  const { barbers } = useBarber();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrinted, setIsPrinted] = useState(false);
  
  const shopName = localStorage.getItem('receipt-shop-name') || 'Su Barbería';
  const footerText = localStorage.getItem('receipt-footer-text') || '¡Gracias por su visita!';
  const logoUrl = localStorage.getItem('receipt-logo-url') || '';
  const paperSize = (localStorage.getItem('receipt-paper-size') as "58mm" | "80mm") || "80mm";

  // Resetear estado cuando cambia la venta
  useEffect(() => {
    console.log("PrintReceiptDialog - Sale changed:", {
      id: sale?.id,
      total: sale?.total,
      tip: sale?.tip?.amount,
      itemsCount: sale?.items?.length
    });
    if (sale) {
      setIsPrinted(false);
    }
  }, [sale]);

  const barberName = sale?.barberId 
    ? barbers.find(b => b.id === sale?.barberId)?.name 
    : undefined;

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Recibo-${sale?.id ? sale.id.substring(0, 8) : 'venta'}`,
    pageStyle: `
      @page { 
        size: ${paperSize === "58mm" ? "58mm auto" : "80mm auto"}; 
        margin: 0; 
      }
      
      @media print {
        html, body {
          height: initial !important;
          overflow: initial !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          color: black !important;
          font-family: 'Courier New', monospace !important;
        }
        
        * {
          page-break-inside: avoid;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .print-receipt {
          width: 100% !important;
          background: white !important;
          color: black !important;
          font-family: 'Courier New', monospace !important;
          font-size: 12px !important;
          line-height: 1.4 !important;
        }
        
        .print-receipt img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
        }
        
        .print-receipt svg {
          display: block !important;
        }
      }
    `,
    onAfterPrint: () => {
      console.log("Print completed successfully");
      setIsPrinting(false);
      setIsPrinted(true);
      toast({
        title: "Recibo impreso",
        description: "El recibo se ha enviado a la impresora exitosamente"
      });
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
      setIsPrinting(false);
      toast({
        title: "Error de impresión",
        description: "No se pudo imprimir el recibo",
        variant: "destructive"
      });
    }
  });

  const handlePrintClick = () => {
    console.log("Print button clicked - Sale data:", {
      id: sale?.id,
      total: sale?.total,
      tip: sale?.tip,
      items: sale?.items?.length
    });
    
    if (!sale) {
      console.error("No sale data available");
      toast({
        title: "Error de impresión",
        description: "No hay datos de venta disponibles",
        variant: "destructive"
      });
      return;
    }
    
    if (!receiptRef.current) {
      console.error("Receipt reference is null");
      toast({
        title: "Error de impresión",
        description: "El recibo no está listo para imprimir",
        variant: "destructive"
      });
      return;
    }
    
    setIsPrinting(true);
    console.log("Starting print process...");
    
    // Dar tiempo para que el componente se renderice completamente
    setTimeout(() => {
      handlePrint();
    }, 500);
  };

  console.log("PrintReceiptDialog - Open:", open, "Sale:", sale?.id, "Dialog rendering");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      console.log("Dialog onOpenChange:", isOpen);
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Imprimir Recibo</DialogTitle>
          <DialogDescription>
            {sale ? (
              `¿Desea imprimir el recibo de la venta ${(sale.id || Date.now().toString()).substring(0, 8)}?`
            ) : (
              "No hay datos de venta disponibles"
            )}
          </DialogDescription>
        </DialogHeader>

        {sale ? (
          <>
            <div className="flex justify-center py-6">
              {isPrinted ? (
                <div className="flex items-center text-green-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Recibo impreso exitosamente</span>
                </div>
              ) : (
                <Button 
                  onClick={handlePrintClick}
                  disabled={isPrinting}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Printer className="w-4 h-4" />
                  {isPrinting ? 'Imprimiendo...' : 'Imprimir Recibo'}
                </Button>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                {isPrinted ? 'Cerrar' : 'Cancelar'}
              </Button>
            </DialogFooter>
            
            {/* Recibo para la impresión - oculto */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <ReceiptTemplate
                ref={receiptRef}
                sale={sale}
                barberName={barberName}
                shopName={shopName}
                footerText={footerText}
                logoUrl={logoUrl || undefined}
                size={paperSize}
              />
            </div>
          </>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PrintReceiptDialog;
