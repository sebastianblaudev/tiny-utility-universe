import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import qzTrayService from '@/services/QZTrayService';
import { usePrintReceiptQZ } from '@/hooks/usePrintReceiptQZ';

const QZTrayConfig: React.FC = () => {
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { isQZConnected, initializeQZ, getPrinters } = usePrintReceiptQZ();

  useEffect(() => {
    // Cargar impresora guardada
    const savedPrinter = qzTrayService.getPrinter();
    if (savedPrinter) {
      setSelectedPrinter(savedPrinter);
    }
    
    // Intentar conectar automáticamente
    handleConnect();
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const connected = await initializeQZ();
      if (connected) {
        await loadPrinters();
        toast.success("QZ Tray conectado exitosamente");
      } else {
        toast.error("No se pudo conectar con QZ Tray");
      }
    } catch (error) {
      console.error("Error conectando QZ Tray:", error);
      toast.error("Error conectando con QZ Tray");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrinters = async () => {
    try {
      const printerList = await getPrinters();
      setPrinters(printerList);
      
      if (printerList.length === 0) {
        toast.warning("No se encontraron impresoras");
      }
    } catch (error) {
      console.error("Error cargando impresoras:", error);
      toast.error("Error cargando lista de impresoras");
    }
  };

  const handlePrinterSelect = (printerName: string) => {
    setSelectedPrinter(printerName);
    qzTrayService.setPrinter(printerName);
    toast.success(`Impresora seleccionada: ${printerName}`);
  };

  const handleTestPrint = async () => {
    if (!selectedPrinter) {
      toast.error("Seleccione una impresora primero");
      return;
    }

    try {
      const testHTML = `
        <div style="font-family: monospace; font-size: 12px; text-align: center;">
          <h3>PRUEBA DE IMPRESIÓN</h3>
          <p>Impresora: ${selectedPrinter}</p>
          <p>Fecha: ${new Date().toLocaleString()}</p>
          <p>QZ Tray - Sistema POS</p>
          <br>
          <p>Si puede leer esto, la impresora funciona correctamente.</p>
        </div>
      `;

      const success = await qzTrayService.printReceipt(testHTML, selectedPrinter);
      if (success) {
        toast.success("Prueba de impresión enviada");
      }
    } catch (error) {
      console.error("Error en prueba de impresión:", error);
      toast.error("Error en la prueba de impresión");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Configuración QZ Tray
        </CardTitle>
        <CardDescription>
          Configure la conexión con QZ Tray para impresión directa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado:</span>
          <Badge variant={isQZConnected() ? "success" : "destructive"} className="flex items-center gap-1">
            {isQZConnected() ? (
              <>
                <Wifi className="h-3 w-3" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Desconectado
              </>
            )}
          </Badge>
        </div>

        <Button 
          onClick={handleConnect} 
          disabled={isLoading}
          className="w-full"
          variant={isQZConnected() ? "outline" : "default"}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isQZConnected() ? "Reconectar" : "Conectar QZ Tray"}
        </Button>

        {isQZConnected() && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Impresora:</label>
              <Select value={selectedPrinter} onValueChange={handlePrinterSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar impresora" />
                </SelectTrigger>
                <SelectContent>
                  {printers.map((printer) => (
                    <SelectItem key={printer} value={printer}>
                      {printer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={loadPrinters} 
              variant="outline" 
              className="w-full"
              disabled={isLoading}
            >
              Actualizar Lista
            </Button>

            {selectedPrinter && (
              <Button 
                onClick={handleTestPrint} 
                variant="secondary" 
                className="w-full"
              >
                Prueba de Impresión
              </Button>
            )}
          </>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Nota:</strong> QZ Tray debe estar instalado y ejecutándose en su sistema.</p>
          {!isQZConnected() && (
            <p className="mt-1">Si QZ Tray no está disponible, se usará la impresión del navegador.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QZTrayConfig;