
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, DollarSign, ArrowUpDown, Smartphone, AlertCircle } from 'lucide-react';

interface CajeroVentasProps {
  ventas: {
    totalSales: number;
    byPaymentMethod: Record<string, number>;
  };
  cajeroNombre: string;
}

const CajeroVentas = ({ ventas, cajeroNombre }: CajeroVentasProps) => {
  // Función para determinar icono y color según el método de pago
  const getPaymentMethodDetails = (method: string) => {
    const normalizedMethod = method.toLowerCase();
    
    switch (normalizedMethod) {
      case 'efectivo':
      case 'cash':
        return { 
          icon: <DollarSign className="h-4 w-4" />, 
          color: 'text-green-600',
          name: 'Efectivo'
        };
      case 'tarjeta':
      case 'card':
        return { 
          icon: <CreditCard className="h-4 w-4" />, 
          color: 'text-blue-600',
          name: 'Tarjeta'
        };
      case 'transferencia':
      case 'transfer':
        return { 
          icon: <ArrowUpDown className="h-4 w-4" />, 
          color: 'text-purple-600',
          name: 'Transferencia'
        };
      case 'venta':
      case 'sale':
        return { 
          icon: <Smartphone className="h-4 w-4" />, 
          color: 'text-orange-600',
          name: 'Venta'
        };
      default:
        return { 
          icon: <DollarSign className="h-4 w-4" />, 
          color: 'text-gray-600',
          name: method
        };
    }
  };

  // Verificar si hay ventas
  const hasNoSales = ventas.totalSales === 0 && Object.keys(ventas.byPaymentMethod).length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas del turno</CardTitle>
        <CardDescription>
          Resumen de ventas para {cajeroNombre || 'cajero'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Total de ventas */}
          <div className="flex justify-between items-center p-4 bg-muted/30 rounded-md">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Ventas</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(ventas.totalSales)}</p>
            </div>
          </div>

          {/* Desglose por método de pago */}
          <div className="grid gap-3">
            <h3 className="text-sm font-medium mb-1">Desglose por método de pago</h3>
            
            {!hasNoSales ? (
              Object.entries(ventas.byPaymentMethod).map(([method, amount]) => {
                const { icon, color, name } = getPaymentMethodDetails(method);
                
                return (
                  <div 
                    key={method} 
                    className="flex justify-between items-center p-3 border rounded-md"
                  >
                    <div className="flex items-center">
                      <div className={`${color} bg-muted rounded-full p-1.5 mr-3`}>
                        {icon}
                      </div>
                      <span className="font-medium">{name}</span>
                    </div>
                    <span className="font-bold">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 flex flex-col items-center justify-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 text-orange-500" />
                <p>No hay ventas registradas en este turno</p>
                <p className="text-sm mt-2">
                  Realiza ventas desde el POS para ver el desglose
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CajeroVentas;
