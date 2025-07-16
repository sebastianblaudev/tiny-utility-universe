
import React from 'react';
import { Receipt } from '@/services/ReceiptService';
import { getBusinessInfoForReceipt } from '@/utils/ticketUtils';
import { generateReceiptHTML, getReceiptStyles } from '@/services/ReceiptRenderer';

interface TicketProps {
  ticketData: Receipt;
  showDetails?: boolean;
  printMode?: boolean;
}

const Ticket: React.FC<TicketProps> = ({ ticketData, showDetails = true, printMode = false }) => {
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
        console.error("Error loading business info for ticket:", error);
      }
    };
    
    loadBusinessInfo();
  }, [ticketData.businessInfo]);

  // Generate the receipt HTML using the unified renderer
  const receiptHTML = generateReceiptHTML(ticketData, businessInfo, {
    showBarcode: true,
    printMode
  });

  // Get the styles for the receipt
  const receiptStyles = getReceiptStyles(printMode);

  const ticketClasses = printMode 
    ? "w-full p-3 print:p-0 print:m-0" 
    : "w-full max-w-md mx-auto p-4 print:p-0 print:m-0 shadow-lg border border-gray-200 rounded-lg";

  return (
    <div className={ticketClasses}>
      <style dangerouslySetInnerHTML={{ __html: receiptStyles }} />
      <div dangerouslySetInnerHTML={{ __html: receiptHTML }} />
    </div>
  );
};

export default Ticket;
