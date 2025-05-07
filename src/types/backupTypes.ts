
/**
 * Tipos para el sistema de respaldos
 */

// Estructura de un respaldo completo
export interface BackupData {
  products: any[];
  customers: any[];
  orders: any[];
  tables: any[];
  business?: any;
  timestamp: string;
  backup_metadata?: {
    businessName: string;
    userId: string;
    timestamp: string;
  };
}

// Tipo para estadísticas de administrador basadas en respaldos
export interface AdminBackupStats {
  productCount: number;
  customerCount: number;
  orderCount: number;
  totalRevenue: number;
  averageTicket: number;
  topSellingProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethodBreakdown: Record<string, number>;
  dailyRevenueLastWeek: Array<{
    date: string;
    revenue: number;
  }>;
  backupData: BackupData;
}

// Tipo para la configuración de respaldos
export interface BackupConfig {
  enabled: boolean;
  interval: number; // en minutos
  directory?: string;
  cloudEnabled: boolean;
  cloudBucketName?: string;
  lastBackupDate?: string;
}
