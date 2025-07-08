import { supabase } from '@/integrations/supabase/client';

export interface BusinessInfo {
  businessName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  currency: string;
}

const BUSINESS_INFO_CACHE_KEY = 'businessInfoCache';

export const clearBusinessInfoCache = () => {
  localStorage.removeItem(BUSINESS_INFO_CACHE_KEY);
  console.log('Business info cache cleared');
};

export const getBusinessInfoForReceipt = async (forceRefresh = false): Promise<BusinessInfo> => {
  const defaultInfo: BusinessInfo = {
    businessName: '',
    address: '',
    phone: '',
    receiptFooter: 'Gracias por su compra',
    currency: 'CLP',
  };
  
  try {
    console.log('Obteniendo información actualizada del negocio...');
    
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(BUSINESS_INFO_CACHE_KEY);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        console.log('Usando información de negocio en caché:', parsedData);
        return parsedData;
      }
    }
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error obteniendo usuario:', error);
      return defaultInfo;
    }
    
    if (!data.user) {
      console.warn('No hay usuario autenticado');
      return defaultInfo;
    }
    
    const metadata = data.user.user_metadata || {};
    console.log('Metadata recuperada del usuario:', metadata);
    
    const businessInfo: BusinessInfo = {
      businessName: metadata.businessName || defaultInfo.businessName,
      address: metadata.address || defaultInfo.address,
      phone: metadata.phone || defaultInfo.phone,
      receiptFooter: metadata.receiptFooter || defaultInfo.receiptFooter,
      currency: metadata.currency || defaultInfo.currency,
    };
    
    localStorage.setItem(BUSINESS_INFO_CACHE_KEY, JSON.stringify(businessInfo));
    console.log('Información de negocio actualizada en caché:', businessInfo);
    
    return businessInfo;
  } catch (error) {
    console.error('Error obteniendo información del negocio:', error);
    return defaultInfo;
  }
};

export const formatCurrency = (amount: number): string => {
  try {
    const cachedData = localStorage.getItem(BUSINESS_INFO_CACHE_KEY);
    const currency = cachedData ? JSON.parse(cachedData).currency : 'CLP';
    
    if (currency === 'CLP') {
      return amount.toLocaleString('es-CL');
    }
    
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency || 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount.toLocaleString('es-CL')}`;
  }
};

export interface TicketNumberResult {
  ticketNumber: string;
  error: string | null;
}

export const generateTicketNumber = async (): Promise<TicketNumberResult> => {
  try {
    const today = new Date();
    const datePrefix = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    const localStorageKey = `ticket_number_${datePrefix}`;
    
    const localSequenceNumber = localStorage.getItem(localStorageKey);
    let sequenceNumber = localSequenceNumber ? parseInt(localSequenceNumber, 10) + 1 : 1;
    
    localStorage.setItem(localStorageKey, sequenceNumber.toString());
    
    const ticketNumber = `${datePrefix}-${sequenceNumber.toString().padStart(3, '0')}`;
    console.log(`Generated ticket number: ${ticketNumber}`);
    
    return {
      ticketNumber,
      error: null
    };
  } catch (error) {
    console.error('Error generating ticket number:', error);
    const timestamp = Date.now();
    const fallbackTicketNumber = `T-${timestamp}`;
    
    return {
      ticketNumber: fallbackTicketNumber,
      error: error instanceof Error ? error.message : 'Unknown error generating ticket number'
    };
  }
};

export const formatReceiptDate = (date: Date | string): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting receipt date:', error);
    return 'Fecha no disponible';
  }
};

export const addPrintStyles = (doc = document) => {
  let style = doc.getElementById('receipt-print-styles');
  
  if (!style) {
    style = doc.createElement('style');
    style.id = 'receipt-print-styles';
    
    style.innerHTML = `
      @media print {
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          width: 80mm;
          color: black !important;
          font-family: 'Courier New', monospace;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        * {
          color: black !important;
          border-color: black !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .ticket-container {
          width: 100% !important;
          max-width: none !important;
        }
        .print\\:hidden {
          display: none !important;
        }
        .border-t, .border-b {
          border-color: black !important;
          border-width: 1px !important;
        }
        svg {
          color: black !important;
          fill: black !important;
        }
      }
    `;
    
    doc.head.appendChild(style);
  }
  
  return style;
};

export const removePrintStyles = (doc = document) => {
  const style = doc.getElementById('receipt-print-styles');
  if (style) {
    style.remove();
  }
};
