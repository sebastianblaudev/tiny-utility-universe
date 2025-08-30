import { BusinessInfo as TicketBusinessInfo } from '@/utils/ticketUtils';
import { BusinessInfo as ServiceBusinessInfo } from '@/services/ReceiptService';

/**
 * Helper function to convert between different BusinessInfo types
 */
export const convertBusinessInfo = (ticketInfo: TicketBusinessInfo): ServiceBusinessInfo => {
  return {
    name: ticketInfo.businessName || '',
    address: ticketInfo.address,
    phone: ticketInfo.phone,
    currency: ticketInfo.currency,
    receiptFooter: ticketInfo.receiptFooter,
    logo: ticketInfo.logo
  };
};

/**
 * Helper function to convert from service BusinessInfo to ticket BusinessInfo
 */
export const convertToTicketInfo = (serviceInfo: ServiceBusinessInfo): TicketBusinessInfo => {
  return {
    businessName: serviceInfo.name || '',
    address: serviceInfo.address || '',
    phone: serviceInfo.phone || '',
    currency: serviceInfo.currency || 'COP',
    receiptFooter: serviceInfo.receiptFooter || 'Gracias por su compra',
    logo: serviceInfo.logo
  };
};