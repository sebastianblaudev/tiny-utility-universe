
/**
 * Tipos para datos de negocio
 */

export interface BusinessData {
  id: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  logo?: string;
  taxId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  settings?: BusinessSettings;
  licenseKey?: string;
  expirationDate?: string;
}

export interface BusinessSettings {
  currency?: string;
  taxRate?: number;
  timeZone?: string;
  language?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  enabledModules?: string[];
}
