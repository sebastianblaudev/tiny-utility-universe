
import { useState } from "react";
import { fetchBackupFromDrive } from "@/utils/driveBackupFetcher";
import { fetchRemoteBackup } from "@/utils/remoteBackupFetcher";
import type { BackupData, AdminBackupStats } from "@/types/backupTypes";

export function useBackupStats(url: string) {
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [stats, setStats] = useState<AdminBackupStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchData = async (url: string) => {
    if (!url) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Determinar el tipo de URL y usar el método adecuado
      let data: BackupData | null;
      let isDemoData = false;
      
      if (url.includes('pcloud') || url.includes('drive')) {
        // URL de pCloud o Google Drive
        data = await fetchBackupFromDrive(url);
        // Si hay datos pero son el fallback local, marcarlos como demo
        if (data && !data.business.id && process.env.NODE_ENV === 'development') {
          isDemoData = true;
        }
      } else {
        // URL directa al archivo JSON
        data = await fetchRemoteBackup(url);
        // Verificar si los datos son de fallback/demostración
        if (data && data.products.length > 0 && data.products[0].name === "Pizza Margarita") {
          isDemoData = true;
        }
      }
      
      if (data) {
        setBackupData(data);
        
        // Procesar datos para generar estadísticas
        const calculatedStats = calculateStats(data);
        // Añadir bandera que indica si son datos de demostración
        calculatedStats.isDemoData = isDemoData;
        
        setStats(calculatedStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error processing backup data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estadísticas a partir de los datos de respaldo
  const calculateStats = (data: BackupData): AdminBackupStats => {
    // Basic counts
    const productCount = data.products.length;
    const customerCount = data.customers.length;
    const orderCount = data.orders.length;
    
    // Total revenue
    const totalRevenue = data.orders.reduce((sum, order) => sum + order.total, 0);
    
    // Average ticket value
    const averageTicket = orderCount > 0 ? totalRevenue / orderCount : 0;
    
    // Payment method breakdown
    const paymentMethodBreakdown: Record<string, number> = {};
    data.orders.forEach(order => {
      const method = order.paymentMethod || "unknown";
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + order.total;
    });
    
    // Top selling products
    const productSales: Record<string, {name: string, quantity: number, revenue: number}> = {};
    
    data.orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });
    
    const topSellingProducts = Object.entries(productSales)
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Daily revenue for the last week
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Create map of dates to revenue
    const dailyRevenue: Record<string, number> = {};
    
    // Initialize the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dailyRevenue[dateString] = 0;
    }
    
    // Sum up revenue by day
    data.orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= oneWeekAgo) {
        const dateString = orderDate.toISOString().split('T')[0];
        dailyRevenue[dateString] = (dailyRevenue[dateString] || 0) + order.total;
      }
    });
    
    // Convert to array format for charts
    const dailyRevenueLastWeek = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      productCount,
      customerCount,
      orderCount,
      totalRevenue,
      averageTicket,
      topSellingProducts,
      paymentMethodBreakdown,
      dailyRevenueLastWeek,
      backupData: data,
      isDemoData: false // Valor inicial, se actualizará más arriba
    };
  };

  return {
    backupData,
    stats,
    error,
    isLoading,
    refreshData: () => fetchData(url)
  };
}
