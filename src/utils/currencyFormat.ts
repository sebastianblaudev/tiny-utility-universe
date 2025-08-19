
// Cache for formatters to improve performance
const formatters: Record<string, Intl.NumberFormat> = {};

export const formatCurrency = (amount: number, currency: string = 'CLP', locale: string = 'es-CL'): string => {
  // Format options for different currencies
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
    maximumFractionDigits: currency === 'CLP' ? 0 : 2,
  };
  
  // Create cache key
  const cacheKey = `${locale}-${currency}`;
  
  // Use cached formatter or create a new one
  if (!formatters[cacheKey]) {
    formatters[cacheKey] = new Intl.NumberFormat(locale, options);
  }
  
  return formatters[cacheKey].format(amount);
};
