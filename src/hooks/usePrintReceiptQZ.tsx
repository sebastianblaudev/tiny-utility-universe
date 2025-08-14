import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getReceiptData } from '@/services/ReceiptService';
import { toast } from 'sonner';
import { getBusinessInfoForReceipt } from '@/utils/ticketUtils';
import { generateReceiptHTML } from '@/services/ReceiptRenderer';
import { getDefaultPaperWidth } from '@/utils/receiptConfig';
import qzTrayService from '@/services/QZTrayService';

export const usePrintReceiptQZ = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeQZ = async () => {
    if (isInitializing) return false;
    
    setIsInitializing(true);
    try {
      const paperWidth = getDefaultPaperWidth();
      const connected = await qzTrayService.initialize({ 
        paperWidth,
        autoConnect: true 
      });
      return connected;
    } finally {
      setIsInitializing(false);
    }
  };

  const printReceiptQZ = async (saleId: string, paperWidth?: '80mm' | '58mm') => {
    if (isProcessing) {
      toast.info("Ya se está procesando una impresión...");
      return false;
    }

    setIsProcessing(true);

    try {
      // Inicializar QZ Tray si no está conectado
      if (!qzTrayService.isQZConnected()) {
        const connected = await initializeQZ();
        if (!connected) {
          // Fallback a impresión del navegador si QZ Tray no está disponible
          toast.warning("QZ Tray no disponible, usando impresión del navegador...");
          return await printReceiptFallback(saleId, paperWidth);
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');
      const activePaperWidth = paperWidth || getDefaultPaperWidth();
      
      console.log(`Imprimiendo recibo ${activePaperWidth} con QZ Tray - Sale: ${saleId}, tenant: ${tenantId || 'unknown'}`);
      
      const receiptData = await getReceiptData(saleId, tenantId);
      
      if (!receiptData) {
        toast.error("No se pudo obtener los datos del recibo");
        return false;
      }
      
      // Obtener información del negocio
      const businessInfo = await getBusinessInfoForReceipt(true);
      
      // Configurar ancho de papel en QZ Tray
      qzTrayService.setPaperWidth(activePaperWidth);
      
      // Generar HTML del recibo optimizado para impresión térmica
      const receiptHTML = generateReceiptHTML(receiptData, businessInfo, {
        showBarcode: true,
        printMode: true,
        paperWidth: activePaperWidth
      });
      
      // Imprimir usando QZ Tray
      const success = await qzTrayService.printReceipt(receiptHTML);
      
      if (success) {
        toast.success(`Recibo ${activePaperWidth} impreso exitosamente`);
      }
      
      return success;
      
    } catch (error) {
      console.error("Error imprimiendo con QZ Tray:", error);
      toast.error("Error al imprimir el recibo");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceiptFallback = async (saleId: string, paperWidth?: '80mm' | '58mm') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');
      const activePaperWidth = paperWidth || getDefaultPaperWidth();
      
      const receiptData = await getReceiptData(saleId, tenantId);
      
      if (!receiptData) {
        toast.error("No se pudo obtener los datos del recibo");
        return false;
      }
      
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        toast.error("No se pudo abrir la ventana de impresión");
        return false;
      }
      
      const businessInfo = await getBusinessInfoForReceipt(true);
      const receiptHTML = generateReceiptHTML(receiptData, businessInfo, {
        showBarcode: true,
        printMode: true,
        paperWidth: activePaperWidth
      });
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir Recibo ${activePaperWidth}</title>
            <style>
              body { margin: 0; padding: 10px; font-family: monospace; }
              .receipt { width: ${activePaperWidth === '58mm' ? '58mm' : '80mm'}; }
            </style>
          </head>
          <body>
            ${receiptHTML}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      }, 500);
      
      return true;
    } catch (error) {
      console.error("Error en impresión fallback:", error);
      return false;
    }
  };

  const getPrinters = async () => {
    try {
      if (!qzTrayService.isQZConnected()) {
        await initializeQZ();
      }
      return await qzTrayService.getPrinters();
    } catch (error) {
      console.error("Error obteniendo impresoras:", error);
      return [];
    }
  };

  return {
    printReceiptQZ,
    getPrinters,
    isProcessing,
    isInitializing,
    isQZConnected: () => qzTrayService.isQZConnected(),
    initializeQZ
  };
};

export default usePrintReceiptQZ;