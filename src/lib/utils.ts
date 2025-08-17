
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Apply minimalist scrollbar styles to any element
 * @param additionalClasses - Additional classes to merge with scrollbar styles
 * @returns Merged class string including minimalist scrollbar styles
 */
export function sidebarScrollbar(...additionalClasses: ClassValue[]) {
  return cn('sidebar-scrollbar', ...additionalClasses);
}

/**
 * Currency formatter helper that formats according to the system's locale and currency
 * @param amount - The amount to format
 * @param currencyCode - The currency code (default: CLP)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currencyCode: string = 'CLP'): string {
  try {
    const formattingOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currencyCode || 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };
    
    // Only for USD, EUR and GBP use 2 decimals if needed
    if (['USD', 'EUR', 'GBP'].includes(currencyCode)) {
      formattingOptions.minimumFractionDigits = 2;
      formattingOptions.maximumFractionDigits = 2;
    }
    
    return new Intl.NumberFormat('es-CL', formattingOptions).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount}`;
  }
}

/**
 * Date formatter helper that formats dates in a consistent way
 * @param date - The date to format (string or Date object)
 * @param formatString - The format string (default: 'dd/MM/yyyy HH:mm')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, formatString: string = 'dd/MM/yyyy HH:mm'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatString, { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toString();
  }
}
