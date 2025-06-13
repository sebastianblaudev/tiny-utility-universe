
import { useEffect, useRef } from 'react';
import { useBarber } from '@/contexts/BarberContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { useTips } from '@/hooks/useTips';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useAuth } from '@/contexts/AuthContext';

const WEBHOOK_URL = 'https://barberpos.ventapos.app/bkp/webhook_backup.php';

export const useAutoBackup = () => {
  const barberContext = useBarber();
  const financialContext = useFinancial();
  const { tips } = useTips();
  const { user } = useSupabaseAuth();
  const authContext = useAuth();
  const lastBackupRef = useRef<string>('');
  
  const createBackup = async () => {
    // Solo crear respaldo si hay usuario autenticado
    if (!user?.email) {
      console.log('No hay usuario autenticado, omitiendo respaldo automático');
      return;
    }

    try {
      // Obtener TODOS los usuarios del sistema
      const systemUsers = authContext.getAllUsers();
      
      console.log('📊 Creando respaldo webhook con TODOS los datos:');
      console.log('- AppSettings:', Object.keys(barberContext.appSettings).length, 'configuraciones');
      console.log('- Barbers:', barberContext.barbers.length, 'barberos');
      console.log('- Services:', barberContext.services.length, 'servicios');
      console.log('- Products:', barberContext.products.length, 'productos');
      console.log('- Categories:', barberContext.categories.length, 'categorías');
      console.log('- Sales:', barberContext.sales.length, 'ventas');
      console.log('- CashAdvances:', barberContext.cashAdvances.length, 'adelantos');
      console.log('- Promotions:', barberContext.promotions.length, 'promociones');
      console.log('- BarberCommissions:', financialContext.barberCommissions.length, 'comisiones');
      console.log('- OperationalExpenses:', financialContext.operationalExpenses.length, 'gastos');
      console.log('- Tips:', tips.length, 'propinas');
      console.log('- SystemUsers:', systemUsers.length, 'usuarios del sistema');

      const completeData = {
        // Identificación del respaldo
        businessEmail: user.email,
        timestamp: new Date().toISOString(),
        exportDate: new Date().toISOString(),
        version: '1.0',
        backupType: 'automatic',
        
        // ✅ CONFIGURACIONES DE LA APLICACIÓN
        appSettings: barberContext.appSettings,
        
        // ✅ DATOS PRINCIPALES DEL NEGOCIO
        barbers: barberContext.barbers,
        services: barberContext.services,
        products: barberContext.products,
        categories: barberContext.categories,
        
        // ✅ TRANSACCIONES Y VENTAS
        sales: barberContext.sales,
        cashAdvances: barberContext.cashAdvances,
        promotions: barberContext.promotions,
        
        // ✅ DATOS FINANCIEROS
        barberCommissions: financialContext.barberCommissions,
        operationalExpenses: financialContext.operationalExpenses,
        
        // ✅ PROPINAS
        tips: tips,
        
        // ✅ USUARIOS DEL SISTEMA
        systemUsers: systemUsers,
        
        // ✅ METADATOS ADICIONALES
        metadata: {
          totalRecords: {
            appSettings: Object.keys(barberContext.appSettings).length,
            barbers: barberContext.barbers.length,
            services: barberContext.services.length,
            products: barberContext.products.length,
            categories: barberContext.categories.length,
            sales: barberContext.sales.length,
            cashAdvances: barberContext.cashAdvances.length,
            promotions: barberContext.promotions.length,
            barberCommissions: financialContext.barberCommissions.length,
            operationalExpenses: financialContext.operationalExpenses.length,
            tips: tips.length,
            systemUsers: systemUsers.length
          },
          webhookUrl: WEBHOOK_URL,
          userEmail: user.email
        }
      };
      
      console.log('📤 Enviando respaldo COMPLETO al webhook con', Object.keys(completeData).length, 'secciones de datos');
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeData)
      });
      
      if (response.ok) {
        console.log('✅ Respaldo automático COMPLETO enviado exitosamente para:', user.email);
        console.log('📊 Resumen del respaldo enviado:');
        console.log('- Configuraciones:', completeData.metadata.totalRecords.appSettings);
        console.log('- Barberos:', completeData.metadata.totalRecords.barbers);
        console.log('- Servicios:', completeData.metadata.totalRecords.services);
        console.log('- Productos:', completeData.metadata.totalRecords.products);
        console.log('- Categorías:', completeData.metadata.totalRecords.categories);
        console.log('- Ventas:', completeData.metadata.totalRecords.sales);
        console.log('- Adelantos:', completeData.metadata.totalRecords.cashAdvances);
        console.log('- Promociones:', completeData.metadata.totalRecords.promotions);
        console.log('- Comisiones:', completeData.metadata.totalRecords.barberCommissions);
        console.log('- Gastos:', completeData.metadata.totalRecords.operationalExpenses);
        console.log('- Propinas:', completeData.metadata.totalRecords.tips);
        console.log('- Usuarios:', completeData.metadata.totalRecords.systemUsers);
      } else {
        console.error('❌ Error al enviar respaldo automático completo:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error al crear respaldo automático completo:', error);
    }
  };
  
  useEffect(() => {
    // Solo proceder si hay usuario autenticado
    if (!user?.email) {
      return;
    }
    
    // Crear un hash más completo de TODOS los datos para detectar cambios
    const currentDataHash = JSON.stringify({
      appSettings: JSON.stringify(barberContext.appSettings),
      barbers: barberContext.barbers.length,
      services: barberContext.services.length,
      products: barberContext.products.length,
      categories: barberContext.categories.length,
      sales: barberContext.sales.length,
      advances: barberContext.cashAdvances.length,
      promotions: barberContext.promotions.length,
      commissions: financialContext.barberCommissions.length,
      expenses: financialContext.operationalExpenses.length,
      tips: tips.length,
      systemUsers: authContext.getAllUsers().length,
      // ✅ INCLUIR HASHES DE LAS ÚLTIMAS TRANSACCIONES PARA DETECTAR CAMBIOS
      lastSale: JSON.stringify(barberContext.sales.slice(-1)),
      lastAdvance: JSON.stringify(barberContext.cashAdvances.slice(-1)),
      lastCommission: JSON.stringify(financialContext.barberCommissions.slice(-1)),
      lastExpense: JSON.stringify(financialContext.operationalExpenses.slice(-1))
    });
    
    // Solo crear respaldo si hay cambios
    if (currentDataHash !== lastBackupRef.current && lastBackupRef.current !== '') {
      console.log('🔄 Cambios detectados en los datos del sistema, iniciando respaldo automático...');
      createBackup();
    }
    
    lastBackupRef.current = currentDataHash;
  }, [
    user?.email,
    // ✅ MONITOREAR CAMBIOS EN TODOS LOS DATOS DEL SISTEMA
    barberContext.appSettings,
    barberContext.barbers,
    barberContext.services,
    barberContext.products,
    barberContext.categories,
    barberContext.sales,
    barberContext.cashAdvances,
    barberContext.promotions,
    financialContext.barberCommissions,
    financialContext.operationalExpenses,
    tips,
    authContext.getAllUsers()
  ]);
  
  return {
    createBackup,
    isEnabled: !!user?.email,
    userEmail: user?.email || null,
    webhookUrl: WEBHOOK_URL
  };
};
