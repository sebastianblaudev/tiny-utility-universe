
import { Database } from '@/integrations/supabase/types';

// Tipos para las nuevas tablas de Supabase
export type SupabaseSystemUser = Database['public']['Tables']['system_users']['Row'];
export type SupabaseUserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type SupabaseTip = Database['public']['Tables']['tips']['Row'];

// Tipos para inserts
export type SystemUserInsert = Database['public']['Tables']['system_users']['Insert'];
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
export type TipInsert = Database['public']['Tables']['tips']['Insert'];

// Interfaces adaptadas que mantienen compatibilidad
export interface SystemUserData {
  id: string;
  name: string;
  pin: string;
  role: 'owner' | 'admin' | 'barber';
  branchId: string;
  isBlocked?: boolean;
}

export interface UserPreferencesData {
  id: string;
  sidebarOpen: boolean;
  theme: string;
  notificationsEnabled: boolean;
  preferences: Record<string, any>;
}

export interface TipData {
  id: string;
  tipId: string;
  amount: number;
  barberId: string;
  barberName?: string;
  saleId?: string;
  paymentMethod: string;
  date: Date;
}

export interface AppSettingsExtended {
  branchName: string;
  address: string;
  phone: string;
  receiptSettings: {
    showLogo: boolean;
    showAddress: boolean;
    showPhone: boolean;
    footerText: string;
  };
  languageSettings: {
    language: string;
    currency: string;
    timezone: string;
  };
  blockedNames: string[];
}
