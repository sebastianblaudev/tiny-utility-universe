import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, TestTube, CheckCircle } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { usePOSOffline } from '@/hooks/usePOSOffline';
import { toast } from 'sonner';

const OfflineTestButton: React.FC = () => {
  const { isOnline, queuedSalesCount } = useOffline();
  const { processOfflineSale } = usePOSOffline();
  const [testingOffline, setTestingOffline] = useState(false);

  const testOfflineSale = async () => {
    setTestingOffline(true);
    
    try {
      const testSaleData = {
        total: 1500,
        paymentMethod: 'cash',
        customerId: null,
        saleType: 'Normal',
        cashierName: 'Test Cajero',
        items: [
          {
            product_id: 'test-product-1',
            quantity: 1,
            price: 1500,
            subtotal: 1500,
            product: {
              stock: 10
            }
          }
        ]
      };

      const success = await processOfflineSale(testSaleData);
      
      if (success) {
        toast.success('Venta de prueba offline exitosa!');
      } else {
        toast.error('Error en venta de prueba offline');
      }
    } catch (error) {
      console.error('Error testing offline sale:', error);
      toast.error('Error al probar venta offline');
    } finally {
      setTestingOffline(false);
    }
  };

  const simulateOfflineMode = () => {
    // Esta función ayuda a simular estar offline para pruebas
    if (navigator.onLine) {
      toast.info('Para probar modo offline, desconecta tu internet y prueba hacer una venta en el POS');
    } else {
      toast.success('Ya estás en modo offline! Ve al POS y prueba hacer una venta');
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Pruebas de Funcionalidad Offline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">
              Estado: {isOnline ? 'Conectado' : 'Sin conexión'}
            </span>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {queuedSalesCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
            <CheckCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-800">
              {queuedSalesCount} ventas pendientes de sincronizar
            </span>
          </div>
        )}

        <div className="space-y-2">
          <Button 
            onClick={testOfflineSale}
            disabled={testingOffline}
            variant="outline"
            className="w-full"
          >
            {testingOffline ? 'Probando...' : 'Probar Venta Offline'}
          </Button>
          
          <Button 
            onClick={simulateOfflineMode}
            variant="secondary"
            className="w-full"
          >
            Simular Modo Offline
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>
            • El botón "Probar Venta Offline" simula una venta sin importar el estado de conexión
          </p>
          <p>
            • Para pruebas reales, desconecta internet y haz ventas en el POS
          </p>
          <p>
            • Las ventas offline se sincronizarán automáticamente al restaurar conexión
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineTestButton;