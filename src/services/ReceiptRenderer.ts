import { Receipt } from './ReceiptService';
import { BusinessInfo } from '@/utils/ticketUtils';
import { formatPrice } from '@/utils/currencyFormat';

export const generateReceiptHTML = (
  receipt: Receipt,
  businessInfo: BusinessInfo,
  options: {
    showBarcode?: boolean;
    printMode?: boolean;
    paperWidth?: '58mm' | '80mm';
  } = {}
): string => {
  const { paperWidth = '80mm' } = options;
  const isNarrow = paperWidth === '58mm';
  const maxLineLength = isNarrow ? 32 : 48;

  const formatLine = (left: string, right: string, fillChar: string = ' '): string => {
    const totalLength = maxLineLength;
    const rightLength = right.length;
    const leftLength = Math.max(0, totalLength - rightLength);
    const truncatedLeft = left.substring(0, leftLength);
    const padding = totalLength - truncatedLeft.length - rightLength;
    return truncatedLeft + fillChar.repeat(Math.max(0, padding)) + right;
  };

  const centerText = (text: string): string => {
    const padding = Math.max(0, Math.floor((maxLineLength - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const separatorLine = '='.repeat(maxLineLength);
  const dashLine = '-'.repeat(maxLineLength);

  let html = `
    <div style="font-family: 'Courier New', monospace; font-size: ${isNarrow ? '11px' : '12px'}; line-height: 1.2; white-space: pre;">
      ${centerText(businessInfo.businessName || 'Mi Negocio')}
  `;

  if (businessInfo.address) {
    html += `\n      ${centerText(businessInfo.address)}`;
  }
  if (businessInfo.phone) {
    html += `\n      ${centerText(`Tel: ${businessInfo.phone}`)}`;
  }

  html += `\n      ${separatorLine}`;
  html += `\n      ${centerText('FACTURA DE VENTA')}`;
  html += `\n      ${separatorLine}`;
  html += `\n      Fecha: ${new Date(receipt.date).toLocaleString('es-CO')}`;
  html += `\n      Venta: ${receipt.saleId.substring(0, 8)}`;
  if (receipt.customerName) {
    html += `\n      Cliente: ${receipt.customerName}`;
  }
  if (receipt.customerPhone) {
    html += `\n      Tel: ${receipt.customerPhone}`;
  }
  html += `\n      Cajero: ${receipt.cashierName || 'N/A'}`;
  html += `\n      ${dashLine}`;

  // Items
  receipt.items.forEach(item => {
    const itemName = item.name.length > maxLineLength - 15 
      ? item.name.substring(0, maxLineLength - 18) + '...'
      : item.name;
    
    html += `\n      ${itemName}`;
    html += `\n      ${formatLine(
      `${item.quantity} x ${formatPrice(item.price)}`,
      formatPrice(item.subtotal)
    )}`;
    
    if (item.notes) {
      html += `\n      Nota: ${item.notes}`;
    }
  });

  html += `\n      ${dashLine}`;
  
  if (receipt.subtotal && receipt.subtotal !== receipt.total) {
    html += `\n      ${formatLine('SUBTOTAL:', formatPrice(receipt.subtotal))}`;
  }
  
  if (receipt.discount && receipt.discount > 0) {
    html += `\n      ${formatLine('DESCUENTO:', '-' + formatPrice(receipt.discount))}`;
  }
  
  if (receipt.taxTotal && receipt.taxTotal > 0) {
    html += `\n      ${formatLine('IVA:', formatPrice(receipt.taxTotal))}`;
  }

  html += `\n      ${formatLine('TOTAL:', formatPrice(receipt.total))}`;
  html += `\n      ${formatLine('PAGO:', receipt.paymentMethod.toUpperCase())}`;

  if (receipt.paymentMethod.toLowerCase() === 'efectivo' || receipt.paymentMethod.toLowerCase() === 'cash') {
    if (receipt.cashReceived && receipt.cashReceived > 0) {
      html += `\n      ${formatLine('RECIBIDO:', formatPrice(receipt.cashReceived))}`;
    }
    if (receipt.change && receipt.change > 0) {
      html += `\n      ${formatLine('CAMBIO:', formatPrice(receipt.change))}`;
    }
  }

  html += `\n      ${separatorLine}`;
  html += `\n      ${centerText('¡GRACIAS POR SU COMPRA!')}`;
  html += `\n      ${centerText('Vuelve pronto')}`;
  html += `\n      ${separatorLine}`;
  html += '\n    </div>';

  return html;
};

export const getReceiptStyles = (printMode: boolean = true, paperWidth: '58mm' | '80mm' = '80mm'): string => {
  const width = paperWidth === '58mm' ? '58mm' : '80mm';
  
  return `
    @media print {
      body {
        margin: 0;
        padding: 0;
        font-family: 'Courier New', monospace;
        font-size: ${paperWidth === '58mm' ? '11px' : '12px'};
        line-height: 1.2;
      }
      
      @page {
        size: ${width} auto;
        margin: 0;
      }
      
      .receipt-container {
        width: ${width};
        margin: 0;
        padding: 2mm;
        box-sizing: border-box;
      }
      
      .no-print {
        display: none !important;
      }
    }
    
    .receipt-container {
      font-family: 'Courier New', monospace;
      font-size: ${paperWidth === '58mm' ? '11px' : '12px'};
      line-height: 1.2;
      white-space: pre;
      max-width: ${width};
      margin: 0 auto;
      background: white;
      padding: 10px;
      border: 1px solid #ddd;
    }
  `;
};