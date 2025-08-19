/**
 * Sistema de Validación Integral del POS
 * Verifica la integridad de todas las operaciones críticas del sistema
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserTenantId } from '@/lib/supabase-helpers';
import { POSSystemValidator } from './posSystemValidator';

export interface SystemIntegrityReport {
  isValid: boolean;
  timestamp: string;
  validations: {
    salesCalculations: ValidationResult;
    paymentMethods: ValidationResult;
    stockManagement: ValidationResult;
    weightProducts: ValidationResult;
    mixedPayments: ValidationResult;
    cashHandling: ValidationResult;
    dataConsistency: ValidationResult;
  };
  recommendations: string[];
  criticalIssues: string[];
}

export interface ValidationResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
  details?: any;
}

export class SystemIntegrityValidator {
  private tenantId: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      this.tenantId = await getCurrentUserTenantId();
      return !!this.tenantId;
    } catch (error) {
      console.error('Error initializing validator:', error);
      return false;
    }
  }

  /**
   * Ejecuta validación completa del sistema
   */
  async validateSystemIntegrity(): Promise<SystemIntegrityReport> {
    console.log('🔍 Iniciando validación integral del sistema...');
    const startTime = performance.now();

    if (!await this.initialize()) {
      return {
        isValid: false,
        timestamp: new Date().toISOString(),
        validations: {} as any,
        recommendations: ['Error: No se pudo obtener información del tenant'],
        criticalIssues: ['Sistema no inicializado correctamente']
      };
    }

    const validations = {
      salesCalculations: await this.validateSalesCalculations(),
      paymentMethods: await this.validatePaymentMethods(),
      stockManagement: await this.validateStockManagement(),
      weightProducts: await this.validateWeightProducts(),
      mixedPayments: await this.validateMixedPayments(),
      cashHandling: await this.validateCashHandling(),
      dataConsistency: await this.validateDataConsistency()
    };

    const isValid = Object.values(validations).every(v => v.passed);
    const criticalIssues = Object.values(validations)
      .flatMap(v => v.issues)
      .filter(issue => issue.includes('CRÍTICO'));

    const recommendations = this.generateRecommendations(validations);

    const duration = performance.now() - startTime;
    console.log(`✅ Validación completada en ${duration.toFixed(2)}ms`);

    return {
      isValid,
      timestamp: new Date().toISOString(),
      validations,
      recommendations,
      criticalIssues
    };
  }

  /**
   * Valida cálculos de ventas
   */
  private async validateSalesCalculations(): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Verificar consistencia entre sales y sale_items
      const { data: salesWithItems, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          sale_items(quantity, price, subtotal)
        `)
        .eq('tenant_id', this.tenantId)
        .limit(100)
        .order('date', { ascending: false });

      if (error) {
        issues.push(`Error consultando ventas: ${error.message}`);
        return { passed: false, issues, warnings };
      }

      let inconsistentSales = 0;
      
      for (const sale of salesWithItems || []) {
        const calculatedTotal = sale.sale_items?.reduce((sum, item) => 
          sum + (item.subtotal || (item.quantity * item.price)), 0) || 0;
        
        const difference = Math.abs(sale.total - calculatedTotal);
        
        if (difference > 0.01) { // Tolerancia de 1 centavo
          inconsistentSales++;
          if (difference > 100) { // Diferencias grandes son críticas
            issues.push(`CRÍTICO: Venta ${sale.id} - Diferencia de $${difference.toFixed(2)}`);
          } else {
            warnings.push(`Venta ${sale.id} - Pequeña diferencia: $${difference.toFixed(2)}`);
          }
        }
      }

      if (inconsistentSales === 0) {
        console.log('✅ Cálculos de ventas: Todos correctos');
      } else {
        console.warn(`⚠️ ${inconsistentSales} ventas con inconsistencias encontradas`);
      }

      return {
        passed: issues.length === 0,
        issues,
        warnings,
        details: { totalChecked: salesWithItems?.length || 0, inconsistent: inconsistentSales }
      };

    } catch (error) {
      issues.push(`Error en validación de cálculos: ${error}`);
      return { passed: false, issues, warnings };
    }
  }

  /**
   * Valida métodos de pago
   */
  private async validatePaymentMethods(): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Verificar ventas con payment_method inválido
      const { data: invalidPayments, error } = await supabase
        .from('sales')
        .select('id, payment_method, total')
        .eq('tenant_id', this.tenantId)
        .not('payment_method', 'in', '(cash,card,transfer,mixed)')
        .limit(50);

      if (error) {
        issues.push(`Error consultando métodos de pago: ${error.message}`);
        return { passed: false, issues, warnings };
      }

      if (invalidPayments && invalidPayments.length > 0) {
        warnings.push(`${invalidPayments.length} ventas con métodos de pago no estándar`);
      }

      // Verificar totales por método de pago usando la función de DB
      const { data: paymentTotals, error: totalsError } = await supabase
        .rpc('get_sales_by_payment_method', {
          tenant_id_param: this.tenantId,
          start_date: null,
          end_date: null
        });

      if (totalsError) {
        warnings.push(`No se pudo verificar totales por método de pago: ${totalsError.message}`);
      }

      console.log('✅ Métodos de pago: Validación completada');

      return {
        passed: issues.length === 0,
        issues,
        warnings,
        details: { invalidPayments: invalidPayments?.length || 0 }
      };

    } catch (error) {
      issues.push(`Error en validación de métodos de pago: ${error}`);
      return { passed: false, issues, warnings };
    }
  }

  /**
   * Valida gestión de stock
   */
  private async validateStockManagement(): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Verificar productos con stock negativo
      const { data: negativeStock, error } = await supabase
        .from('products')
        .select('id, name, stock')
        .eq('tenant_id', this.tenantId)
        .lt('stock', 0);

      if (error) {
        issues.push(`Error consultando stock: ${error.message}`);
        return { passed: false, issues, warnings };
      }

      if (negativeStock && negativeStock.length > 0) {
        issues.push(`CRÍTICO: ${negativeStock.length} productos con stock negativo`);
        negativeStock.forEach(product => {
          warnings.push(`${product.name}: Stock ${product.stock}`);
        });
      }

      // Verificar productos sin stock definido
      const { data: undefinedStock, error: undefinedError } = await supabase
        .from('products')
        .select('id, name, stock')
        .eq('tenant_id', this.tenantId)
        .is('stock', null);

      if (undefinedStock && undefinedStock.length > 0) {
        warnings.push(`${undefinedStock.length} productos sin stock definido`);
      }

      console.log('✅ Gestión de stock: Validación completada');

      return {
        passed: issues.length === 0,
        issues,
        warnings,
        details: { 
          negativeStock: negativeStock?.length || 0,
          undefinedStock: undefinedStock?.length || 0
        }
      };

    } catch (error) {
      issues.push(`Error en validación de stock: ${error}`);
      return { passed: false, issues, warnings };
    }
  }

  /**
   * Valida productos por peso
   */
  private async validateWeightProducts(): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Verificar productos por peso
      const { data: weightProducts, error } = await supabase
        .from('products')
        .select('id, name, is_by_weight, unit, price')
        .eq('tenant_id', this.tenantId)
        .eq('is_by_weight', true);

      if (error) {
        issues.push(`Error consultando productos por peso: ${error.message}`);
        return { passed: false, issues, warnings };
      }

      let invalidWeightProducts = 0;

      for (const product of weightProducts || []) {
        // Verificar que tengan unidad definida
        if (!product.unit) {
          warnings.push(`${product.name}: Sin unidad definida para producto por peso`);
          invalidWeightProducts++;
        }

        // Verificar precio válido
        if (!product.price || product.price <= 0) {
          issues.push(`${product.name}: Precio inválido para producto por peso`);
          invalidWeightProducts++;
        }
      }

      // Verificar ventas de productos por peso con cantidades inválidas
      const { data: weightSales, error: salesError } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          products!inner(name, is_by_weight)
        `)
        .eq('tenant_id', this.tenantId)
        .eq('products.is_by_weight', true)
        .lt('quantity', 0.001)
        .limit(20);

      if (weightSales && weightSales.length > 0) {
        warnings.push(`${weightSales.length} ventas de productos por peso con cantidades muy pequeñas`);
      }

      console.log('✅ Productos por peso: Validación completada');

      return {
        passed: issues.length === 0,
        issues,
        warnings,
        details: { 
          totalWeightProducts: weightProducts?.length || 0,
          invalidProducts: invalidWeightProducts
        }
      };

    } catch (error) {
      issues.push(`Error en validación de productos por peso: ${error}`);
      return { passed: false, issues, warnings };
    }
  }

  /**
   * Valida pagos mixtos
   */
  private async validateMixedPayments(): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Verificar ventas marcadas como mixtas que tienen detalles de pago
      const { data: mixedSales, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          sale_payment_methods(payment_method, amount)
        `)
        .eq('tenant_id', this.tenantId)
        .eq('payment_method', 'mixed')
        .limit(50);

      if (error) {
        issues.push(`Error consultando pagos mixtos: ${error.message}`);
        return { passed: false, issues, warnings };
      }

      let inconsistentMixedPayments = 0;

      for (const sale of mixedSales || []) {
        const paymentMethodsTotal = sale.sale_payment_methods?.reduce((sum, pm) => 
          sum + (pm.amount || 0), 0) || 0;
        
        const difference = Math.abs(sale.total - paymentMethodsTotal);
        
        if (difference > 0.01) {
          inconsistentMixedPayments++;
          if (difference > 10) {
            issues.push(`CRÍTICO: Pago mixto ${sale.id} - Diferencia de $${difference.toFixed(2)}`);
          } else {
            warnings.push(`Pago mixto ${sale.id} - Pequeña diferencia: $${difference.toFixed(2)}`);
          }
        }

        // Verificar que tenga al menos 2 métodos de pago
        if (!sale.sale_payment_methods || sale.sale_payment_methods.length < 2) {
          warnings.push(`Pago mixto ${sale.id} con menos de 2 métodos de pago`);
        }
      }

      console.log('✅ Pagos mixtos: Validación completada');

      return {
        passed: issues.length === 0,
        issues,
        warnings,
        details: { 
          totalMixedSales: mixedSales?.length || 0,
          inconsistent: inconsistentMixedPayments
        }
      };

    } catch (error) {
      issues.push(`Error en validación de pagos mixtos: ${error}`);
      return { passed: false, issues, warnings };
    }
  }

  /**
   * Valida manejo de efectivo
   */
  private async validateCashHandling(): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Verificar turnos activos y cerrados
      const { data: activeTurnos, error } = await supabase
        .from('turnos')
        .select('id, cajero_nombre, monto_inicial, monto_final')
        .eq('tenant_id', this.tenantId)
        .eq('estado', 'abierto');

      if (error) {
        issues.push(`Error consultando turnos: ${error.message}`);
        return { passed: false, issues, warnings };
      }

      if (activeTurnos && activeTurnos.length > 1) {
        warnings.push(`${activeTurnos.length} turnos activos simultáneamente`);
      }

      // Verificar transacciones de turno con montos inválidos
      const { data: invalidTransactions, error: transError } = await supabase
        .from('turno_transacciones')
        .select('id, tipo, monto')
        .eq('tenant_id', this.tenantId)
        .or('monto.is.null,monto.eq.0')
        .limit(20);

      if (invalidTransactions && invalidTransactions.length > 0) {
        warnings.push(`${invalidTransactions.length} transacciones de turno con montos inválidos`);
      }

      console.log('✅ Manejo de efectivo: Validación completada');

      return {
        passed: issues.length === 0,
        issues,
        warnings,
        details: { 
          activeTurnos: activeTurnos?.length || 0,
          invalidTransactions: invalidTransactions?.length || 0
        }
      };

    } catch (error) {
      issues.push(`Error en validación de efectivo: ${error}`);
      return { passed: false, issues, warnings };
    }
  }

  /**
   * Valida consistencia general de datos
   */
  private async validateDataConsistency(): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Verificar ventas sin items
      const { data: salesWithoutItems, error } = await supabase
        .from('sales')
        .select(`
          id,
          sale_items(id)
        `)
        .eq('tenant_id', this.tenantId)
        .limit(100)
        .order('date', { ascending: false });

      if (error) {
        issues.push(`Error verificando consistencia: ${error.message}`);
        return { passed: false, issues, warnings };
      }

      const emptySales = salesWithoutItems?.filter(sale => 
        !sale.sale_items || sale.sale_items.length === 0
      ) || [];

      if (emptySales.length > 0) {
        issues.push(`CRÍTICO: ${emptySales.length} ventas sin items asociados`);
      }

      // Verificar items huérfanos
      const { data: orphanItems, error: orphanError } = await supabase
        .from('sale_items')
        .select('id, sale_id')
        .eq('tenant_id', this.tenantId)
        .is('sale_id', null)
        .limit(20);

      if (orphanItems && orphanItems.length > 0) {
        warnings.push(`${orphanItems.length} items de venta huérfanos`);
      }

      console.log('✅ Consistencia de datos: Validación completada');

      return {
        passed: issues.length === 0,
        issues,
        warnings,
        details: { 
          emptySales: emptySales.length,
          orphanItems: orphanItems?.length || 0
        }
      };

    } catch (error) {
      issues.push(`Error en validación de consistencia: ${error}`);
      return { passed: false, issues, warnings };
    }
  }

  /**
   * Genera recomendaciones basadas en los resultados
   */
  private generateRecommendations(validations: any): string[] {
    const recommendations: string[] = [];

    if (!validations.salesCalculations.passed) {
      recommendations.push('Revisar y corregir cálculos de ventas inconsistentes');
    }

    if (!validations.stockManagement.passed) {
      recommendations.push('Actualizar stock negativo y definir stock para todos los productos');
    }

    if (!validations.mixedPayments.passed) {
      recommendations.push('Verificar y corregir pagos mixtos con totales incorrectos');
    }

    if (validations.cashHandling.details?.activeTurnos > 1) {
      recommendations.push('Cerrar turnos múltiples para evitar inconsistencias en efectivo');
    }

    if (!validations.dataConsistency.passed) {
      recommendations.push('Limpiar datos huérfanos y ventas sin items');
    }

    if (recommendations.length === 0) {
      recommendations.push('Sistema operando correctamente - Continuar con monitoreo regular');
    }

    return recommendations;
  }

  /**
   * Ejecuta validación rápida para monitoreo continuo
   */
  async quickValidation(): Promise<{ isHealthy: boolean; criticalIssues: number }> {
    try {
      const posValidation = await POSSystemValidator.quickHealthCheck();
      
      if (!await this.initialize()) {
        return { isHealthy: false, criticalIssues: 1 };
      }

      // Verificaciones críticas básicas
      const { data: negativStock } = await supabase
        .from('products')
        .select('id')
        .eq('tenant_id', this.tenantId)
        .lt('stock', 0);

      const criticalIssues = (negativStock?.length || 0);
      const isHealthy = posValidation && criticalIssues === 0;

      return { isHealthy, criticalIssues };
    } catch (error) {
      console.error('Quick validation error:', error);
      return { isHealthy: false, criticalIssues: 1 };
    }
  }
}

// Singleton instance
export const systemValidator = new SystemIntegrityValidator();

// Auto-run comprehensive validation in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(async () => {
    try {
      const report = await systemValidator.validateSystemIntegrity();
      
      if (report.isValid) {
        console.log('🎉 Sistema POS: Validación integral EXITOSA');
        console.log('📊 Reporte:', report.validations);
      } else {
        console.warn('⚠️ Sistema POS: Se encontraron problemas');
        console.warn('🔥 Problemas críticos:', report.criticalIssues);
        console.warn('💡 Recomendaciones:', report.recommendations);
      }
    } catch (error) {
      console.error('🚨 Error en validación integral:', error);
    }
  }, 5000);
}