
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/Modal';
import Ticket from '@/components/Ticket';
import { Button } from '@/components/ui/button';
import { Printer, AlertCircle, Save, ReceiptText } from 'lucide-react';
import { getReceiptData, Receipt } from '@/services/ReceiptService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { renderBarcodes } from '@/utils/barcodeUtils';
import { getBusinessInfoForReceipt, BusinessInfo } from '@/utils/ticketUtils';
import { generateReceiptHTML, getReceiptStyles } from '@/services/ReceiptRenderer';

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId?: string;
  autoPrint?: boolean;
}

const PrintReceiptModal = ({ isOpen, onClose, saleId, autoPrint = false }: PrintReceiptModalProps) => {
  const [loading, setLoading] = useState(true);
  const { tenantId } = useAuth();
  const [ticketData, setTicketData] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    address: '',
    phone: '',
    receiptFooter: 'Gracias por su compra',
    currency: 'CLP',
  });

  // Load business info when component mounts
  useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        const info = await getBusinessInfoForReceipt(true);
        setBusinessInfo(info);
        console.log("Loaded business info for receipt:", info);
      } catch (error) {
        console.error("Error loading business info:", error);
      }
    };
    
    loadBusinessInfo();
  }, []);

  useEffect(() => {
    const loadTicketData = async () => {
      if (!isOpen || !saleId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching receipt data for sale:", saleId);
        const receiptData = await getReceiptData(saleId, tenantId);
        
        if (receiptData) {
          console.log("Received receipt data:", receiptData);
          
          if (receiptData.items && receiptData.items.length > 0) {
            receiptData.items = receiptData.items.map((item) => ({
              ...item,
              notes: item.notes || ''
            }));
          } else {
            console.warn("No items found in receipt data");
            setError("Esta venta no tiene productos registrados. Posiblemente la venta se realizó sin registrar productos específicos.");
            toast.warning("Esta venta no tiene productos registrados");
          }
          
          receiptData.businessInfo = businessInfo;
          setTicketData(receiptData);
        } else {
          console.error("No receipt data found for sale:", saleId);
          setError("No se pudo cargar la información del recibo");
          toast.error("No se pudo cargar la información del recibo");
        }
      } catch (error) {
        console.error("Error loading receipt data:", error);
        setError("Error al cargar los datos del recibo");
        toast.error("Error al cargar los datos del recibo");
      } finally {
        setLoading(false);
      }
    };

    loadTicketData();
  }, [isOpen, saleId, tenantId, businessInfo]);

  // Render barcodes after component mounts
  useEffect(() => {
    if (ticketData && !loading) {
      setTimeout(() => {
        renderBarcodes(`TE${ticketData.saleId}`, 'receipt-barcode');
      }, 200);
      
      if (autoPrint) {
        printTimeoutRef.current = setTimeout(() => {
          handlePrint();
        }, 500);
      }
    }
    
    return () => {
      if (printTimeoutRef.current) {
        clearTimeout(printTimeoutRef.current);
      }
    };
  }, [ticketData, loading, autoPrint]);

  const handlePrint = () => {
    if (!ticketData) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("No se pudo abrir la ventana de impresión. Verifique que no esté bloqueada por su navegador.");
      return;
    }
    
    // Generate the receipt HTML using the unified renderer
    const receiptHTML = generateReceiptHTML(ticketData, businessInfo, {
      showBarcode: true,
      printMode: true
    });
    
    // Get the print styles
    const receiptStyles = getReceiptStyles(true);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo de Compra</title>
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
        renderBarcodes(`TE${ticketData.saleId}`, 'receipt-barcode', printWindow.document);
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
  };

  const handlePrint2 = () => {
    handlePrint(); // Use the same unified print function
  };

  const handleSavePDF = () => {
    toast.info("Guardando PDF...", { 
      description: "Esta función estará disponible próximamente" 
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recibo de Compra"
      size="md"
    >
      {loading ? (
        <div className="text-center py-8">
          Cargando datos del recibo...
        </div>
      ) : error ? (
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <AlertCircle className="text-yellow-500 h-12 w-12" />
          <p className="text-gray-600">{error}</p>
        </div>
      ) : ticketData ? (
        <div className="bg-white p-1 print:p-0">
          <Ticket ticketData={ticketData} printMode={false} />
          <div className="mt-4 flex flex-wrap justify-end gap-2 print:hidden">
            <Button onClick={handlePrint} variant="outline" className="gap-1">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={handlePrint2} variant="outline" className="gap-1">
              <ReceiptText className="h-4 w-4" /> Recibo Alt.
            </Button>
            <Button onClick={handleSavePDF} variant="outline" className="gap-1">
              <Save className="h-4 w-4" /> Guardar PDF
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No se pudo cargar el recibo
        </div>
      )}
    </Modal>
  );
};

export default PrintReceiptModal;
