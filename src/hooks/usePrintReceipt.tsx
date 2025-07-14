
import { useState } from 'react';
import PrintReceiptModal from '@/components/PrintReceiptModal';
import { supabase } from '@/integrations/supabase/client';
import { getReceiptData } from '@/services/ReceiptService';
import { renderBarcodes } from '@/utils/barcodeUtils';
import { toast } from 'sonner';
import { getBusinessInfoForReceipt } from '@/utils/ticketUtils';
import { generateReceiptHTML, getReceiptStyles } from '@/services/ReceiptRenderer';

export const usePrintReceipt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState<string | undefined>(undefined);
  const [shouldAutoPrint, setShouldAutoPrint] = useState(false);

  const openPrintReceipt = async (saleId: string, autoPrint = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');

    console.log(`Opening receipt for sale: ${saleId}, tenant: ${tenantId || 'unknown'}, autoPrint: ${autoPrint}`);
    
    setCurrentSaleId(saleId);
    setShouldAutoPrint(autoPrint);
    setIsOpen(true);
    
    localStorage.setItem('lastPrintedReceiptId', saleId);
    if (tenantId) {
      localStorage.setItem('current_tenant_id', tenantId);
    }
  };

  const printReceiptDirectly = async (saleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');
      
      console.log(`Printing receipt directly for sale: ${saleId}, tenant: ${tenantId || 'unknown'}`);
      
      const receiptData = await getReceiptData(saleId, tenantId);
      
      if (!receiptData) {
        toast.error("No se pudo obtener los datos del recibo");
        return false;
      }
      
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        toast.error("No se pudo abrir la ventana de impresión. Verifique que no esté bloqueada por su navegador.");
        return false;
      }
      
      // Get business info
      const businessInfo = await getBusinessInfoForReceipt(true);
      
      // Generate the receipt HTML using the unified renderer
      const receiptHTML = generateReceiptHTML(receiptData, businessInfo, {
        showBarcode: true,
        printMode: true
      });
      
      // Get the print styles
      const receiptStyles = getReceiptStyles(true);
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir Recibo</title>
            <style>
              ${receiptStyles}
            </style>
          </head>
          <body>
            ${receiptHTML}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      setTimeout(() => {
        try {
          renderBarcodes(`TE${receiptData.saleId}`, 'receipt-barcode', printWindow.document);
          
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => printWindow.close(), 1000);
          }, 800);
        } catch (error) {
          console.error("Error rendering barcode:", error);
          printWindow.print();
          setTimeout(() => printWindow.close(), 1000);
        }
      }, 500);
      
      return true;
    } catch (error) {
      console.error("Error printing receipt directly:", error);
      toast.error("Error al imprimir el recibo");
      return false;
    }
  };

  const closePrintReceipt = () => {
    setIsOpen(false);
    setShouldAutoPrint(false);
  };

  const PrintReceiptModalComponent = () => (
    <PrintReceiptModal 
      isOpen={isOpen} 
      onClose={closePrintReceipt} 
      saleId={currentSaleId}
      autoPrint={shouldAutoPrint}
    />
  );

  return {
    openPrintReceipt,
    closePrintReceipt,
    printReceiptDirectly,
    PrintReceiptModal: PrintReceiptModalComponent
  };
};

export default usePrintReceipt;
