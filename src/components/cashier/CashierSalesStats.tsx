import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentCashier, getCurrentCashierSalesTotals } from '@/utils/turnosUtils';
import { Badge } from '@/components/ui/badge';
import { DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface CashierSalesStatsProps {
  autoRefresh?: boolean;
}

const CashierSalesStats = ({ autoRefresh = false }: CashierSalesStatsProps) => {
  const [cashierData, setCashierData] = useState<ReturnType<typeof getCurrentCashier>>(null);
  const [salesData, setSalesData] = useState<{
    totalSales: number;
    byPaymentMethod: Record<string, number>;
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
  }, [autoRefresh]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const cashier = getCurrentCashier();
      setCashierData(cashier);
      
      if (cashier) {
        const totals = await getCurrentCashierSalesTotals();
        setSalesData(totals);
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
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Por Método de Pago</h4>
            <div className="space-y-2">
              {Object.keys(salesData.byPaymentMethod).length > 0 ? (
                Object.entries(salesData.byPaymentMethod).map(([method, amount]) => (
                  <div key={method} className="flex justify-between items-center p-2 border-b">
                    <span className="text-sm">{translatePaymentMethod(method)}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No hay ventas registradas
                </p>
              )}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
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
          Actualizar Datos
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CashierSalesStats;
