/**
 * Monitor de Salud del Sistema POS
 * Monitoreo continuo y corrección automática de inconsistencias
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserTenantId } from '@/lib/supabase-helpers';
import { toast } from 'sonner';

export interface HealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  autoFixed?: boolean;
  recommendation?: string;
}

export class SystemHealthMonitor {
  private tenantId: string | null = null;
  private isMonitoring = false;

  async initialize(): Promise<boolean> {
    try {
      this.tenantId = await getCurrentUserTenantId();
      return !!this.tenantId;
    } catch (error) {
      console.error('Health monitor initialization failed:', error);
      return false;
    }
  }

  /**
   * Ejecuta verificaciones de salud en tiempo real
   */
  async runHealthCheck(): Promise<HealthCheck[]> {
    if (!await this.initialize()) {
      return [{
        component: 'System',
        status: 'critical',
        message: 'No se pudo inicializar el monitor de salud',
        recommendation: 'Verificar autenticación y conexión'
      }];
    }

    const checks: HealthCheck[] = [];

    // Verificar cálculos de venta más recientes
    checks.push(await this.checkRecentSalesCalculations());
    
    // Verificar stock crítico
    checks.push(await this.checkCriticalStock());
    
    // Verificar pagos mixtos recientes
    checks.push(await this.checkRecentMixedPayments());
    
    // Verificar productos por peso
    checks.push(await this.checkWeightBasedProducts());
    
    // Verificar turnos activos
    checks.push(await this.checkActiveTurnos());
    
    // Verificar consistencia de datos críticos
    checks.push(await this.checkDataConsistency());

    return checks;
  }

  /**
   * Verifica cálculos de ventas recientes
   */
  private async checkRecentSalesCalculations(): Promise<HealthCheck> {
    try {
      const { data: recentSales, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          sale_items(quantity, price, subtotal)
        `)
        .eq('tenant_id', this.tenantId)
        .gte('date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24 horas
        .limit(50);

      if (error) {
        return {
          component: 'Sales Calculations',
          status: 'warning',
          message: `Error consultando ventas: ${error.message}`,
          recommendation: 'Verificar conexión a la base de datos'
        };
      }

      let inconsistentCount = 0;
      const fixedSales: string[] = [];

      for (const sale of recentSales || []) {
        const calculatedTotal = sale.sale_items?.reduce((sum, item) => 
          sum + (item.subtotal || (item.quantity * item.price)), 0) || 0;
        
        const difference = Math.abs(sale.total - calculatedTotal);
        
        if (difference > 0.01) {
          inconsistentCount++;
          
          // Auto-fix pequeñas diferencias (menores a $10)
          if (difference < 10 && difference > 0.01) {
            try {
              const { error: updateError } = await supabase
                .from('sales')
                .update({ total: calculatedTotal })
                .eq('id', sale.id)
                .eq('tenant_id', this.tenantId);
              
              if (!updateError) {
                fixedSales.push(sale.id);
              }
            } catch (fixError) {
              console.warn('Could not auto-fix sale:', sale.id, fixError);
            }
          }
        }
      }

      if (inconsistentCount === 0) {
        return {
          component: 'Sales Calculations',
          status: 'healthy',
          message: 'Todos los cálculos de venta son correctos'
        };
      } else if (fixedSales.length > 0) {
        return {
          component: 'Sales Calculations',
          status: 'warning',
          message: `${inconsistentCount} inconsistencias encontradas, ${fixedSales.length} corregidas automáticamente`,
          autoFixed: true,
          recommendation: inconsistentCount > fixedSales.length ? 'Revisar diferencias grandes manualmente' : undefined
        };
      } else {
        return {
          component: 'Sales Calculations',
          status: 'critical',
          message: `${inconsistentCount} cálculos incorrectos encontrados`,
          recommendation: 'Revisar y corregir cálculos de venta manualmente'
        };
      }

    } catch (error) {
      return {
        component: 'Sales Calculations',
        status: 'critical',
        message: `Error verificando cálculos: ${error}`,
        recommendation: 'Verificar conectividad y ejecutar validación completa'
      };
    }
  }

  /**
   * Verifica stock crítico
   */
  private async checkCriticalStock(): Promise<HealthCheck> {
    try {
      const { data: criticalStock, error } = await supabase
        .from('products')
        .select('id, name, stock')
        .eq('tenant_id', this.tenantId)
        .lt('stock', 0);

      if (error) {
        return {
          component: 'Stock Management',
          status: 'warning',
          message: `Error consultando stock: ${error.message}`,
          recommendation: 'Verificar conexión a la base de datos'
        };
      }

      if (!criticalStock || criticalStock.length === 0) {
        return {
          component: 'Stock Management',
          status: 'healthy',
          message: 'Stock normal - sin productos con stock negativo'
        };
      }

      // Auto-fix stock negativo pequeño (menos de -5 unidades)
      const autoFixedProducts: string[] = [];
      for (const product of criticalStock) {
        if (product.stock >= -5) {
          try {
            const { error: updateError } = await supabase
              .from('products')
              .update({ stock: 0 })
              .eq('id', product.id)
              .eq('tenant_id', this.tenantId);
            
            if (!updateError) {
              autoFixedProducts.push(product.name);
            }
          } catch (fixError) {
            console.warn('Could not auto-fix stock:', product.id, fixError);
          }
        }
      }

      if (autoFixedProducts.length > 0) {
        return {
          component: 'Stock Management',
          status: 'warning',
          message: `${criticalStock.length} productos con stock negativo, ${autoFixedProducts.length} corregidos automáticamente`,
          autoFixed: true,
          recommendation: criticalStock.length > autoFixedProducts.length ? 'Revisar productos con stock muy negativo' : undefined
        };
      }

      return {
        component: 'Stock Management',
        status: 'critical',
        message: `${criticalStock.length} productos con stock negativo crítico`,
        recommendation: 'Actualizar stock de productos inmediatamente'
      };

    } catch (error) {
      return {
        component: 'Stock Management',
        status: 'critical',
        message: `Error verificando stock: ${error}`,
        recommendation: 'Verificar conectividad y ejecutar inventario manual'
      };
    }
  }

  /**
   * Verifica pagos mixtos recientes
   */
  private async checkRecentMixedPayments(): Promise<HealthCheck> {
    try {
      const { data: mixedSales, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          sale_payment_methods(payment_method, amount)
        `)
        .eq('tenant_id', this.tenantId)
        .eq('payment_method', 'mixed')
        .gte('date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24 horas
        .limit(20);

      if (error) {
        return {
          component: 'Mixed Payments',
          status: 'warning',
          message: `Error consultando pagos mixtos: ${error.message}`,
          recommendation: 'Verificar conexión a la base de datos'
        };
      }

      if (!mixedSales || mixedSales.length === 0) {
        return {
          component: 'Mixed Payments',
          status: 'healthy',
          message: 'Sin pagos mixtos recientes o todos correctos'
        };
      }

      let inconsistentCount = 0;
      for (const sale of mixedSales) {
        const paymentTotal = sale.sale_payment_methods?.reduce((sum, pm) => 
          sum + (pm.amount || 0), 0) || 0;
        
        const difference = Math.abs(sale.total - paymentTotal);
        if (difference > 0.01) {
          inconsistentCount++;
        }
      }

      if (inconsistentCount === 0) {
        return {
          component: 'Mixed Payments',
          status: 'healthy',
          message: `${mixedSales.length} pagos mixtos verificados - todos correctos`
        };
      }

      return {
        component: 'Mixed Payments',
        status: 'critical',
        message: `${inconsistentCount} de ${mixedSales.length} pagos mixtos con totales incorrectos`,
        recommendation: 'Revisar detalles de pagos mixtos manualmente'
      };

    } catch (error) {
      return {
        component: 'Mixed Payments',
        status: 'warning',
        message: `Error verificando pagos mixtos: ${error}`,
        recommendation: 'Verificar conectividad'
      };
    }
  }

  /**
   * Verifica productos por peso
   */
  private async checkWeightBasedProducts(): Promise<HealthCheck> {
    try {
      const { data: weightProducts, error } = await supabase
        .from('products')
        .select('id, name, is_by_weight, unit, price')
        .eq('tenant_id', this.tenantId)
        .eq('is_by_weight', true);

      if (error) {
        return {
          component: 'Weight Products',
          status: 'warning',
          message: `Error consultando productos por peso: ${error.message}`,
          recommendation: 'Verificar conexión a la base de datos'
        };
      }

      if (!weightProducts || weightProducts.length === 0) {
        return {
          component: 'Weight Products',
          status: 'healthy',
          message: 'Sin productos por peso configurados'
        };
      }

      let issuesFound = 0;
      for (const product of weightProducts) {
        if (!product.unit || product.price <= 0) {
          issuesFound++;
        }
      }

      if (issuesFound === 0) {
        return {
          component: 'Weight Products',
          status: 'healthy',
          message: `${weightProducts.length} productos por peso configurados correctamente`
        };
      }

      return {
        component: 'Weight Products',
        status: 'warning',
        message: `${issuesFound} de ${weightProducts.length} productos por peso con configuración incompleta`,
        recommendation: 'Completar unidad y precio para productos por peso'
      };

    } catch (error) {
      return {
        component: 'Weight Products',
        status: 'warning',
        message: `Error verificando productos por peso: ${error}`,
        recommendation: 'Verificar configuración de productos'
      };
    }
  }

  /**
   * Verifica turnos activos
   */
  private async checkActiveTurnos(): Promise<HealthCheck> {
    try {
      const { data: activeTurnos, error } = await supabase
        .from('turnos')
        .select('id, cajero_nombre, fecha_apertura')
        .eq('tenant_id', this.tenantId)
        .eq('estado', 'abierto');

      if (error) {
        return {
          component: 'Cash Management',
          status: 'warning',
          message: `Error consultando turnos: ${error.message}`,
          recommendation: 'Verificar conexión a la base de datos'
        };
      }

      if (!activeTurnos || activeTurnos.length === 0) {
        return {
          component: 'Cash Management',
          status: 'warning',
          message: 'Sin turnos activos',
          recommendation: 'Abrir turno para comenzar operaciones de caja'
        };
      }

      if (activeTurnos.length === 1) {
        return {
          component: 'Cash Management',
          status: 'healthy',
          message: `Turno activo: ${activeTurnos[0].cajero_nombre}`
        };
      }

      return {
        component: 'Cash Management',
        status: 'critical',
        message: `${activeTurnos.length} turnos activos simultáneamente`,
        recommendation: 'Cerrar turnos duplicados para evitar inconsistencias'
      };

    } catch (error) {
      return {
        component: 'Cash Management',
        status: 'warning',
        message: `Error verificando turnos: ${error}`,
        recommendation: 'Verificar estado de turnos manualmente'
      };
    }
  }

  /**
   * Verifica consistencia general de datos
   */
  private async checkDataConsistency(): Promise<HealthCheck> {
    try {
      // Verificar ventas sin items
      const { data: emptySales, error } = await supabase
        .from('sales')
        .select(`
          id,
          sale_items(id)
        `)
        .eq('tenant_id', this.tenantId)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Última semana
        .limit(100);

      if (error) {
        return {
          component: 'Data Consistency',
          status: 'warning',
          message: `Error verificando consistencia: ${error.message}`,
          recommendation: 'Verificar conexión a la base de datos'
        };
      }

      const salesWithoutItems = emptySales?.filter(sale => 
        !sale.sale_items || sale.sale_items.length === 0
      ) || [];

      if (salesWithoutItems.length === 0) {
        return {
          component: 'Data Consistency',
          status: 'healthy',
          message: 'Consistencia de datos verificada - sin problemas'
        };
      }

      return {
        component: 'Data Consistency',
        status: 'critical',
        message: `${salesWithoutItems.length} ventas sin items asociados`,
        recommendation: 'Limpiar ventas huérfanas o asociar items faltantes'
      };

    } catch (error) {
      return {
        component: 'Data Consistency',
        status: 'critical',
        message: `Error verificando consistencia: ${error}`,
        recommendation: 'Ejecutar validación completa del sistema'
      };
    }
  }

  /**
   * Inicia monitoreo continuo (cada 5 minutos)
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Monitor de salud del sistema iniciado');

    const runPeriodicCheck = async () => {
      try {
        const checks = await this.runHealthCheck();
        const criticalIssues = checks.filter(c => c.status === 'critical');
        const autoFixed = checks.filter(c => c.autoFixed);

        if (criticalIssues.length > 0) {
          console.warn('🚨 Problemas críticos detectados:', criticalIssues.map(c => c.message));
          toast.error(`${criticalIssues.length} problemas críticos detectados en el sistema`, {
            description: 'Revisar panel de validación del sistema'
          });
        }

        if (autoFixed.length > 0) {
          console.log('🔧 Correcciones automáticas aplicadas:', autoFixed.map(c => c.message));
          toast.success(`${autoFixed.length} problemas corregidos automáticamente`, {
            description: 'Sistema optimizado'
          });
        }

      } catch (error) {
        console.error('Error en monitoreo automático:', error);
      }
    };

    // Primera verificación inmediata
    setTimeout(runPeriodicCheck, 1000);
    
    // Verificaciones periódicas cada 5 minutos
    const interval = setInterval(runPeriodicCheck, 5 * 60 * 1000);

    // Cleanup function
    (window as any).__healthMonitorCleanup = () => {
      clearInterval(interval);
      this.isMonitoring = false;
      console.log('🔍 Monitor de salud del sistema detenido');
    };
  }

  stopMonitoring(): void {
    if ((window as any).__healthMonitorCleanup) {
      (window as any).__healthMonitorCleanup();
    }
  }
}

// Singleton instance
export const healthMonitor = new SystemHealthMonitor();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  setTimeout(() => {
    healthMonitor.startMonitoring();
  }, 10000); // Start after 10 seconds
}