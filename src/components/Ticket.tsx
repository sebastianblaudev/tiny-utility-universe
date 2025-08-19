
import React from 'react';
import { Receipt } from '@/services/ReceiptService';
import { getBusinessInfoForReceipt } from '@/utils/ticketUtils';
import { generateReceiptHTML, getReceiptStyles } from '@/services/ReceiptRenderer';
import { getDefaultPaperWidth } from '@/utils/receiptConfig';
import { getBusinessLogo } from '@/utils/logoStorageUtils';
import { useAuth } from '@/contexts/AuthContext';

interface TicketProps {
  ticketData: Receipt;
  showDetails?: boolean;
  printMode?: boolean;
  paperWidth?: '58mm' | '80mm';
}

const Ticket: React.FC<TicketProps> = ({ ticketData, showDetails = true, printMode = false, paperWidth }) => {
  const { tenantId } = useAuth();
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

    const loadBusinessLogo = async () => {
      if (!tenantId) return;
      
      try {
        const logo = await getBusinessLogo(tenantId);
        if (logo) {
          // Find the logo container and inject the logo
          setTimeout(() => {
            const logoContainer = document.getElementById('business-logo-container');
            if (logoContainer) {
              logoContainer.innerHTML = `<img src="${logo.data}" alt="Logo del negocio" class="business-logo" />`;
            }
          }, 100);
        } else {
          // Show fallback icon if no logo
          setTimeout(() => {
            const logoContainer = document.getElementById('business-logo-container');
            if (logoContainer) {
              logoContainer.innerHTML = `<div class="business-logo-fallback">🏪</div>`;
            }
          }, 100);
        }
      } catch (error) {
        console.error("Error loading business logo:", error);
        // Show fallback icon on error
        setTimeout(() => {
          const logoContainer = document.getElementById('business-logo-container');
          if (logoContainer) {
            logoContainer.innerHTML = `<div class="business-logo-fallback">🏪</div>`;
          }
        }, 100);
      }
    };
    
    loadBusinessInfo();
    loadBusinessLogo();
  }, [ticketData.businessInfo, tenantId]);

  // Get the paper width (from prop, configuration, or default)
  const activePaperWidth = paperWidth || getDefaultPaperWidth();

  // Generate the receipt HTML using the unified renderer
  const receiptHTML = generateReceiptHTML(ticketData, businessInfo, {
    showBarcode: true,
    printMode,
    paperWidth: activePaperWidth
  });

  // Get the styles for the receipt
  const receiptStyles = getReceiptStyles(printMode, activePaperWidth);

  const ticketClasses = printMode 
    ? "w-full p-3 print:p-0 print:m-0" 
    : `w-full ${activePaperWidth === '58mm' ? 'max-w-[58mm]' : 'max-w-md'} mx-auto p-4 print:p-0 print:m-0 shadow-lg border border-gray-200 rounded-lg`;

  return (
    <div className={ticketClasses}>
      <style dangerouslySetInnerHTML={{ __html: receiptStyles }} />
      <div dangerouslySetInnerHTML={{ __html: receiptHTML }} />
    </div>
  );
};

export default Ticket;
