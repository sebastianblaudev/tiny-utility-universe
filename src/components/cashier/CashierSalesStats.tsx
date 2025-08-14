
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentCashier } from '@/utils/turnosUtils';
import { getSalesByPaymentMethod } from '@/utils/salesUtils';
import { Badge } from '@/components/ui/badge';
import { DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface CashierSalesStatsProps {
  autoRefresh?: boolean;
}

const CashierSalesStats = ({ autoRefresh = false }: CashierSalesStatsProps) => {
  const { tenantId } = useAuth();
  const [cashierData, setCashierData] = useState<ReturnType<typeof getCurrentCashier>>(null);
  const [salesData, setSalesData] = useState<{
    totalSales: number;
    byPaymentMethod: Record<string, { total: number; count: number }>;
  }>({
    totalSales: 0,
    byPaymentMethod: {}
  });
  const [loading, setLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
    
    // Set up auto-refresh if enabled
    let interval: number | undefined;
    if (autoRefresh) {
      interval = window.setInterval(loadData, 60000); // Refresh every minute
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, tenantId]);
  
  const loadData = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      console.log('Loading cashier sales data for tenant:', tenantId);
      const cashier = getCurrentCashier();
      setCashierData(cashier);
      
      if (cashier) {
        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
        
        console.log('Fetching payment method data for date range:', startOfDay, 'to', endOfDay);
        
        // Use the updated function that properly handles mixed payments
        const paymentMethodData = await getSalesByPaymentMethod(tenantId, startOfDay, endOfDay);
        
        console.log('Payment method data received (should show mixed payments distributed):', paymentMethodData);
        
        // Calculate total sales from all payment methods (this will be the true total with mixed payments distributed)
        let totalSales = 0;
        Object.values(paymentMethodData).forEach(data => {
          totalSales += data.total;
        });
        
        console.log('Total sales calculated from distributed payment methods:', totalSales);
        console.log('Payment methods breakdown with mixed payments distributed:', paymentMethodData);
        
        setSalesData({
          totalSales,
          byPaymentMethod: paymentMethodData
        });
      }
    } catch (error) {
      console.error("Error loading cashier sales data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to translate payment methods
  const translatePaymentMethod = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'Efectivo';
      case 'efectivo': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'tarjeta': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'transferencia': return 'Transferencia';
      case 'mixed': return 'Pago Mixto';
      default: return method;
    }
  };
  
  if (!cashierData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de Ventas</CardTitle>
          <CardDescription>No hay turno activo</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No hay un cajero con turno activo en este momento.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Estadísticas de Ventas</CardTitle>
            <CardDescription>
              Cajero: {cashierData.name}
            </CardDescription>
          </div>
          <Badge variant="outline">
            Turno Activo
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total de Ventas</p>
              <p className="text-2xl font-bold">{formatCurrency(salesData.totalSales)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Incluye distribución de pagos mixtos
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Por Método de Pago</h4>
            <div className="space-y-2">
              {Object.keys(salesData.byPaymentMethod).length > 0 ? (
                Object.entries(salesData.byPaymentMethod).map(([method, data]) => (
                  <div key={method} className="flex justify-between items-center p-3 border border-border rounded-lg bg-card">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{translatePaymentMethod(method)}</span>
                      <span className="text-xs text-muted-foreground">
                        {data.count} transacción{data.count !== 1 ? 'es' : ''}
                      </span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(data.total)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                  No hay ventas registradas hoy
                </p>
              )}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Turno iniciado: {new Date(cashierData.startTime).toLocaleString()}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Actualizando...' : 'Actualizar Datos'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CashierSalesStats;
