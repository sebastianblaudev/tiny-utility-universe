/**
 * HERRAMIENTA DE DIAGNÓSTICO PARA RECONCILIACIÓN DE EFECTIVO
 * Detecta y reporta duplicaciones, inconsistencias y problemas en cálculos de efectivo
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserTenantId } from '@/lib/supabase-helpers';

export interface CashDiagnosticReport {
  timestamp: string;
  tenantId: string;
  summary: {
    totalCashSales: number;
    directCashSales: number;
    mixedCashSales: number;
    possibleDuplicates: number;
    reconciliationErrors: number;
  };
  issues: CashIssue[];
  recommendations: string[];
}

export interface CashIssue {
  type: 'DUPLICATE' | 'RECONCILIATION' | 'CALCULATION' | 'DATA_INTEGRITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  details: any;
  suggestedFix?: string;
}

export class CashReconciliationDiagnostic {
  private tenantId: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      this.tenantId = await getCurrentUserTenantId();
      return this.tenantId !== null;
    } catch (error) {
      console.error('❌ Error initializing cash diagnostic:', error);
      return false;
    }
  }

  /**
   * DIAGNÓSTICO COMPLETO DE EFECTIVO
   */
  async runCompleteDiagnostic(dateFrom?: string, dateTo?: string): Promise<CashDiagnosticReport> {
    console.log('🔍 Iniciando diagnóstico completo de efectivo...');

    if (!await this.initialize()) {
      throw new Error('No se pudo inicializar el diagnóstico');
    }

    const from = dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const to = dateTo || new Date().toISOString();

    const issues: CashIssue[] = [];

    // 1. Detectar ventas duplicadas
    const duplicateIssues = await this.detectDuplicateCashSales(from, to);
    issues.push(...duplicateIssues);

    // 2. Verificar reconciliación de turnos
    const reconciliationIssues = await this.checkTurnoReconciliation(from, to);
    issues.push(...reconciliationIssues);

    // 3. Validar cálculos de efectivo por cajero
    const calculationIssues = await this.validateCashierCalculations(from, to);
    issues.push(...calculationIssues);

    // 4. Verificar integridad de datos
    const integrityIssues = await this.checkDataIntegrity(from, to);
    issues.push(...integrityIssues);

    const summary = await this.generateSummary(from, to, issues);
    const recommendations = this.generateRecommendations(issues);

    return {
      timestamp: new Date().toISOString(),
      tenantId: this.tenantId!,
      summary,
      issues,
      recommendations
    };
  }

  /**
   * Detectar ventas de efectivo duplicadas
   */
  private async detectDuplicateCashSales(from: string, to: string): Promise<CashIssue[]> {
    const issues: CashIssue[] = [];

    try {
      // Buscar ventas que aparezcan tanto como directas como en pagos mixtos
      const { data: possibleDuplicates, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          payment_method,
          cashier_name,
          date,
          sale_payment_methods (
            payment_method,
            amount
          )
        `)
        .eq('tenant_id', this.tenantId)
        .gte('date', from)
        .lte('date', to)
        .or('payment_method.eq.cash,payment_method.eq.mixed');

      if (error) throw error;

      const duplicateMap = new Map<string, any[]>();

      possibleDuplicates?.forEach(sale => {
        const key = `${sale.cashier_name}-${sale.total}-${sale.date.split('T')[0]}`;
        if (!duplicateMap.has(key)) {
          duplicateMap.set(key, []);
        }
        duplicateMap.get(key)!.push(sale);
      });

      // Identificar posibles duplicados
      duplicateMap.forEach((sales, key) => {
        if (sales.length > 1) {
          const directCash = sales.filter(s => s.payment_method === 'cash');
          const mixedWithCash = sales.filter(s => 
            s.payment_method === 'mixed' && 
            s.sale_payment_methods?.some((pm: any) => pm.payment_method === 'cash')
          );

          if (directCash.length > 0 && mixedWithCash.length > 0) {
            issues.push({
              type: 'DUPLICATE',
              severity: 'HIGH',
              description: `Posible duplicación de venta en efectivo: $${sales[0].total}`,
              details: {
                cashierName: sales[0].cashier_name,
                amount: sales[0].total,
                date: sales[0].date,
                directSales: directCash.length,
                mixedSales: mixedWithCash.length,
                salesIds: sales.map(s => s.id)
              },
              suggestedFix: 'Revisar manualmente si son la misma venta registrada dos veces'
            });
          }
        }
      });

    } catch (error) {
      issues.push({
        type: 'DATA_INTEGRITY',
        severity: 'CRITICAL',
        description: `Error detectando duplicados: ${error}`,
        details: { error: String(error) }
      });
    }

    return issues;
  }

  /**
   * Verificar reconciliación de turnos
   */
  private async checkTurnoReconciliation(from: string, to: string): Promise<CashIssue[]> {
    const issues: CashIssue[] = [];

    try {
      const { data: turnos, error } = await supabase
        .from('turnos')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .gte('fecha_apertura', from)
        .lte('fecha_apertura', to);

      if (error) throw error;

      for (const turno of turnos || []) {
        // Calcular efectivo esperado usando función existente
        const { data: turnoSales, error: calcError } = await supabase
          .rpc('get_turno_sales_by_payment_method_detailed', {
            turno_id_param: turno.id
          });

        if (!calcError && turnoSales) {
          const cashSales = turnoSales?.find((item: any) => item.payment_method === 'cash');
          const expected = Number(cashSales?.total || 0) + Number(turno.monto_inicial || 0);
          const actual = Number(turno.monto_final || 0);
          const difference = Math.abs(expected - actual);

          if (difference > 1) { // Tolerancia de $1
            issues.push({
              type: 'RECONCILIATION',
              severity: difference > 50 ? 'HIGH' : 'MEDIUM',
              description: `Descuadre en turno ${turno.id.substring(0, 8)}: $${difference.toFixed(2)}`,
              details: {
                turnoId: turno.id,
                cajeroNombre: turno.cajero_nombre,
                expectedCash: expected,
                actualCash: actual,
                difference: difference,
                fechaApertura: turno.fecha_apertura
              },
              suggestedFix: 'Verificar cálculos de efectivo y registrar diferencia correctamente'
            });
          }
        }
      }

    } catch (error) {
      issues.push({
        type: 'RECONCILIATION',
        severity: 'CRITICAL',
        description: `Error verificando reconciliación: ${error}`,
        details: { error: String(error) }
      });
    }

    return issues;
  }

  /**
   * Validar cálculos de efectivo por cajero
   */
  private async validateCashierCalculations(from: string, to: string): Promise<CashIssue[]> {
    const issues: CashIssue[] = [];

    try {
      // Obtener lista de cajeros únicos en el período
      const { data: cashiers, error } = await supabase
        .from('sales')
        .select('cashier_name')
        .eq('tenant_id', this.tenantId)
        .gte('date', from)
        .lte('date', to)
        .not('cashier_name', 'is', null);

      if (error) throw error;

      const uniqueCashiers = [...new Set(cashiers?.map(c => c.cashier_name))];

      for (const cashierName of uniqueCashiers) {
        // Calcular totales directos
        const { data: directCash, error: directError } = await supabase
          .from('sales')
          .select('total')
          .eq('tenant_id', this.tenantId)
          .eq('cashier_name', cashierName)
          .eq('payment_method', 'cash')
          .eq('status', 'completed')
          .gte('date', from)
          .lte('date', to);

        // Calcular totales de efectivo en pagos mixtos
        const { data: mixedCash, error: mixedError } = await supabase
          .from('sale_payment_methods')
          .select('amount, sales!inner(cashier_name, date, status)')
          .eq('tenant_id', this.tenantId)
          .eq('payment_method', 'cash')
          .eq('sales.cashier_name', cashierName)
          .eq('sales.status', 'completed')
          .gte('sales.date', from)
          .lte('sales.date', to);

        if (!directError && !mixedError) {
          const directTotal = directCash?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
          const mixedTotal = mixedCash?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
          const totalCash = directTotal + mixedTotal;

          // Verificar usando función existente de DB si está disponible
          const { data: dbSummary, error: dbError } = await supabase
            .rpc('get_cashier_sales_summary', {
              cashier_name_param: cashierName,
              tenant_id_param: this.tenantId
            });

          if (!dbError && dbSummary && Array.isArray(dbSummary)) {
            const cashSummary = dbSummary.find((item: any) => item.payment_method === 'cash');
            const dbTotalValue = Number(cashSummary?.total_amount || 0);
            const difference = Math.abs(totalCash - dbTotalValue);

            if (difference > 0.01) {
              issues.push({
                type: 'CALCULATION',
                severity: difference > 10 ? 'HIGH' : 'MEDIUM',
                description: `Inconsistencia en cálculo de efectivo para ${cashierName}`,
                details: {
                  cashierName,
                  manualCalculation: totalCash,
                  dbCalculation: dbTotalValue,
                  difference: difference,
                  directCash: directTotal,
                  mixedCash: mixedTotal
                },
                suggestedFix: 'Revisar lógica de cálculo de efectivo y eliminar duplicaciones'
              });
            }
          }
        }
      }

    } catch (error) {
      issues.push({
        type: 'CALCULATION',
        severity: 'CRITICAL',
        description: `Error validando cálculos de cajero: ${error}`,
        details: { error: String(error) }
      });
    }

    return issues;
  }

  /**
   * Verificar integridad de datos
   */
  private async checkDataIntegrity(from: string, to: string): Promise<CashIssue[]> {
    const issues: CashIssue[] = [];

    try {
      // Verificar ventas mixtas sin detalles de pago
      const { data: mixedWithoutDetails, error: mixedError } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          sale_payment_methods (id)
        `)
        .eq('tenant_id', this.tenantId)
        .eq('payment_method', 'mixed')
        .gte('date', from)
        .lte('date', to);

      if (!mixedError) {
        const orphanedMixed = mixedWithoutDetails?.filter(sale => 
          !sale.sale_payment_methods || sale.sale_payment_methods.length === 0
        ) || [];

        if (orphanedMixed.length > 0) {
          issues.push({
            type: 'DATA_INTEGRITY',
            severity: 'HIGH',
            description: `${orphanedMixed.length} ventas mixtas sin detalles de pago`,
            details: {
              count: orphanedMixed.length,
              salesIds: orphanedMixed.map(s => s.id)
            },
            suggestedFix: 'Completar detalles de pago o cambiar método de pago'
          });
        }
      }

      // Verificar pagos mixtos huérfanos
      const { data: orphanedPayments, error: orphanError } = await supabase
        .from('sale_payment_methods')
        .select(`
          id,
          sale_id,
          sales!inner(payment_method)
        `)
        .eq('tenant_id', this.tenantId)
        .neq('sales.payment_method', 'mixed');

      if (!orphanError && orphanedPayments && orphanedPayments.length > 0) {
        issues.push({
          type: 'DATA_INTEGRITY',
          severity: 'MEDIUM',
          description: `${orphanedPayments.length} detalles de pago en ventas no mixtas`,
          details: {
            count: orphanedPayments.length,
            paymentIds: orphanedPayments.map(p => p.id)
          },
          suggestedFix: 'Limpiar detalles de pago innecesarios'
        });
      }

    } catch (error) {
      issues.push({
        type: 'DATA_INTEGRITY',
        severity: 'CRITICAL',
        description: `Error verificando integridad: ${error}`,
        details: { error: String(error) }
      });
    }

    return issues;
  }

  /**
   * Generar resumen del diagnóstico
   */
  private async generateSummary(from: string, to: string, issues: CashIssue[]): Promise<any> {
    try {
      const { data: directCash, error: directError } = await supabase
        .from('sales')
        .select('total')
        .eq('tenant_id', this.tenantId)
        .eq('payment_method', 'cash')
        .eq('status', 'completed')
        .gte('date', from)
        .lte('date', to);

      const { data: mixedCash, error: mixedError } = await supabase
        .from('sale_payment_methods')
        .select('amount, sales!inner(date, status)')
        .eq('tenant_id', this.tenantId)
        .eq('payment_method', 'cash')
        .eq('sales.status', 'completed')
        .gte('sales.date', from)
        .lte('sales.date', to);

      const directTotal = directCash?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const mixedTotal = mixedCash?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      return {
        totalCashSales: directTotal + mixedTotal,
        directCashSales: directTotal,
        mixedCashSales: mixedTotal,
        possibleDuplicates: issues.filter(i => i.type === 'DUPLICATE').length,
        reconciliationErrors: issues.filter(i => i.type === 'RECONCILIATION').length
      };

    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        totalCashSales: 0,
        directCashSales: 0,
        mixedCashSales: 0,
        possibleDuplicates: 0,
        reconciliationErrors: 0
      };
    }
  }

  /**
   * Generar recomendaciones basadas en los problemas encontrados
   */
  private generateRecommendations(issues: CashIssue[]): string[] {
    const recommendations: string[] = [];

    const duplicates = issues.filter(i => i.type === 'DUPLICATE').length;
    const reconciliation = issues.filter(i => i.type === 'RECONCILIATION').length;
    const calculation = issues.filter(i => i.type === 'CALCULATION').length;
    const integrity = issues.filter(i => i.type === 'DATA_INTEGRITY').length;

    if (duplicates > 0) {
      recommendations.push('🔍 Implementar controles para evitar duplicación de ventas en efectivo');
      recommendations.push('📋 Revisar proceso de registro de ventas mixtas vs directas');
    }

    if (reconciliation > 0) {
      recommendations.push('💰 Mejorar proceso de reconciliación de efectivo en turnos');
      recommendations.push('📊 Verificar cálculos automáticos de efectivo esperado');
    }

    if (calculation > 0) {
      recommendations.push('🧮 Revisar y optimizar funciones de cálculo de totales por cajero');
      recommendations.push('🔧 Implementar validaciones en tiempo real para cálculos');
    }

    if (integrity > 0) {
      recommendations.push('🗃️ Limpiar datos inconsistentes en la base de datos');
      recommendations.push('🛡️ Añadir validaciones de integridad en el sistema');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ El sistema de efectivo está funcionando correctamente');
    }

    return recommendations;
  }
}

// Función de conveniencia para ejecutar el diagnóstico
export const runCashDiagnostic = async (dateFrom?: string, dateTo?: string): Promise<CashDiagnosticReport> => {
  const diagnostic = new CashReconciliationDiagnostic();
  return await diagnostic.runCompleteDiagnostic(dateFrom, dateTo);
};