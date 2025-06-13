
import { Database } from '@/integrations/supabase/types';

// Tipos de las tablas de Supabase para facilitar el uso
export type SupabaseAppSettings = Database['public']['Tables']['app_settings']['Row'];
export type SupabaseBarber = Database['public']['Tables']['barbers']['Row'];
export type SupabaseCategory = Database['public']['Tables']['categories']['Row'];
export type SupabaseService = Database['public']['Tables']['services']['Row'];
export type SupabaseProduct = Database['public']['Tables']['products']['Row'];
export type SupabaseSale = Database['public']['Tables']['sales']['Row'];
export type SupabaseCashAdvance = Database['public']['Tables']['cash_advances']['Row'];
export type SupabasePromotion = Database['public']['Tables']['promotions']['Row'];

// Tipos para inserts (sin id ni timestamps)
export type AppSettingsInsert = Database['public']['Tables']['app_settings']['Insert'];
export type BarberInsert = Database['public']['Tables']['barbers']['Insert'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type SaleInsert = Database['public']['Tables']['sales']['Insert'];
export type CashAdvanceInsert = Database['public']['Tables']['cash_advances']['Insert'];
export type PromotionInsert = Database['public']['Tables']['promotions']['Insert'];

// Tipos adaptados que mantienen compatibilidad con el código existente
export interface AppSettingsData {
  branchName: string;
  address: string;
  phone: string;
}

export interface BarberData {
  id: string;
  name: string;
}

export interface CategoryData {
  id: string;
  name: string;
}

export interface ServiceData {
  id: string;
  name: string;
  price: number;
  duration: number;
  categoryId: string;
  barberId?: string;
  barcode?: string;
  barberBarcodes?: { barberId: string; barcode: string }[];
}

export interface ProductData {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string;
}

export interface SaleData {
  id: string;
  barberId: string;
  date: string;
  items: any[];
  total: number;
  paymentMethod: string;
  splitPayments?: any[];
  tip?: any;
  discount?: any;
  appliedPromotion?: any;
}

export interface CashAdvanceData {
  id: string;
  barberId: string;
  barberName?: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string;
  status: 'pending' | 'settled';
  settled?: boolean;
}

export interface PromotionData {
  id: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  startDate: string;
  endDate: string;
  active?: boolean;
  requiresOwnerPin?: boolean;
  minimumPurchase?: number;
  applicableCategories?: string[];
  applicableItems?: string[];
  buyXGetYDetails?: any;
}
