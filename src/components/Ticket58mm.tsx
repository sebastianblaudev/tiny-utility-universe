import React from 'react';
import { Receipt } from '@/services/ReceiptService';
import { getBusinessInfoForReceipt } from '@/utils/ticketUtils';
import { generateReceiptHTML, getReceiptStyles } from '@/services/ReceiptRenderer';
import { getDefaultPaperWidth } from '@/utils/receiptConfig';

interface Ticket58mmProps {
  ticketData: Receipt;
  showDetails?: boolean;
  printMode?: boolean;
}

const Ticket58mm: React.FC<Ticket58mmProps> = ({ ticketData, showDetails = true, printMode = false }) => {
  const [businessInfo, setBusinessInfo] = React.useState({
    businessName: '',
    address: '',
    phone: '',
    receiptFooter: 'Gracias por su compra',
    currency: 'CLP',
  });

  React.useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        if (ticketData.businessInfo) {
          setBusinessInfo(ticketData.businessInfo);
          console.log("Using passed business info:", ticketData.businessInfo);
          return;
        }
        
        const info = await getBusinessInfoForReceipt();
        setBusinessInfo(info);
        console.log("Loaded business info from service:", info);
      } catch (error) {
        console.error("Error loading business info for 58mm ticket:", error);
      }
    };
    
    loadBusinessInfo();
  }, [ticketData.businessInfo]);

  // Get the configured paper width or default to 58mm for this component
  const configuredPaperWidth = getDefaultPaperWidth();
  const actualPaperWidth = configuredPaperWidth === '58mm' ? '58mm' : '58mm'; // Force 58mm for this component
  
  // Generate the 58mm receipt HTML
  const receiptHTML = generateReceiptHTML(ticketData, businessInfo, {
    showBarcode: true,
    printMode,
    paperWidth: actualPaperWidth
  });

  // Get the 58mm styles
  const receiptStyles = getReceiptStyles(printMode, actualPaperWidth);

  const ticketClasses = printMode 
    ? "w-full p-2 print:p-0 print:m-0" 
    : "w-full max-w-[58mm] mx-auto p-2 print:p-0 print:m-0 shadow-lg border border-gray-200 rounded-lg bg-white";

  return (
    <div className={ticketClasses}>
      <style dangerouslySetInnerHTML={{ __html: receiptStyles }} />
      <div dangerouslySetInnerHTML={{ __html: receiptHTML }} />
    </div>
  );
};

export default Ticket58mm;