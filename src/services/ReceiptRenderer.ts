import { Receipt, ReceiptItem } from '@/services/ReceiptService';
import { formatCurrency, formatReceiptDate, BusinessInfo } from '@/utils/ticketUtils';

export interface ReceiptRendererOptions {
  showBarcode?: boolean;
  printMode?: boolean;
  paperWidth?: '58mm' | '80mm';
}

export const generateReceiptHTML = (
  ticketData: Receipt,
  businessInfo: BusinessInfo,
  options: ReceiptRendererOptions = {}
): string => {
  const { showBarcode = true, printMode = false, paperWidth = '80mm' } = options;
  const is58mm = paperWidth === '58mm';
  
  // Format date using our utility
  const formattedDate = ticketData.date ? formatReceiptDate(new Date(ticketData.date)) : 'Fecha no disponible';
  
  // Group same products together
  const groupedItems = ticketData.items.reduce<{
    [key: string]: {
      name: string;
      price: number;
      quantity: number;
      subtotal: number;
      notes?: string;
    }
  }>((acc, item) => {
    const key = `${item.product_id}-${item.price}`;
    
    if (!acc[key]) {
      acc[key] = {
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        notes: item.notes
      };
    } else {
      acc[key].quantity += item.quantity;
      acc[key].subtotal += item.price * item.quantity;
      if (item.notes && acc[key].notes !== item.notes) {
        acc[key].notes = acc[key].notes ? `${acc[key].notes}, ${item.notes}` : item.notes;
      }
    }
    
    return acc;
  }, {});

  const customerInfo = ticketData.customerName ? `
    <div class="customer-section">
      <div class="section-divider"></div>
      <div class="customer-info">
        <div class="customer-details">
          <p class="customer-name"><strong>${ticketData.customerName}</strong></p>
          ${ticketData.customerAddress ? `<p class="customer-detail">${ticketData.customerAddress}</p>` : ''}
          ${ticketData.customerPhone ? `<p class="customer-detail">${ticketData.customerPhone}</p>` : ''}
        </div>
      </div>
      <div class="section-divider"></div>
    </div>
  ` : '';

  let itemsHTML = '';
  if (Object.values(groupedItems).length > 0) {
    // Header row
    itemsHTML += `
      <div class="items-header">
        <span class="header-item">ITEM</span>
        <span class="header-qty">CANT</span>
        <span class="header-price">P.UNIT</span>
        <span class="header-total">TOTAL</span>
      </div>
    `;
    
    Object.values(groupedItems).forEach((item) => {
      itemsHTML += `
        <div class="item-row">
          <span class="item-name">
            ${item.name}
            ${item.notes ? `<div class="item-note">${item.notes}</div>` : ''}
          </span>
          <span class="item-qty">${item.quantity}</span>
          <span class="item-price">${formatCurrency(item.price)}</span>
          <span class="item-total">${formatCurrency(item.subtotal)}</span>
        </div>
      `;
    });
  } else {
    itemsHTML = `
      <div class="no-items">
        <span>No hay productos disponibles</span>
      </div>
    `;
  }

  const paymentMethodText = {
    'cash': 'Efectivo',
    'card': 'Tarjeta',
    'transfer': 'Transferencia',
    'mixed': 'Pago Mixto'
  };

  const barcodeSection = showBarcode ? `
    <div class="barcode-section">
      <div class="section-divider"></div>
      <div id="receipt-barcode" class="barcode-container"></div>
      <p class="barcode-text">TE${ticketData.saleId}</p>
    </div>
  ` : '';

  // Add logo to the business header if available
  const logoSection = businessInfo.logo ? `
    <div class="business-logo-container">
      <img src="${businessInfo.logo}" alt="Logo" class="business-logo" />
    </div>
  ` : '';

  return `
    <div class="receipt-container">
      <!-- Business Header -->
      <div class="business-header">
        ${logoSection}
        ${businessInfo.businessName ? `<div class="business-name">${businessInfo.businessName}</div>` : ''}
        ${businessInfo.address ? `<div class="business-detail">${businessInfo.address}</div>` : ''}
        ${businessInfo.phone ? `<div class="business-detail">${businessInfo.phone}</div>` : ''}
      </div>
      
      <!-- Receipt Info -->
      <div class="receipt-info">
        <div class="receipt-badge">
          <div class="receipt-type">RECIBO DE VENTA</div>
        </div>
        <div class="receipt-meta">
          <div class="receipt-date">Fecha: ${formattedDate}</div>
          <div class="receipt-id">Ticket: #${ticketData.saleId.substring(0, 8).toUpperCase()}</div>
        </div>
      </div>
      
      ${customerInfo}
      
      <!-- Items Section -->
      <div class="items-section">
        ${itemsHTML}
      </div>
      
      <!-- Totals Section -->
      <div class="totals-section">
        <div class="section-divider"></div>
        <div class="total-breakdown">
          <div class="total-line main-total">
            <span class="total-label">TOTAL: ${formatCurrency(ticketData.total)}</span>
          </div>
          <div class="payment-method">
            <span>Forma de Pago: ${paymentMethodText[ticketData.paymentMethod] || ticketData.paymentMethod}</span>
          </div>
        </div>
        <div class="section-divider"></div>
      </div>
      
      <!-- Footer -->
      <div class="receipt-footer">
        <div class="footer-message">
          <p>${businessInfo.receiptFooter}</p>
        </div>
        ${barcodeSection}
      </div>
    </div>
  `;
};

