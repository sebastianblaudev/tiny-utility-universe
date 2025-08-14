import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getReceiptData } from '@/services/ReceiptService';
import { renderBarcodes } from '@/utils/barcodeUtils';
import { toast } from 'sonner';
import { getBusinessInfoForReceipt } from '@/utils/ticketUtils';
import { generateReceiptHTML, getReceiptStyles } from '@/services/ReceiptRenderer';
import { getDefaultPaperWidth } from '@/utils/receiptConfig';

export const usePrintReceipt58mm = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const printReceipt58mm = async (saleId: string) => {
    if (isProcessing) {
      toast.info("Ya se está procesando una impresión...");
      return false;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');
      
      console.log(`Printing 58mm receipt for sale: ${saleId}, tenant: ${tenantId || 'unknown'}`);
      
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
      
      // Get the configured paper width or force 58mm for this specific hook
      const configuredPaperWidth = getDefaultPaperWidth();
      const actualPaperWidth = '58mm'; // Always use 58mm for this hook regardless of configuration
      
      // Generate the 58mm receipt HTML
      const receiptHTML = generateReceiptHTML(receiptData, businessInfo, {
        showBarcode: true,
        printMode: true,
        paperWidth: actualPaperWidth
      });
      
      // Get the 58mm print styles
      const receiptStyles = getReceiptStyles(true, actualPaperWidth);
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir Recibo 58mm</title>
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
            toast.success("Recibo 58mm enviado a impresión");
          }, 800);
        } catch (error) {
          console.error("Error rendering barcode:", error);
          printWindow.print();
          setTimeout(() => printWindow.close(), 1000);
          toast.success("Recibo 58mm enviado a impresión");
        }
      }, 500);
      
      return true;
    } catch (error) {
      console.error("Error printing 58mm receipt:", error);
      toast.error("Error al imprimir el recibo 58mm");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    printReceipt58mm,
    isProcessing
  };
};

export default usePrintReceipt58mm;