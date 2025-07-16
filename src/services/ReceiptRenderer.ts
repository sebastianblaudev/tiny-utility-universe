
import { Receipt, ReceiptItem } from '@/services/ReceiptService';
import { formatCurrency, formatReceiptDate, BusinessInfo } from '@/utils/ticketUtils';

export interface ReceiptRendererOptions {
  showBarcode?: boolean;
  printMode?: boolean;
}

export const generateReceiptHTML = (
  ticketData: Receipt,
  businessInfo: BusinessInfo,
  options: ReceiptRendererOptions = {}
): string => {
  const { showBarcode = true, printMode = false } = options;
  
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
        <div class="customer-icon">👤</div>
        <div class="customer-details">
          <p class="customer-name"><strong>${ticketData.customerName}</strong></p>
          ${ticketData.customerAddress ? `<p class="customer-detail">📍 ${ticketData.customerAddress}</p>` : ''}
          ${ticketData.customerPhone ? `<p class="customer-detail">📞 ${ticketData.customerPhone}</p>` : ''}
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
          <div class="item-details">
            <div class="item-name-qty">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">×${item.quantity}</span>
            </div>
            <div class="item-pricing">
              <span class="item-price">${formatCurrency(item.price)}</span>
              <span class="item-total">${formatCurrency(item.subtotal)}</span>
            </div>
          </div>
          ${item.notes ? `<div class="item-notes">💬 ${item.notes}</div>` : ''}
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

  return `
    <div class="receipt-container">
      <!-- Business Header -->
      <div class="business-header">
        <div class="business-logo">🏪</div>
        ${businessInfo.businessName ? `<h1 class="business-name">${businessInfo.businessName}</h1>` : ''}
        ${businessInfo.address ? `<p class="business-detail">📍 ${businessInfo.address}</p>` : ''}
        ${businessInfo.phone ? `<p class="business-detail">📞 ${businessInfo.phone}</p>` : ''}
      </div>
      
      <!-- Receipt Info -->
      <div class="receipt-info">
        <div class="receipt-badge">
          <span class="receipt-icon">🧾</span>
          <span class="receipt-type">RECIBO DE VENTA</span>
        </div>
        <div class="receipt-meta">
          <p class="receipt-date">📅 ${formattedDate}</p>
          <p class="receipt-id">🆔 ${ticketData.saleId.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>
      
      ${customerInfo}
      
      <!-- Items Section -->
      <div class="items-section">
        <div class="section-title">
          <span class="section-icon">🛍️</span>
          <span>PRODUCTOS</span>
        </div>
        ${itemsHTML}
      </div>
      
      <!-- Totals Section -->
      <div class="totals-section">
        <div class="section-divider"></div>
        <div class="total-breakdown">
          <div class="total-line main-total">
            <span class="total-label">
              <span class="total-icon">💲</span>
              TOTAL
            </span>
            <span class="total-amount">${formatCurrency(ticketData.total)}</span>
          </div>
          <div class="payment-method">
            <span class="payment-icon">${paymentMethodIcon[ticketData.paymentMethod] || '💰'}</span>
            <span>Forma de Pago: ${paymentMethodText[ticketData.paymentMethod] || ticketData.paymentMethod}</span>
          </div>
        </div>
        <div class="section-divider"></div>
      </div>
      
      <!-- Footer -->
      <div class="receipt-footer">
        <div class="footer-message">
          <span class="footer-icon">🙏</span>
          <p>${businessInfo.receiptFooter}</p>
        </div>
        ${barcodeSection}
      </div>
    </div>
  `;
};

export const getReceiptStyles = (printMode: boolean = false): string => {
  const baseStyles = `
    .receipt-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #2d3748;
      max-width: 80mm;
      margin: 0 auto;
      padding: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
    
    .business-logo {
      font-size: 32px;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
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
        size: 80mm auto;
        margin: 0;
      }
      
      body {
        width: 80mm;
        margin: 0;
        padding: 0;
      }
      
      .receipt-container {
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 4mm;
        box-sizing: border-box;
        background: white !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
      
      * {
        color: black !important;
        border-color: black !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .business-header,
      .receipt-info,
      .customer-info,
      .total-breakdown,
      .footer-message {
        background: white !important;
        color: black !important;
        border: 1px solid black !important;
      }
      
      .section-divider {
        background: black !important;
      }
    }
  ` : '';

  return baseStyles + printStyles;
};