export const getReceiptStyles = (printMode: boolean = false, paperWidth: '58mm' | '80mm' = '80mm'): string => {
  const baseStyles = `
    .receipt-container {
      font-family: 'Courier New', 'Liberation Mono', 'Nimbus Mono L', Monaco, 'Lucida Console', monospace;
      font-size: 11px;
      line-height: 1.2;
      color: #000000;
      font-weight: 400;
      max-width: ${paperWidth};
      margin: 0 auto;
      padding: 8px;
      background: #ffffff;
      border: 1px solid #000000;
    }

    .business-header {
      text-align: center;
      margin-bottom: 8px;
      padding: 4px 0;
      background: #ffffff;
      color: #000000;
      border-bottom: 1px solid #000000;
    }
    
    .business-logo-container {
      margin-bottom: 4px;
      text-align: center;
    }
    
    .business-logo {
      max-width: 60px;
      max-height: 40px;
      object-fit: contain;
    }
    
    .business-name {
      font-size: 13px;
      font-weight: 700;
      margin: 2px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .business-detail {
      font-size: 9px;
      margin: 1px 0;
      color: #000000;
    }
    
    .receipt-info {
      text-align: center;
      margin-bottom: 8px;
      padding: 4px 0;
      background: #ffffff;
      color: #000000;
      border-bottom: 1px dashed #000000;
    }
    
    .receipt-badge {
      margin-bottom: 4px;
    }
    
    .receipt-type {
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    
    .receipt-meta {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
    }
    
    .receipt-date, .receipt-id {
      margin: 0;
    }
    
    .customer-section {
      margin-bottom: 8px;
    }
    
    .customer-info {
      padding: 4px 0;
      background: #ffffff;
      color: #000000;
      border-bottom: 1px dashed #000000;
    }
    
    .customer-name {
      margin: 0 0 2px 0;
      font-size: 10px;
      font-weight: 700;
    }
    
    .customer-detail {
      margin: 1px 0;
      font-size: 9px;
    }
    
    .section-divider {
      height: 1px;
      background: #000000;
      margin: 4px 0;
    }
    
    .items-section {
      margin-bottom: 8px;
    }
    
    .items-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 4px;
      padding: 4px 0;
      border-bottom: 2px solid #000000;
      font-weight: 700;
      font-size: 9px;
      text-align: center;
    }
    
    .header-item {
      text-align: left;
    }
    
    .header-qty, .header-price, .header-total {
      text-align: right;
    }
    
    .item-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 4px;
      padding: 2px 0;
      border-bottom: 1px dotted #000000;
      font-size: 9px;
    }
    
    .item-name {
      font-weight: 400;
      color: #000000;
      text-align: left;
    }
    
    .item-note {
      font-size: 7px;
      font-style: italic;
      color: #666666;
      margin-top: 1px;
      line-height: 1.1;
    }
    
    .item-qty {
      color: #000000;
      font-weight: 400;
      text-align: right;
    }
    
    .item-price {
      color: #000000;
      text-align: right;
    }
    
    .item-total {
      font-weight: 700;
      color: #000000;
      text-align: right;
    }
    
    .no-items {
      text-align: center;
      padding: 8px;
      font-style: italic;
    }
    
    .totals-section {
      margin-bottom: 8px;
    }
    
    .total-breakdown {
      padding: 4px 0;
      background: #ffffff;
      color: #000000;
    }
    
    .total-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .main-total .total-label {
      font-weight: 700;
      font-size: 12px;
      text-align: center;
      width: 100%;
    }
    
    .payment-method {
      font-size: 9px;
      color: #000000;
      text-align: center;
    }
    
    .receipt-footer {
      margin-top: 8px;
    }
    
    .footer-message {
      padding: 4px 0;
      background: #ffffff;
      color: #000000;
      margin-bottom: 4px;
      text-align: center;
    }
    
    .footer-message p {
      margin: 2px 0;
      font-size: 9px;
      color: #000000;
    }
    
    .barcode-section {
      text-align: center;
      margin-top: 8px;
    }
    
    .barcode-container {
      margin: 4px 0;
    }
    
    .barcode-text {
      font-size: 8px;
      font-family: 'Courier New', monospace;
      font-weight: 400;
      color: #000000;
      letter-spacing: 1px;
    }
  `;

  const printStyles = printMode ? `
    @media print {
      @page {
        size: ${paperWidth} auto;
        margin: 0;
      }
      
      .receipt-container {
        width: 100% !important;
        max-width: none !important;
        padding: 4px !important;
        margin: 0 !important;
        background: white !important;
        border: none !important;
        box-shadow: none !important;
        font-family: 'Courier New', 'Liberation Mono', Monaco, 'Lucida Console', monospace !important;
        font-size: ${paperWidth === '58mm' ? '9px' : '10px'} !important;
        line-height: 1.1 !important;
        color: #000000 !important;
      }
      
      * {
        color: #000000 !important;
        background: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .business-header,
      .receipt-info,
      .customer-info,
      .total-breakdown,
      .footer-message {
        background: white !important;
        color: #000000 !important;
        border: none !important;
        padding: 2px 0 !important;
      }
      
      .business-name {
        font-size: ${paperWidth === '58mm' ? '11px' : '12px'} !important;
        font-weight: 700 !important;
        margin: 1px 0 !important;
      }
      
      .business-detail {
        font-size: ${paperWidth === '58mm' ? '7px' : '8px'} !important;
        margin: 1px 0 !important;
      }
      
      .receipt-type {
        font-size: ${paperWidth === '58mm' ? '9px' : '10px'} !important;
        font-weight: 700 !important;
      }
      
      .items-header {
        font-size: ${paperWidth === '58mm' ? '7px' : '8px'} !important;
        font-weight: 700 !important;
        border-bottom: 2px solid #000000 !important;
        padding: 1px 0 !important;
      }
      
      .item-row {
        font-size: ${paperWidth === '58mm' ? '7px' : '8px'} !important;
        border-bottom: 1px dotted #000000 !important;
        padding: 1px 0 !important;
      }
      
      .item-note {
        font-size: ${paperWidth === '58mm' ? '5px' : '6px'} !important;
        font-style: italic !important;
        color: #666666 !important;
        margin-top: 1px !important;
        line-height: 1.1 !important;
      }
      
      .item-total {
        font-weight: 700 !important;
      }
      
      .total-label {
        font-size: ${paperWidth === '58mm' ? '10px' : '11px'} !important;
        font-weight: 700 !important;
      }
      
      .section-divider {
        background: #000000 !important;
        height: 1px !important;
        margin: 1px 0 !important;
        border: none !important;
      }
      
      .receipt-date, .receipt-id {
        font-size: ${paperWidth === '58mm' ? '6px' : '7px'} !important;
      }
      
      .payment-method {
        font-size: ${paperWidth === '58mm' ? '7px' : '8px'} !important;
      }
      
      .footer-message p {
        font-size: ${paperWidth === '58mm' ? '7px' : '8px'} !important;
        margin: 1px 0 !important;
      }
      
      .barcode-text {
        font-size: ${paperWidth === '58mm' ? '6px' : '7px'} !important;
        font-family: 'Courier New', monospace !important;
        letter-spacing: 1px !important;
      }
    }
  ` : '';

  return baseStyles + printStyles;
};