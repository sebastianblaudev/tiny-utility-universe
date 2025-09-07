import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { processRobustSale, robustSyncAllSales, loadRobustSalesHistory } from '@/utils/robustOfflineUtils';
import { toast } from 'sonner';
import { Wifi, WifiOff, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export const SalesRobustnessTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (result: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${result}`;
    setTestResults(prev => [formatted, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const testOfflineSale = async () => {
    setTesting(true);
    try {
      const testSale = {
        total: 1500,
        paymentMethod: 'cash',
        items: [
          { product_id: 'test-product', quantity: 1, price: 1500, subtotal: 1500 }
        ],
        saleType: 'Test Sale',
        cashierName: 'Test Cashier'
      };

      const result = await processRobustSale(testSale);
      
      if (result.success) {
        addResult(`✅ Sale processed successfully: ${result.saleId}`, 'success');
        toast.success('Venta de prueba exitosa');
      } else {
        addResult(`❌ Sale failed unexpectedly`, 'warning');
        toast.error('Venta falló');
      }
    } catch (error) {
      addResult(`🔥 Critical error: ${error}`, 'warning');
      toast.error('Error crítico en venta');
    }
    setTesting(false);
  };

  const testSalesHistory = async () => {
    setTesting(true);
    try {
      const history = await loadRobustSalesHistory();
      addResult(`📊 Loaded ${history.length} sales from history`, 'success');
      toast.success(`Historial cargado: ${history.length} ventas`);
    } catch (error) {
      addResult(`📊 History error: ${error}`, 'warning');
      toast.error('Error al cargar historial');
    }
    setTesting(false);
  };

  const testSyncQueue = async () => {
    setTesting(true);
    try {
      const result = await robustSyncAllSales();
      addResult(`🔄 Sync complete: ${result.synced} synced, ${result.failed} failed`, 'success');
      toast.success(`Sincronización: ${result.synced} exitosas`);
    } catch (error) {
      addResult(`🔄 Sync error: ${error}`, 'warning');
      toast.error('Error en sincronización');
    }
    setTesting(false);
  };

  const simulateOfflineMode = () => {
    if (navigator.onLine) {
      addResult('🌐 Currently ONLINE - test offline mode by disabling network', 'info');
      toast.info('Desactiva la red para probar modo offline');
    } else {
      addResult('📡 Currently OFFLINE - perfect for testing!', 'success');
      toast.success('Modo offline activo - perfecto para pruebas');
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Robustez de Ventas - Verificación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          {navigator.onLine ? (
            <Badge variant="default" className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              ONLINE
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              OFFLINE
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date().toLocaleString()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={testOfflineSale} 
            disabled={testing}
            variant="outline"
          >
            🛒 Probar Venta
          </Button>
          
          <Button 
            onClick={testSalesHistory} 
            disabled={testing}
            variant="outline"
          >
            📊 Probar Historial
          </Button>
          
          <Button 
            onClick={testSyncQueue} 
            disabled={testing}
            variant="outline"
          >
            🔄 Sincronizar Cola
          </Button>
          
          <Button 
            onClick={simulateOfflineMode} 
            disabled={testing}
            variant="outline"
          >
            📡 Verificar Estado
          </Button>
        </div>

        <div className="mt-6">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Resultados de Pruebas:
          </h4>
          <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay pruebas ejecutadas aún...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1 text-gray-700">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 rounded-lg">
          <strong>Sistema Ultra-Robusto:</strong>
          <ul className="mt-1 space-y-1">
            <li>• ✅ Ventas se guardan SIEMPRE (offline primero)</li>
            <li>• ✅ Funciona sin internet o con fecha errónea</li>
            <li>• ✅ Múltiples respaldos (IndexedDB + localStorage)</li>
            <li>• ✅ Sincronización automática en background</li>
            <li>• ✅ Historial accesible offline</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};