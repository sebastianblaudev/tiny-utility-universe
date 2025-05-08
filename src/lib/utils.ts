
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const getLocaleSettings = () => {
  try {
    const savedSettings = localStorage.getItem("localeSettings");
    if (savedSettings) {
      const { country, language } = JSON.parse(savedSettings);
      return { country, language };
    }
  } catch (error) {
    console.error("Error loading locale settings:", error);
  }
  return { country: 'AR', language: 'es' };
};

// Get tax settings from localStorage or use default values
const getTaxSettings = () => {
  try {
    const savedSettings = localStorage.getItem("taxSettings");
    if (savedSettings) {
      const { taxEnabled, taxPercentage } = JSON.parse(savedSettings);
      return { taxEnabled, taxPercentage: parseFloat(taxPercentage) };
    }
  } catch (error) {
    console.error("Error loading tax settings:", error);
  }
  return { taxEnabled: false, taxPercentage: 0 };
};

export function formatDate(date: string | Date) {
  const { language, country } = getLocaleSettings();
  return new Date(date).toLocaleDateString(`${language}-${country}`, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatCurrency(amount: number, applyTax: boolean = false) {
  const { country, language } = getLocaleSettings();
  const currencyMap: { [key: string]: string } = {
    'AR': 'ARS',
    'CL': 'CLP',
    'MX': 'MXN',
    'US': 'USD',
    'CR': 'CRC'
  };

  const currency = currencyMap[country] || 'USD';
  // Always use 0 decimal places regardless of country
  const decimals = 0;

  // Apply tax if requested and tax is enabled
  let finalAmount = amount;
  if (applyTax) {
    const { taxEnabled, taxPercentage } = getTaxSettings();
    if (taxEnabled && taxPercentage > 0) {
      finalAmount = amount * (1 + taxPercentage / 100);
    }
  }

  return new Intl.NumberFormat(`${language}-${country}`, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(finalAmount);
}

export function printElement(content: HTMLElement) {
  // Get printer settings if available
  let printerSettings = { printerSize: "58mm" };
  try {
    const savedSettings = localStorage.getItem("receiptSettings");
    if (savedSettings) {
      printerSettings = JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error("Error loading printer settings:", error);
  }
  
  // Set width based on printer size
  const pageWidth = printerSettings.printerSize === "80mm" ? "80mm" : "58mm";
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Capture the innerHTML immediately
  const contentHTML = content.innerHTML;

  printWindow.document.write(`
    <html>
      <head>
        <title>Imprimir</title>
        <style>
          @page { size: ${pageWidth} auto; margin: 0; }
          body { 
            font-family: system-ui, -apple-system, sans-serif;
            width: ${pageWidth};
            max-width: ${pageWidth};
            margin: 0;
            padding: 2mm;
            font-size: ${printerSettings.printerSize === "58mm" ? "10px" : "12px"};
          }
          table { width: 100%; }
          td { padding: 4px 0; }
          .border-b { border-bottom: 1px solid #eee; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${contentHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Print immediately without waiting
  printWindow.focus();
  printWindow.print();
  setTimeout(() => {
    printWindow.close();
  }, 100);
}

// Helper function to calculate the price with tax applied
export function calculatePriceWithTax(price: number): number {
  const { taxEnabled, taxPercentage } = getTaxSettings();
  if (taxEnabled && taxPercentage > 0) {
    return price * (1 + taxPercentage / 100);
  }
  return price;
}

// Get tax settings and listener for changes
export function useTaxSettings() {
  return getTaxSettings();
}

// Calculate tax amount (not the total with tax, just the tax amount)
export function calculateTaxAmount(price: number): number {
  const { taxEnabled, taxPercentage } = getTaxSettings();
  if (taxEnabled && taxPercentage > 0) {
    return price * (taxPercentage / 100);
  }
  return 0;
}
