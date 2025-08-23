import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { ComandaTicket } from "@/components/ComandaTicket";

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: any;
  isComanda?: boolean;
}

export function PrintReceiptModal({ isOpen, onClose, receiptData, isComanda = false }: PrintReceiptModalProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = document.getElementById('comanda-content')?.innerHTML || '';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda</title>
          <style>
            body { 
              font-family: monospace; 
              margin: 0; 
              padding: 20px; 
              font-size: 14px;
            }
            .comanda { 
              max-width: 300px; 
              margin: 0 auto; 
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="comanda">
            ${content}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    setTimeout(() => printWindow.close(), 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isComanda ? 'Imprimir Comanda' : 'Imprimir Recibo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div id="comanda-content">
            {isComanda ? (
              <ComandaTicket receiptData={receiptData} />
            ) : (
              <div>Recibo content here</div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}