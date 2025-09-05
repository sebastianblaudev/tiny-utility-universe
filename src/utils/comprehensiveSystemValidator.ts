/**
 * VALIDADOR INTEGRAL DEL SISTEMA POS
 * Verifica TODAS las operaciones críticas con énfasis en:
 * - Cálculos de ventas y totales por método de pago
 * - Efectivo y turnos
 * - Pagos mixtos
 * - Stock (productos normales y por peso)
 * - Separación correcta entre tenants
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserTenantId } from '@/lib/supabase-helpers';

export interface ComprehensiveValidationReport {
  timestamp: string;
  tenantId: string;
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'ERROR';
  validations: {
    salesCalculations: ValidationDetail;
    paymentMethods: ValidationDetail;
    mixedPayments: ValidationDetail;
    stockManagement: ValidationDetail;
    weightProducts: ValidationDetail;
    cashManagement: ValidationDetail;
    tenantSeparation: ValidationDetail;
    dataIntegrity: ValidationDetail;
  };
  summary: {
    totalChecked: number;
    errorsFound: number;
    warningsFound: number;
    autoFixed: number;
  };
  criticalIssues: string[];
  recommendations: string[];
}

export interface ValidationDetail {
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  details: any;
  issuesFound: string[];
  autoFixed: string[];
  recommendation?: string;
}

export class ComprehensiveSystemValidator {
  private tenantId: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      this.tenantId = await getCurrentUserTenantId();
      if (!this.tenantId) {
        console.error('❌ No se pudo obtener tenant ID');
        return false;
      }
      console.log(`🔍 Iniciando validación para tenant: ${this.tenantId}`);
      return true;
    } catch (error) {
      console.error('❌ Error inicializando validator:', error);
      return false;
    }
  }

  /**
   * VALIDACIÓN COMPLETA DEL SISTEMA
   */
  async validateEntireSystem(): Promise<ComprehensiveValidationReport> {
    console.log('🚀 INICIANDO VALIDACIÓN INTEGRAL DEL SISTEMA...');
    const startTime = performance.now();

    if (!await this.initialize()) {
      return this.createErrorReport('Error de inicialización - No se pudo obtener tenant ID');
    }

    const validations = {
      salesCalculations: await this.validateSalesCalculations(),
      paymentMethods: await this.validatePaymentMethods(),
      mixedPayments: await this.validateMixedPayments(),
      stockManagement: await this.validateStockManagement(),
      weightProducts: await this.validateWeightProducts(),
      cashManagement: await this.validateCashManagement(),
      tenantSeparation: await this.validateTenantSeparation(),
      dataIntegrity: await this.validateDataIntegrity()
    };

    const endTime = performance.now();
    console.log(`⏱️ Validación completada en ${(endTime - startTime).toFixed(2)}ms`);

    return this.compileReport(validations);
  }

  /**
   * 1. VALIDACIÓN DE CÁLCULOS DE VENTAS
   */
  private async validateSalesCalculations(): Promise<ValidationDetail> {
    console.log('🧮 Validando cálculos de ventas...');
    const issues: string[] = [];
    const autoFixed: string[] = [];

    try {
      // Obtener ventas recientes con sus items
      const { data: salesWithItems, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          payment_method,
          date,
          sale_items (
            id,
            quantity,
            price,
            subtotal,
            products (
              name,
              is_by_weight
            )
          )
        `)
        .eq('tenant_id', this.tenantId)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false })
        .limit(200);

      if (error) throw error;

      let inconsistentSales = 0;
      let totalSales = salesWithItems?.length || 0;

      for (const sale of salesWithItems || []) {
        // Calcular total basado en items
        let calculatedTotal = 0;
        for (const item of sale.sale_items || []) {
          if (item.subtotal) {
            calculatedTotal += item.subtotal;
          } else {
            // Fallback: calcular desde cantidad y precio
            calculatedTotal += (item.quantity || 0) * (item.price || 0);
          }
        }

        const difference = Math.abs(sale.total - calculatedTotal);
        
        if (difference > 0.01) { // Tolerancia de 1 centavo
          inconsistentSales++;
          const errorMsg = `Venta ${sale.id.substring(0, 8)}: Total registrado $${sale.total}, calculado $${calculatedTotal.toFixed(2)}, diferencia $${difference.toFixed(2)}`;
          
          if (difference < 5) { // Auto-fix diferencias menores a $5
            try {
              const { error: updateError } = await supabase
                .from('sales')
                .update({ total: calculatedTotal })
                .eq('id', sale.id)
                .eq('tenant_id', this.tenantId);
              
              if (!updateError) {
                autoFixed.push(`Auto-corregido: ${errorMsg}`);
              } else {
                issues.push(errorMsg);
              }
            } catch {
              issues.push(errorMsg);
            }
          } else {
            issues.push(`CRÍTICO: ${errorMsg}`);
          }
        }
      }

      const status = issues.length === 0 ? 'PASS' : (issues.some(i => i.includes('CRÍTICO')) ? 'FAIL' : 'WARNING');
      
      return {
        status,
        message: `${totalSales} ventas verificadas, ${inconsistentSales} inconsistencias${autoFixed.length > 0 ? `, ${autoFixed.length} auto-corregidas` : ''}`,
        details: { totalSales, inconsistentSales, autoFixedCount: autoFixed.length },
        issuesFound: issues,
        autoFixed,
        recommendation: issues.length > 0 ? 'Revisar cálculos de venta y corregir manualmente los críticos' : undefined
      };

    } catch (error) {
      return {
        status: 'FAIL',
        message: `Error validando cálculos: ${error}`,
        details: { error: String(error) },
        issuesFound: [`Error de sistema: ${error}`],
        autoFixed: []
      };
    }
  }

  /**
   * 2. VALIDACIÓN DE MÉTODOS DE PAGO
   */
  private async validatePaymentMethods(): Promise<ValidationDetail> {
    console.log('💳 Validando métodos de pago...');
    const issues: string[] = [];
    const autoFixed: string[] = [];

    try {
      // Verificar métodos de pago válidos
      const { data: invalidPayments, error } = await supabase
        .from('sales')
        .select('id, payment_method, total, date')
        .eq('tenant_id', this.tenantId)
        .not('payment_method', 'in', '(cash,card,transfer,mixed)')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      if (error) throw error;

      // Verificar totales por método usando función de DB
      const { data: paymentTotals, error: totalsError } = await supabase
        .rpc('get_sales_by_payment_method', {
          tenant_id_param: this.tenantId,
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        });

      let totalsByMethod: Record<string, number> = {};
      if (!totalsError && paymentTotals) {
        for (const item of paymentTotals) {
          totalsByMethod[item.payment_method] = item.total;
        }
      }

      // Verificar ventas con método de pago null
      const { data: nullPayments, error: nullError } = await supabase
        .from('sales')
        .select('id, total')
        .eq('tenant_id', this.tenantId)
        .is('payment_method', null)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const totalIssues = (invalidPayments?.length || 0) + (nullPayments?.length || 0);

      if (invalidPayments && invalidPayments.length > 0) {
        issues.push(`${invalidPayments.length} ventas con métodos de pago no estándar`);
      }

      if (nullPayments && nullPayments.length > 0) {
        issues.push(`${nullPayments.length} ventas sin método de pago definido`);
      }

      const status = totalIssues === 0 ? 'PASS' : 'WARNING';

      return {
        status,
        message: `Métodos de pago verificados. ${Object.keys(totalsByMethod).length} métodos activos`,
        details: { 
          invalidCount: invalidPayments?.length || 0,
          nullCount: nullPayments?.length || 0,
          totalsByMethod 
        },
        issuesFound: issues,
        autoFixed,
        recommendation: totalIssues > 0 ? 'Estandarizar métodos de pago a: cash, card, transfer, mixed' : undefined
      };

    } catch (error) {
      return {
        status: 'FAIL',
        message: `Error validando métodos de pago: ${error}`,
        details: { error: String(error) },
        issuesFound: [`Error de sistema: ${error}`],
        autoFixed: []
      };
    }
  }

  /**
   * 3. VALIDACIÓN DE PAGOS MIXTOS
   */
  private async validateMixedPayments(): Promise<ValidationDetail> {
    console.log('🔀 Validando pagos mixtos...');
    const issues: string[] = [];
    const autoFixed: string[] = [];

    try {
      // Obtener ventas con pago mixto y sus detalles
      const { data: mixedSales, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          date,
          sale_payment_methods (
            payment_method,
            amount
          )
        `)
        .eq('tenant_id', this.tenantId)
        .eq('payment_method', 'mixed')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      if (error) throw error;

      let totalMixed = mixedSales?.length || 0;
      let inconsistentMixed = 0;

      for (const sale of mixedSales || []) {
        const paymentMethodsTotal = sale.sale_payment_methods?.reduce((sum, pm) => 
          sum + (pm.amount || 0), 0) || 0;
        
        const difference = Math.abs(sale.total - paymentMethodsTotal);
        
        if (difference > 0.01) {
          inconsistentMixed++;
          const errorMsg = `Pago mixto ${sale.id.substring(0, 8)}: Total venta $${sale.total}, suma pagos $${paymentMethodsTotal.toFixed(2)}, diferencia $${difference.toFixed(2)}`;
          
          if (difference < 2) { // Auto-fix diferencias muy pequeñas
            issues.push(`Advertencia menor: ${errorMsg}`);
          } else {
            issues.push(`CRÍTICO: ${errorMsg}`);
          }
        }

        // Verificar que tenga al menos 2 métodos
        if (!sale.sale_payment_methods || sale.sale_payment_methods.length < 2) {
          issues.push(`Pago mixto ${sale.id.substring(0, 8)} tiene menos de 2 métodos de pago`);
        }
      }

      const status = issues.filter(i => i.includes('CRÍTICO')).length > 0 ? 'FAIL' : 
                    (issues.length > 0 ? 'WARNING' : 'PASS');

      return {
        status,
        message: `${totalMixed} pagos mixtos verificados, ${inconsistentMixed} con inconsistencias`,
        details: { totalMixed, inconsistentMixed },
        issuesFound: issues,
        autoFixed,
        recommendation: inconsistentMixed > 0 ? 'Revisar y corregir detalles de pagos mixtos' : undefined
      };

    } catch (error) {
      return {
        status: 'FAIL',
        message: `Error validando pagos mixtos: ${error}`,
        details: { error: String(error) },
        issuesFound: [`Error de sistema: ${error}`],
        autoFixed: []
      };
    }
  }

  /**
   * 4. VALIDACIÓN DE GESTIÓN DE STOCK
   */
  private async validateStockManagement(): Promise<ValidationDetail> {
    console.log('📦 Validando gestión de stock...');
    const issues: string[] = [];
    const autoFixed: string[] = [];

    try {
      // Verificar productos con stock negativo
      const { data: negativeStock, error } = await supabase
        .from('products')
        .select('id, name, stock, is_by_weight')
        .eq('tenant_id', this.tenantId)
        .lt('stock', 0);

      if (error) throw error;

      // Verificar productos sin stock definido
      const { data: undefinedStock, error: undefinedError } = await supabase
        .from('products')
        .select('id, name, is_by_weight')
        .eq('tenant_id', this.tenantId)
        .is('stock', null);

      // Auto-fix stock negativo menor a -2
      for (const product of negativeStock || []) {
        if (product.stock > -2 && !product.is_by_weight) {
          try {
            const { error: updateError } = await supabase
              .from('products')
              .update({ stock: 0 })
              .eq('id', product.id)
              .eq('tenant_id', this.tenantId);
            
            if (!updateError) {
              autoFixed.push(`Auto-corregido stock negativo para: ${product.name}`);
            } else {
              issues.push(`Stock negativo crítico: ${product.name} (${product.stock})`);
            }
          } catch {
            issues.push(`Stock negativo crítico: ${product.name} (${product.stock})`);
          }
        } else if (product.stock <= -2) {
          issues.push(`CRÍTICO: Stock muy negativo para ${product.name}: ${product.stock}`);
        }
      }

      if (undefinedStock && undefinedStock.length > 0) {
        issues.push(`${undefinedStock.length} productos sin stock definido`);
      }

      const criticalStockIssues = issues.filter(i => i.includes('CRÍTICO')).length;
      const status = criticalStockIssues > 0 ? 'FAIL' : 
                    (issues.length > 0 ? 'WARNING' : 'PASS');

      return {
        status,
        message: `Stock verificado: ${negativeStock?.length || 0} negativos, ${undefinedStock?.length || 0} sin definir`,
        details: { 
          negativeCount: negativeStock?.length || 0,
          undefinedCount: undefinedStock?.length || 0,
          autoFixedCount: autoFixed.length
        },
        issuesFound: issues,
        autoFixed,
        recommendation: issues.length > 0 ? 'Actualizar stock de productos y definir stock inicial' : undefined
      };

    } catch (error) {
      return {
        status: 'FAIL',
        message: `Error validando stock: ${error}`,
        details: { error: String(error) },
        issuesFound: [`Error de sistema: ${error}`],
        autoFixed: []
      };
    }
  }

  /**
   * 5. VALIDACIÓN DE PRODUCTOS POR PESO
   */
  private async validateWeightProducts(): Promise<ValidationDetail> {
    console.log('⚖️ Validando productos por peso...');
    const issues: string[] = [];
    const autoFixed: string[] = [];

    try {
      // Obtener productos por peso
      const { data: weightProducts, error } = await supabase
        .from('products')
        .select('id, name, is_by_weight, unit, price, stock')
        .eq('tenant_id', this.tenantId)
        .eq('is_by_weight', true);

      if (error) throw error;

      let configIssues = 0;
      for (const product of weightProducts || []) {
        // Verificar configuración básica
        if (!product.unit) {
          configIssues++;
          issues.push(`${product.name}: Sin unidad definida`);
        }
        if (!product.price || product.price <= 0) {
          configIssues++;
          issues.push(`${product.name}: Precio inválido (${product.price})`);
        }
      }

      // Verificar ventas de productos por peso con cantidades sospechosas
      const { data: weightSales, error: salesError } = await supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          price,
          subtotal,
          products!inner (
            name,
            is_by_weight
          )
        `)
        .eq('tenant_id', this.tenantId)
        .eq('products.is_by_weight', true)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50);

      let salesIssues = 0;
      for (const sale of weightSales || []) {
        // Verificar cantidades extremas
        if (sale.quantity > 100) { // Más de 100kg es sospechoso
          salesIssues++;
          issues.push(`Cantidad sospechosa: ${sale.products?.name} - ${sale.quantity}kg`);
        }
        if (sale.quantity < 0.001) { // Menos de 1 gramo
          salesIssues++;
          issues.push(`Cantidad muy pequeña: ${sale.products?.name} - ${sale.quantity}kg`);
        }
        
        // Verificar cálculo de subtotal
        if (sale.subtotal && sale.price) {
          const expectedSubtotal = sale.quantity * sale.price;
          const difference = Math.abs(sale.subtotal - expectedSubtotal);
          if (difference > 0.01) {
            salesIssues++;
            issues.push(`Cálculo incorrecto en venta por peso: ${sale.products?.name} - esperado $${expectedSubtotal.toFixed(2)}, registrado $${sale.subtotal}`);
          }
        }
      }

      const totalIssues = configIssues + salesIssues;
      const status = totalIssues === 0 ? 'PASS' : 
                    (issues.some(i => i.includes('Precio inválido')) ? 'FAIL' : 'WARNING');

      return {
        status,
        message: `${weightProducts?.length || 0} productos por peso verificados, ${configIssues} config issues, ${salesIssues} sales issues`,
        details: { 
          totalWeightProducts: weightProducts?.length || 0,
          configIssues,
          salesIssues,
          totalWeightSales: weightSales?.length || 0
        },
        issuesFound: issues,
        autoFixed,
        recommendation: totalIssues > 0 ? 'Completar configuración de productos por peso y revisar ventas sospechosas' : undefined
      };

    } catch (error) {
      return {
        status: 'FAIL',
        message: `Error validando productos por peso: ${error}`,
        details: { error: String(error) },
        issuesFound: [`Error de sistema: ${error}`],
        autoFixed: []
      };
    }
  }

  /**
   * 6. VALIDACIÓN DE MANEJO DE EFECTIVO
   */
  private async validateCashManagement(): Promise<ValidationDetail> {
    console.log('💰 Validando manejo de efectivo...');
    const issues: string[] = [];
    const autoFixed: string[] = [];

    try {
      // Verificar turnos activos
      const { data: activeTurnos, error } = await supabase
        .from('turnos')
        .select('id, cajero_nombre, monto_inicial, fecha_apertura')
        .eq('tenant_id', this.tenantId)
        .eq('estado', 'abierto');

      if (error) throw error;

      if (activeTurnos && activeTurnos.length > 1) {
        issues.push(`CRÍTICO: ${activeTurnos.length} turnos activos simultáneamente`);
      } else if (activeTurnos && activeTurnos.length === 0) {
        issues.push('Advertencia: No hay turnos activos');
      }

      // Verificar transacciones de turno
      if (activeTurnos && activeTurnos.length > 0) {
        const { data: transactions, error: transError } = await supabase
          .from('turno_transacciones')
          .select('id, tipo, monto, metodo_pago')
          .eq('tenant_id', this.tenantId)
          .eq('turno_id', activeTurnos[0].id)
          .order('created_at', { ascending: false })
          .limit(50);

        let invalidTransactions = 0;
        for (const trans of transactions || []) {
          if (!trans.monto || trans.monto === 0) {
            invalidTransactions++;
          }
          if (!trans.metodo_pago) {
            invalidTransactions++;
          }
        }

        if (invalidTransactions > 0) {
          issues.push(`${invalidTransactions} transacciones de turno con datos inválidos`);
        }
      }

      // Verificar consistencia de ventas en efectivo con turno activo
      const { data: cashSales, error: cashError } = await supabase
        .from('sales')
        .select('id, total, turno_id')
        .eq('tenant_id', this.tenantId)
        .eq('payment_method', 'cash')
        .gte('date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      let salesWithoutTurno = 0;
      for (const sale of cashSales || []) {
        if (!sale.turno_id) {
          salesWithoutTurno++;
        }
      }

      if (salesWithoutTurno > 0) {
        issues.push(`${salesWithoutTurno} ventas en efectivo sin turno asociado`);
      }

      const criticalIssues = issues.filter(i => i.includes('CRÍTICO')).length;
      const status = criticalIssues > 0 ? 'FAIL' : 
                    (issues.length > 0 ? 'WARNING' : 'PASS');

      return {
        status,
        message: `${activeTurnos?.length || 0} turnos activos, ${salesWithoutTurno} ventas sin turno`,
        details: { 
          activeTurnos: activeTurnos?.length || 0,
          salesWithoutTurno,
          totalCashSales: cashSales?.length || 0
        },
        issuesFound: issues,
        autoFixed,
        recommendation: issues.length > 0 ? 'Cerrar turnos duplicados y asociar ventas con turnos' : undefined
      };

    } catch (error) {
      return {
        status: 'FAIL',
        message: `Error validando efectivo: ${error}`,
        details: { error: String(error) },
        issuesFound: [`Error de sistema: ${error}`],
        autoFixed: []
      };
    }
  }

  /**
   * 7. VALIDACIÓN DE SEPARACIÓN ENTRE TENANTS
   */
  private async validateTenantSeparation(): Promise<ValidationDetail> {
    console.log('🏢 Validando separación entre tenants...');
    const issues: string[] = [];
    const autoFixed: string[] = [];

    try {
      // Verificar que no haya datos cruzados entre tenants
      
      // 1. Verificar ventas sin tenant_id
      const { data: salesWithoutTenant, error: salesError } = await supabase
        .from('sales')
        .select('id, date')
        .is('tenant_id', null)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50);

      if (salesError) throw salesError;

      if (salesWithoutTenant && salesWithoutTenant.length > 0) {
        issues.push(`CRÍTICO: ${salesWithoutTenant.length} ventas sin tenant_id`);
      }

      // 2. Verificar productos sin tenant_id (usando user_id como fallback)
      const { data: productsWithoutTenant, error: productsError } = await supabase
        .from('products')
        .select('id, name, user_id')
        .is('tenant_id', null)
        .limit(50);

      if (productsError) throw productsError;

      if (productsWithoutTenant && productsWithoutTenant.length > 0) {
        issues.push(`${productsWithoutTenant.length} productos sin tenant_id (usando user_id como fallback)`);
      }

      // 3. Verificar sale_items sin tenant_id
      const { data: itemsWithoutTenant, error: itemsError } = await supabase
        .from('sale_items')
        .select('id, sale_id')
        .is('tenant_id', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50);

      if (itemsError) throw itemsError;

      if (itemsWithoutTenant && itemsWithoutTenant.length > 0) {
        issues.push(`CRÍTICO: ${itemsWithoutTenant.length} sale_items sin tenant_id`);
      }

      // 4. Verificar turnos sin tenant_id
      const { data: turnosWithoutTenant, error: turnosError } = await supabase
        .from('turnos')
        .select('id, cajero_nombre')
        .is('tenant_id', null)
        .limit(10);

      if (turnosError) throw turnosError;

      if (turnosWithoutTenant && turnosWithoutTenant.length > 0) {
        issues.push(`CRÍTICO: ${turnosWithoutTenant.length} turnos sin tenant_id`);
      }

      // 5. Verificar clientes sin tenant_id
      const { data: customersWithoutTenant, error: customersError } = await supabase
        .from('customers')
        .select('id, name')
        .is('tenant_id', null)
        .limit(20);

      if (customersError) throw customersError;

      if (customersWithoutTenant && customersWithoutTenant.length > 0) {
        issues.push(`${customersWithoutTenant.length} clientes sin tenant_id`);
      }

      const criticalIssues = issues.filter(i => i.includes('CRÍTICO')).length;
      const status = criticalIssues > 0 ? 'FAIL' : 
                    (issues.length > 0 ? 'WARNING' : 'PASS');

      return {
        status,
        message: `Separación de tenants verificada - ${issues.length} problemas encontrados`,
        details: { 
          salesWithoutTenant: salesWithoutTenant?.length || 0,
          productsWithoutTenant: productsWithoutTenant?.length || 0,
          itemsWithoutTenant: itemsWithoutTenant?.length || 0,
          turnosWithoutTenant: turnosWithoutTenant?.length || 0,
          customersWithoutTenant: customersWithoutTenant?.length || 0
        },
        issuesFound: issues,
        autoFixed,
        recommendation: issues.length > 0 ? 'URGENTE: Asignar tenant_id a todos los registros huérfanos' : undefined
      };

    } catch (error) {
      return {
        status: 'FAIL',
        message: `Error validando separación de tenants: ${error}`,
        details: { error: String(error) },
        issuesFound: [`Error de sistema: ${error}`],
        autoFixed: []
      };
    }
  }

  /**
   * 8. VALIDACIÓN DE INTEGRIDAD DE DATOS
   */
  private async validateDataIntegrity(): Promise<ValidationDetail> {
    console.log('🗃️ Validando integridad de datos...');
    const issues: string[] = [];
    const autoFixed: string[] = [];

    try {
      // 1. Ventas sin items
      const { data: salesWithoutItems, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          sale_items(id)
        `)
        .eq('tenant_id', this.tenantId)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      if (error) throw error;

      const emptySales = salesWithoutItems?.filter(sale => 
        !sale.sale_items || sale.sale_items.length === 0
      ) || [];

      if (emptySales.length > 0) {
        issues.push(`CRÍTICO: ${emptySales.length} ventas sin items asociados`);
      }

      // 2. Items huérfanos
      const { data: orphanItems, error: orphanError } = await supabase
        .from('sale_items')
        .select('id, product_id, sale_id')
        .eq('tenant_id', this.tenantId)
        .is('sale_id', null)
        .limit(20);

      if (orphanError) throw orphanError;

      if (orphanItems && orphanItems.length > 0) {
        issues.push(`${orphanItems.length} sale_items huérfanos (sin venta asociada)`);
      }

      // 3. Items con productos inexistentes
      const { data: itemsWithMissingProducts, error: missingError } = await supabase
        .from('sale_items')
        .select(`
          id,
          product_id,
          products(id)
        `)
        .eq('tenant_id', this.tenantId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      if (missingError) throw missingError;

      const missingProducts = itemsWithMissingProducts?.filter(item => 
        !item.products
      ) || [];

      if (missingProducts.length > 0) {
        issues.push(`${missingProducts.length} sale_items con productos inexistentes`);
      }

      // 4. Pagos mixtos sin detalles
      const { data: mixedWithoutDetails, error: mixedError } = await supabase
        .from('sales')
        .select(`
          id,
          sale_payment_methods(id)
        `)
        .eq('tenant_id', this.tenantId)
        .eq('payment_method', 'mixed')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50);

      if (mixedError) throw mixedError;

      const mixedWithoutPaymentDetails = mixedWithoutDetails?.filter(sale => 
        !sale.sale_payment_methods || sale.sale_payment_methods.length === 0
      ) || [];

      if (mixedWithoutPaymentDetails.length > 0) {
        issues.push(`CRÍTICO: ${mixedWithoutPaymentDetails.length} pagos mixtos sin detalles de método`);
      }

      const criticalIssues = issues.filter(i => i.includes('CRÍTICO')).length;
      const status = criticalIssues > 0 ? 'FAIL' : 
                    (issues.length > 0 ? 'WARNING' : 'PASS');

      return {
        status,
        message: `Integridad verificada: ${emptySales.length} ventas vacías, ${orphanItems?.length || 0} items huérfanos`,
        details: { 
          emptySales: emptySales.length,
          orphanItems: orphanItems?.length || 0,
          missingProducts: missingProducts.length,
          mixedWithoutDetails: mixedWithoutPaymentDetails.length
        },
        issuesFound: issues,
        autoFixed,
        recommendation: issues.length > 0 ? 'Limpiar datos huérfanos y completar registros faltantes' : undefined
      };

    } catch (error) {
      return {
        status: 'FAIL',
        message: `Error validando integridad: ${error}`,
        details: { error: String(error) },
        issuesFound: [`Error de sistema: ${error}`],
        autoFixed: []
      };
    }
  }

  /**
   * Compila el reporte final
   */
  private compileReport(validations: any): ComprehensiveValidationReport {
    const allStatuses = Object.values(validations).map((v: any) => v.status);
    const overallStatus = allStatuses.includes('FAIL') ? 'CRITICAL' : 
                         allStatuses.includes('WARNING') ? 'WARNING' : 'HEALTHY';

    const allIssues = Object.values(validations).flatMap((v: any) => v.issuesFound);
    const allAutoFixed = Object.values(validations).flatMap((v: any) => v.autoFixed);
    const criticalIssues = allIssues.filter(issue => typeof issue === 'string' && issue.includes('CRÍTICO'));
    
    const recommendations = Object.values(validations)
      .map((v: any) => v.recommendation)
      .filter(Boolean);

    const summary = {
      totalChecked: Object.keys(validations).length,
      errorsFound: criticalIssues.length,
      warningsFound: allIssues.length - criticalIssues.length,
      autoFixed: allAutoFixed.length
    };

    console.log(`🎯 REPORTE FINAL - Estado: ${overallStatus}`);
    console.log(`📊 Validaciones: ${summary.totalChecked} | Errores: ${summary.errorsFound} | Advertencias: ${summary.warningsFound} | Auto-corregidos: ${summary.autoFixed}`);

    return {
      timestamp: new Date().toISOString(),
      tenantId: this.tenantId!,
      overallStatus,
      validations,
      summary,
      criticalIssues,
      recommendations
    };
  }

  private createErrorReport(message: string): ComprehensiveValidationReport {
    return {
      timestamp: new Date().toISOString(),
      tenantId: this.tenantId || 'unknown',
      overallStatus: 'ERROR',
      validations: {} as any,
      summary: { totalChecked: 0, errorsFound: 1, warningsFound: 0, autoFixed: 0 },
      criticalIssues: [message],
      recommendations: ['Verificar configuración del sistema y conexión']
    };
  }
}

// Función de acceso directo
export async function runComprehensiveValidation(): Promise<ComprehensiveValidationReport> {
  const validator = new ComprehensiveSystemValidator();
  return await validator.validateEntireSystem();
}

// Singleton para uso global
export const comprehensiveValidator = new ComprehensiveSystemValidator();