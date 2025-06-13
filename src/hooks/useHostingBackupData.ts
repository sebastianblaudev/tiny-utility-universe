import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface BackupData {
  users: any[];
  sales: any[];
  services: any[];
  categories: any[];
  products: any[];
  advances: any[];
  commissions: any[];
  expenses: any[];
  tips: any[];
  promotions: any[];
  barbers: any[];
  settings: any;
  timestamp: string;
  businessEmail?: string;
  version?: string;
  backupType?: string;
  exportDate?: string;
}

export const useHostingBackupData = () => {
  const { user } = useSupabaseAuth();
  const [data, setData] = useState<BackupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const sanitizeEmail = (email: string): string => {
    return email.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  };

  const loadBackupData = async () => {
    if (!user?.email) {
      setError('Usuario no autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const safeEmail = sanitizeEmail(user.email);
      
      console.log('🔍 Intentando cargar datos del servidor');
      console.log('📧 Email original:', user.email);
      console.log('🔧 Email sanitizado:', safeEmail);

      let backupData;
      let loadMethod = '';

      // Primero intentar cargar desde JSON
      try {
        loadMethod = 'JSON fetch';
        const jsonUrl = `https://barberpos.ventapos.app/bkp/backups/backup_${safeEmail}.json`;
        
        console.log('📥 Intentando fetch JSON desde:', jsonUrl);
        
        const timestamp = Date.now();
        const urlWithTimestamp = `${jsonUrl}?t=${timestamp}&r=${Math.random()}`;
        
        const response = await fetch(urlWithTimestamp, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'omit',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('📊 Respuesta JSON:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const jsonContent = await response.text();
        console.log('📄 JSON recibido, longitud:', jsonContent.length);
        
        backupData = JSON.parse(jsonContent);
        console.log('✅ JSON cargado y parseado exitosamente');
        
      } catch (jsonError) {
        console.log('❌ JSON fetch falló:', jsonError.message);
        
        // Fallback a JavaScript si JSON falla
        try {
          loadMethod = 'JavaScript fallback';
          const jsUrl = `https://barberpos.ventapos.app/bkp/backups/backup_${safeEmail}.js`;
          
          console.log('📥 Fallback: Intentando cargar desde JS:', jsUrl);
          
          const timestamp = Date.now();
          const urlWithTimestamp = `${jsUrl}?t=${timestamp}&r=${Math.random()}`;
          
          const module = await import(/* @vite-ignore */ urlWithTimestamp);
          
          if (!module || !module.backupData) {
            throw new Error('El archivo JS no contiene datos válidos');
          }
          
          backupData = module.backupData;
          console.log('✅ JavaScript fallback exitoso');
          
        } catch (jsError) {
          console.log('❌ JavaScript fallback falló:', jsError.message);
          throw new Error(`No se pudo cargar datos. JSON: ${jsonError.message}, JS: ${jsError.message}`);
        }
      }
      
      if (!backupData || typeof backupData !== 'object') {
        throw new Error(`Los datos no tienen el formato correcto (método: ${loadMethod})`);
      }

      console.log('📋 Datos cargados exitosamente usando:', loadMethod);
      console.log('🔍 Estructura de datos:', {
        keys: Object.keys(backupData || {}),
        hasUsers: Array.isArray(backupData?.users),
        hasSales: Array.isArray(backupData?.sales)
      });
      
      // Validar estructura básica de los datos
      const validatedData: BackupData = {
        users: Array.isArray(backupData.users) ? backupData.users : [],
        sales: Array.isArray(backupData.sales) ? backupData.sales : [],
        services: Array.isArray(backupData.services) ? backupData.services : [],
        categories: Array.isArray(backupData.categories) ? backupData.categories : [],
        products: Array.isArray(backupData.products) ? backupData.products : [],
        advances: Array.isArray(backupData.advances) ? backupData.advances : [],
        commissions: Array.isArray(backupData.commissions) ? backupData.commissions : [],
        expenses: Array.isArray(backupData.expenses) ? backupData.expenses : [],
        tips: Array.isArray(backupData.tips) ? backupData.tips : [],
        promotions: Array.isArray(backupData.promotions) ? backupData.promotions : [],
        barbers: Array.isArray(backupData.barbers) ? backupData.barbers : [],
        settings: backupData.settings || {},
        timestamp: backupData.timestamp || new Date().toISOString(),
        businessEmail: backupData.businessEmail || user.email,
        version: backupData.version || '1.0.0',
        backupType: backupData.backupType || (loadMethod.includes('JSON') ? 'json' : 'javascript'),
        exportDate: backupData.exportDate || backupData.timestamp || new Date().toISOString()
      };

      setData(validatedData);
      setLastUpdated(new Date());
      
      console.log('✅ Datos validados y guardados:', {
        método: loadMethod,
        totalUsers: validatedData.users.length,
        totalSales: validatedData.sales.length,
        timestamp: validatedData.timestamp
      });
      
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      
      let errorMessage = 'Error desconocido al cargar datos';
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          errorMessage = `Error de conectividad: No se puede acceder al servidor de respaldos.
            URLs intentadas: 
            • JSON: backup_${sanitizeEmail(user.email)}.json
            • JS: backup_${sanitizeEmail(user.email)}.js`;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos automáticamente cuando hay usuario
  useEffect(() => {
    if (user?.email) {
      console.log('👤 Usuario detectado, iniciando carga de datos:', user.email);
      loadBackupData();
    } else {
      console.log('🚫 No hay usuario autenticado');
    }
  }, [user?.email]);

  // Función para refrescar manualmente
  const refreshData = () => {
    console.log('🔄 Refrescando datos manualmente...');
    loadBackupData();
  };

  // Alias para compatibilidad con HostingReportsPage
  const refetch = refreshData;

  // Función para obtener datos de un tipo específico
  const getDataByType = (type: keyof BackupData) => {
    return data?.[type] || [];
  };

  // Función para verificar si hay datos disponibles
  const hasData = () => {
    return data !== null && Object.keys(data).length > 0;
  };

  // Función para obtener estadísticas básicas
  const getStats = () => {
    if (!data) return null;
    
    return {
      totalUsers: data.users.length,
      totalSales: data.sales.length,
      totalServices: data.services.length,
      totalProducts: data.products.length,
      lastBackup: data.timestamp
    };
  };

  return {
    data,
    loading,
    error,
    lastUpdated,
    refreshData,
    refetch,
    userEmail: user?.email || null,
    getDataByType,
    hasData,
    getStats,
    isConnected: !error && hasData()
  };
};
