
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a number as Chilean Pesos (CLP)
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format a number as a decimal
export function formatNumber(number: number, decimals: number = 2): string {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

// Generate a unique quotation ID
export function generateQuotationId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  // Get current count of quotations for today from localStorage
  const countKey = `quotationCount_${year}${month}${day}`;
  const currentCount = parseInt(localStorage.getItem(countKey) || "0");
  const newCount = currentCount + 1;
  
  // Save the new count
  localStorage.setItem(countKey, newCount.toString());
  
  // Format as COT-YYYYMMDD-XXX
  return `COT-${year}${month}${day}-${String(newCount).padStart(3, "0")}`;
}

// Calculate Chilean VAT (IVA 19%)
export function calculateVAT(amount: number): number {
  return amount * 0.19;
}

// Fetch UF value from mindicador.cl API
export async function fetchUFValue(): Promise<number | null> {
  try {
    const response = await fetch("https://mindicador.cl/api/uf");
    if (!response.ok) throw new Error("Failed to fetch UF value");
    
    const data = await response.json();
    return data.serie[0].valor as number;
  } catch (error) {
    console.error("Error fetching UF value:", error);
    return null;
  }
}

// Convert CLP to UF
export function clpToUF(clpAmount: number, ufValue: number): number {
  return clpAmount / ufValue;
}

// Convert UF to CLP
export function ufToCLP(ufAmount: number, ufValue: number): number {
  return ufAmount * ufValue;
}

// Convert number to words in Spanish (for legal documents)
export function numberToWords(number: number): string {
  // This is a simplified version, a real implementation would be more complex
  const units = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const tens = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const thousands = ['', 'mil', 'millón', 'mil millones', 'billón'];
  
  if (number === 0) return 'cero';
  
  function convertLessThanThousand(num: number): string {
    if (num < 10) return units[num];
    
    if (num < 20) return teens[num - 10];
    
    if (num < 100) {
      const unit = num % 10;
      const ten = Math.floor(num / 10);
      return unit > 0 ? `${tens[ten]} y ${units[unit]}` : tens[ten];
    }
    
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    
    let result = '';
    
    if (hundred === 1) {
      result = 'cien';
    } else {
      result = units[hundred] + 'cientos';
    }
    
    if (remainder > 0) {
      result += ' ' + convertLessThanThousand(remainder);
    }
    
    return result;
  }
  
  let result = '';
  let index = 0;
  
  do {
    const chunk = number % 1000;
    
    if (chunk !== 0) {
      const chunkText = convertLessThanThousand(chunk);
      const suffix = thousands[index];
      
      result = chunkText + (suffix ? ' ' + suffix : '') + (result ? ', ' + result : '');
    }
    
    number = Math.floor(number / 1000);
    index++;
  } while (number > 0);
  
  return result;
}

// Function to share via WhatsApp
export function shareViaWhatsApp(phoneNumber: string, text: string): void {
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedText}`;
  window.open(whatsappUrl, '_blank');
}

// Format a date as DD/MM/YYYY
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

// Calculate a future date by adding days
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
