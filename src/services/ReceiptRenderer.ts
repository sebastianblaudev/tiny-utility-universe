
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
        ${!is58mm ? '<div class="customer-icon">👤</div>' : ''}
        <div class="customer-details">
          <p class="customer-name"><strong>${ticketData.customerName}</strong></p>
          ${ticketData.customerAddress ? `<p class="customer-detail">${!is58mm ? '📍 ' : ''}${ticketData.customerAddress}</p>` : ''}
          ${ticketData.customerPhone ? `<p class="customer-detail">${!is58mm ? '📞 ' : ''}${ticketData.customerPhone}</p>` : ''}
        </div>
      </div>
      <div class="section-divider"></div>
    </div>
  ` : '';

  let itemsHTML = '';
  if (Object.values(groupedItems).length > 0) {
    Object.values(groupedItems).forEach((item, index) => {
      const isLastItem = index === Object.values(groupedItems).length - 1;
      itemsHTML += `
        <div class="item-row ${isLastItem ? 'last-item' : ''}">
          <div class="item-details ${is58mm ? 'item-details-58mm' : ''}">
            <div class="item-name-qty">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">×${item.quantity}</span>
            </div>
            <div class="item-pricing">
              ${!is58mm ? `<span class="item-price">${formatCurrency(item.price)}</span>` : ''}
              <span class="item-total">${formatCurrency(item.subtotal)}</span>
            </div>
          </div>
          ${item.notes ? `<div class="item-notes">${!is58mm ? '💬 ' : ''}${item.notes}</div>` : ''}
        </div>
      `;
    });
  } else {
    itemsHTML = `
      <div class="no-items">
        <span class="no-items-icon">📦</span>
        <span>No hay productos disponibles</span>
      </div>
    `;
  }

  const paymentMethodIcon = {
    'cash': '💵',
    'card': '💳',
    'transfer': '🏦',
    'mixed': '💰'
  };

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
      <img src="${businessInfo.logo}" alt="Logo" class="business-logo ${is58mm ? 'business-logo-58mm' : ''}" />
    </div>
  ` : '';

  return `
    <div class="receipt-container ${is58mm ? 'receipt-58mm' : 'receipt-80mm'}">
      <!-- Business Header -->
      <div class="business-header">
        ${logoSection}
        ${businessInfo.businessName ? `<h1 class="business-name">${businessInfo.businessName}</h1>` : ''}
        ${businessInfo.address ? `<p class="business-detail">${!is58mm ? '📍 ' : ''}${businessInfo.address}</p>` : ''}
        ${businessInfo.phone ? `<p class="business-detail">${!is58mm ? '📞 ' : ''}${businessInfo.phone}</p>` : ''}
      </div>
      
      <!-- Receipt Info -->
      <div class="receipt-info">
        <div class="receipt-badge">
          ${!is58mm ? '<span class="receipt-icon">🧾</span>' : ''}
          <span class="receipt-type">${is58mm ? 'RECIBO' : 'RECIBO DE VENTA'}</span>
        </div>
        <div class="receipt-meta ${is58mm ? 'receipt-meta-58mm' : ''}">
          <p class="receipt-date">${!is58mm ? '📅 ' : ''}${formattedDate}</p>
          <p class="receipt-id">${!is58mm ? '🆔 ' : 'ID: '}${ticketData.saleId.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>
      
      ${customerInfo}
      
      <!-- Items Section -->
      <div class="items-section">
        <div class="section-title">
          ${!is58mm ? '<span class="section-icon">🛍️</span>' : ''}
          <span>${is58mm ? 'PRODUCTOS' : 'PRODUCTOS'}</span>
        </div>
        ${itemsHTML}
      </div>
      
      <!-- Totals Section -->
      <div class="totals-section">
        <div class="section-divider"></div>
        <div class="total-breakdown">
          <div class="total-line main-total">
            <span class="total-label">
              ${!is58mm ? '<span class="total-icon">💲</span>' : ''}
              TOTAL
            </span>
            <span class="total-amount">${formatCurrency(ticketData.total)}</span>
          </div>
          <div class="payment-method">
            ${!is58mm ? `<span class="payment-icon">${paymentMethodIcon[ticketData.paymentMethod] || '💰'}</span>` : ''}
            <span>${is58mm ? 'Pago:' : 'Forma de Pago:'} ${paymentMethodText[ticketData.paymentMethod] || ticketData.paymentMethod}</span>
          </div>
        </div>
        <div class="section-divider"></div>
      </div>
      
      <!-- Footer -->
      <div class="receipt-footer">
        <div class="footer-message">
          ${!is58mm ? '<span class="footer-icon">🙏</span>' : ''}
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
      font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #000000;
      font-weight: 400;
      max-width: 80mm;
      margin: 0 auto;
      padding: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .receipt-58mm {
      max-width: 58mm;
      font-size: 11px;
      line-height: 1.4;
      padding: 8px;
    }

    .receipt-58mm .business-header {
      padding: 8px 4px;
      margin-bottom: 8px;
    }

    .receipt-58mm .business-name {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .receipt-58mm .business-detail {
      font-size: 9px;
      margin: 2px 0;
    }

    .receipt-58mm .receipt-info {
      padding: 6px;
      margin-bottom: 8px;
    }

    .receipt-58mm .receipt-type {
      font-size: 12px;
    }

    .receipt-58mm .receipt-meta {
      font-size: 8px;
    }

    .receipt-meta-58mm {
      flex-direction: column;
      gap: 2px;
    }

    .receipt-58mm .item-row {
      padding: 6px;
      margin-bottom: 4px;
    }

    .item-details-58mm {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .receipt-58mm .item-name {
      font-size: 10px;
      line-height: 1.2;
    }

    .receipt-58mm .item-qty {
      font-size: 9px;
    }

    .receipt-58mm .item-total {
      font-size: 11px;
      font-weight: 700;
    }

    .receipt-58mm .item-notes {
      font-size: 8px;
      padding: 4px;
      margin-top: 4px;
    }

    .receipt-58mm .section-title {
      font-size: 10px;
      padding: 4px 6px;
      margin-bottom: 6px;
    }

    .receipt-58mm .total-breakdown {
      padding: 8px;
    }

    .receipt-58mm .main-total .total-label {
      font-size: 12px;
    }

    .receipt-58mm .total-amount {
      font-size: 14px;
    }

    .receipt-58mm .payment-method {
      font-size: 9px;
    }

    .receipt-58mm .footer-message {
      padding: 6px;
      margin-bottom: 6px;
    }

    .receipt-58mm .footer-message p {
      font-size: 9px;
      margin: 4px 0 0 0;
    }

    .receipt-58mm .barcode-text {
      font-size: 8px;
      letter-spacing: 1px;
    }

    .receipt-58mm .customer-info {
      padding: 6px;
    }

    .receipt-58mm .customer-name {
      font-size: 10px;
    }

    .receipt-58mm .customer-detail {
      font-size: 8px;
    }
    
    .business-logo-container {
      text-align: center;
      margin-bottom: 12px;
    }
    
    .business-logo {
      max-width: 60mm;
      max-height: 40mm;
      height: auto;
      object-fit: contain;
      border-radius: 4px;
    }
    
    .business-logo-58mm {
      max-width: 40mm;
      max-height: 25mm;
    }

    .business-header {
      text-align: center;
      margin-bottom: 20px;
      padding: 16px 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    .business-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="3" fill="rgba(255,255,255,0.05)"/><circle cx="40" cy="60" r="1" fill="rgba(255,255,255,0.08)"/></svg>');
    }
    
    .business-logo-container {
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .business-logo {
      max-width: 120px;
      max-height: 80px;
      object-fit: contain;
      filter: brightness(0) invert(1);
    }
    
    .business-logo-fallback {
      font-size: 32px;
    }
    
    .business-name {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      position: relative;
      z-index: 1;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    
    .business-detail {
      font-size: 12px;
      margin: 4px 0;
      opacity: 0.9;
      position: relative;
      z-index: 1;
    }
    
    .receipt-info {
      text-align: center;
      margin-bottom: 16px;
      padding: 12px;
      background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
      border-radius: 8px;
      color: white;
    }
    
    .receipt-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .receipt-icon {
      font-size: 16px;
    }
    
    .receipt-type {
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 0.5px;
    }
    
    .receipt-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      opacity: 0.9;
    }
    
    .receipt-date, .receipt-id {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .customer-section {
      margin-bottom: 16px;
    }
    
    .customer-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      border-radius: 8px;
      color: white;
    }
    
    .customer-icon {
      font-size: 20px;
      flex-shrink: 0;
    }
    
    .customer-details {
      flex: 1;
    }
    
    .customer-name {
      margin: 0 0 4px 0;
      font-size: 14px;
    }
    
    .customer-detail {
      margin: 2px 0;
      font-size: 12px;
      opacity: 0.9;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .section-divider {
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #e2e8f0 20%, #cbd5e0 50%, #e2e8f0 80%, transparent 100%);
      margin: 12px 0;
      border-radius: 1px;
    }
    
    .items-section {
      margin-bottom: 16px;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-radius: 6px;
      border-left: 4px solid #4299e1;
    }
    
    .section-icon {
      font-size: 16px;
    }
    
    .item-row {
      padding: 12px;
      margin-bottom: 8px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
    }
    
    .item-row:hover {
      border-color: #cbd5e0;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .item-row.last-item {
      border-bottom: 2px solid #4299e1;
    }
    
    .item-details {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .item-name-qty {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }
    
    .item-name {
      font-weight: 600;
      color: #2d3748;
      font-size: 13px;
    }
    
    .item-qty {
      font-size: 11px;
      color: #718096;
      font-weight: 500;
    }
    
    .item-pricing {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }
    
    .item-price {
      font-size: 12px;
      color: #718096;
    }
    
    .item-total {
      font-weight: 700;
      color: #2d3748;
      font-size: 14px;
    }
    
    .item-notes {
      margin-top: 8px;
      padding: 6px;
      background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%);
      border-radius: 4px;
      font-size: 11px;
      color: #c05621;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .no-items {
      text-align: center;
      color: #a0aec0;
      font-style: italic;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #f7fafc;
      border-radius: 8px;
      border: 2px dashed #e2e8f0;
    }
    
    .no-items-icon {
      font-size: 20px;
    }
    
    .totals-section {
      margin-bottom: 16px;
    }
    
    .total-breakdown {
      padding: 16px;
      background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
      border-radius: 8px;
      color: white;
    }
    
    .total-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .main-total .total-label {
      font-weight: 700;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .total-icon {
      font-size: 20px;
    }
    
    .total-amount {
      font-weight: 700;
      font-size: 20px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    
    .payment-method {
      font-size: 12px;
      opacity: 0.9;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .payment-icon {
      font-size: 14px;
    }
    
    .receipt-footer {
      text-align: center;
    }
    
    .footer-message {
      padding: 12px;
      background: linear-gradient(135deg, #805ad5 0%, #6b46c1 100%);
      border-radius: 8px;
      color: white;
      margin-bottom: 12px;
    }
    
    .footer-message p {
      margin: 8px 0 0 0;
      font-size: 12px;
      opacity: 0.9;
    }
    
    .footer-icon {
      font-size: 16px;
    }
    
    .barcode-section {
      margin-top: 12px;
    }
    
    .barcode-container {
      margin: 12px 0;
      display: flex;
      justify-content: center;
      padding: 8px;
      background: white;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    
    .barcode-text {
      font-size: 10px;
      letter-spacing: 2px;
      margin-top: 4px;
      font-family: 'Courier New', monospace;
      color: #4a5568;
      font-weight: 600;
    }
  `;

  const printStyles = printMode ? `
    @media print {
      @page {
        size: ${paperWidth} auto;
        margin: 0;
      }
      
      body {
        width: ${paperWidth};
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
      }
      
      .receipt-container {
        width: 100%;
        max-width: none;
        margin: 0;
        padding: ${paperWidth === '58mm' ? '2mm' : '4mm'};
        box-sizing: border-box;
        background: white !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
        font-size: ${paperWidth === '58mm' ? '10px' : '12px'} !important;
        line-height: 1.3 !important;
        color: #000000 !important;
        font-weight: 400 !important;
      }
      
      * {
        color: #000000 !important;
        border-color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-family: inherit !important;
      }
      
      .business-header,
      .receipt-info,
      .customer-info,
      .total-breakdown,
      .footer-message {
        background: white !important;
        color: #000000 !important;
        border: 1px solid #000000 !important;
      }
      
      .business-name {
        font-size: ${paperWidth === '58mm' ? '14px' : '18px'} !important;
        font-weight: 700 !important;
        color: #000000 !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
      }
      
      .business-detail {
        font-size: ${paperWidth === '58mm' ? '9px' : '11px'} !important;
        color: #000000 !important;
        font-weight: 400 !important;
      }
      
      .receipt-type {
        font-size: ${paperWidth === '58mm' ? '12px' : '14px'} !important;
        font-weight: 600 !important;
        color: #000000 !important;
      }
      
      .item-name {
        font-size: ${paperWidth === '58mm' ? '10px' : '12px'} !important;
        font-weight: 600 !important;
        color: #000000 !important;
      }
      
      .item-qty {
        font-size: ${paperWidth === '58mm' ? '9px' : '11px'} !important;
        font-weight: 500 !important;
        color: #000000 !important;
      }
      
      .item-total {
        font-size: ${paperWidth === '58mm' ? '11px' : '13px'} !important;
        font-weight: 700 !important;
        color: #000000 !important;
      }
      
      .total-label {
        font-size: ${paperWidth === '58mm' ? '12px' : '16px'} !important;
        font-weight: 700 !important;
        color: #000000 !important;
      }
      
      .total-amount {
        font-size: ${paperWidth === '58mm' ? '14px' : '18px'} !important;
        font-weight: 700 !important;
        color: #000000 !important;
      }
      
      .section-divider {
        background: #000000 !important;
        height: 1px !important;
      }
      
      .receipt-date, .receipt-id {
        font-size: ${paperWidth === '58mm' ? '8px' : '10px'} !important;
        color: #000000 !important;
      }
      
      .customer-name {
        font-size: ${paperWidth === '58mm' ? '10px' : '12px'} !important;
        font-weight: 600 !important;
        color: #000000 !important;
      }
      
      .customer-detail {
        font-size: ${paperWidth === '58mm' ? '8px' : '10px'} !important;
        color: #000000 !important;
      }
      
      .payment-method {
        font-size: ${paperWidth === '58mm' ? '9px' : '11px'} !important;
        color: #000000 !important;
      }
      
      .footer-message p {
        font-size: ${paperWidth === '58mm' ? '9px' : '11px'} !important;
        color: #000000 !important;
      }
      
      .barcode-text {
        font-size: ${paperWidth === '58mm' ? '8px' : '10px'} !important;
        font-family: 'Courier New', monospace !important;
        font-weight: 600 !important;
        color: #000000 !important;
        letter-spacing: 1px !important;
      }
    }
  ` : '';

  return baseStyles + printStyles;
};
