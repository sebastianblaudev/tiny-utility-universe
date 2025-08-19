
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from '@/lib/utils';
import { getTurnoSalesByPaymentMethod } from '@/utils/turnosUtils';
import { Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface ZReportModalProps {
  open: boolean;
  onClose: () => void;
  turnoId: string;
  turnoData: any;
}

interface SalesDataType {
  [key: string]: {
    count: number;
    total: number;
    cashiers?: Record<string, number>;
  };
}

const ZReportModal = ({ open, onClose, turnoId, turnoData }: ZReportModalProps) => {
  const [salesData, setSalesData] = useState<SalesDataType>({});
  const [loading, setLoading] = useState(true);
  const printRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (open && turnoId) {
      loadSalesData();
    }
  }, [open, turnoId]);
  
  const loadSalesData = async () => {
    setLoading(true);
    try {
      const data = await getTurnoSalesByPaymentMethod(turnoId);
      
      // Transform data to match expected format
      const transformed: SalesDataType = {};
      
      if (data && typeof data === 'object') {
        // Handle the case where data is an object with totalSales and byPaymentMethod
        if ('totalSales' in data && 'byPaymentMethod' in data) {
          Object.entries(data.byPaymentMethod).forEach(([method, amount]) => {
            transformed[method] = {
              total: Number(amount),
              count: 0 // We don't have count in this format
            };
          });
        } else {
          // Handle the case where data is already in the SalesDataType format
          Object.assign(transformed, data);
        }
      }
      
      setSalesData(transformed);
    } catch (error) {
      console.error("Error loading sales data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrint = useReactToPrint({
    documentTitle: `Z-Report-Turno-${turnoId}`,
    onAfterPrint: () => console.log('Printing complete!'),
  });
  
  const totalSales = Object.values(salesData).reduce((sum, method) => sum + method.total, 0);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Z Reporte - Turno #{turnoId}
          </DialogTitle>
        </DialogHeader>
        
        {turnoData && (
          <div className="mb-4">
            <p>Cajero: {turnoData.cajero_nombre}</p>
            <p>Apertura: {new Date(turnoData.fecha_apertura).toLocaleString()}</p>
            {turnoData.fecha_cierre && (
              <p>Cierre: {new Date(turnoData.fecha_cierre).toLocaleString()}</p>
            )}
          </div>
        )}
        
        <Separator className="mb-4" />
        
        <div ref={printRef} className="py-4">
          {loading ? (
            <p className="text-center">Cargando datos...</p>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">
                Ventas por Método de Pago
              </h3>
              
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Método de Pago</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(salesData).map(([method, data]) => (
                    <tr key={method}>
                      <td>{method}</td>
                      <td className="text-right">{formatCurrency(data.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-semibold">
                <span>Total de Ventas:</span>
                <span>{formatCurrency(totalSales)}</span>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} className="mr-2">
            Cerrar
          </Button>
          <Button type="button" onClick={() => handlePrint && printRef.current ? handlePrint() : null} disabled={loading}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ZReportModal;
