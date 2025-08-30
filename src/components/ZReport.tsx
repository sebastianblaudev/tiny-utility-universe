
import React, { useRef } from 'react';
import { formatCurrency } from '@/utils/currencyFormat';
import { getBusinessInfoForReceipt, BusinessInfo } from '@/utils/ticketUtils';

export interface ZReportData {
  cajaId: string;
  openDate: string;
  closeDate: string;
  initialAmount: number;
  finalAmount: number;
  cashierName: string;
  transactions: {
    [paymentMethod: string]: {
      count: number;
      total: number;
      cashiers?: Record<string, number>;
    }
  };
  totalTransactions: number;
  totalSales: number;
  observations?: string;
  isTurnoReport?: boolean;
}

interface ZReportProps {
  data: ZReportData;
  onPrint: () => void;
}

const ZReport: React.FC<ZReportProps> = ({ data, onPrint }) => {
  const [businessInfo, setBusinessInfo] = React.useState<BusinessInfo>({
    businessName: '',
    address: '',
    phone: '',
    receiptFooter: 'Gracias por su compra',
    currency: 'CLP',
  });
  const reportRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        const info = await getBusinessInfoForReceipt();
        setBusinessInfo(info);
      } catch (error) {
        console.error("Error loading business info for Z-report:", error);
      }
    };
    
    loadBusinessInfo();
  }, []);

  // Format dates for display
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL') + ' ' + date.toLocaleTimeString('es-CL');
  };

  const handlePrint = () => {
    // Call onPrint callback from parent
    onPrint();
    
    // Create a specific print style that targets only this report
    const printId = `zReport-${data.cajaId}`.replace(/[^a-zA-Z0-9]/g, '-');
    const reportElement = reportRef.current;
    if (!reportElement) {
      console.error("Report element not found");
      return;
    }
    
    reportElement.id = printId;
    
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #${printId}, #${printId} * {
          visibility: visible;
        }
        #${printId} {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: auto;
          overflow: visible;
          padding: 10mm !important; /* Add padding around the entire report */
        }
        @page {
          size: 80mm auto;
          margin: 5mm; /* Reduced margin for more content space */
        }
        /* Ensure all text is visible and centered */
        #${printId} * {
          overflow: visible !important;
          white-space: normal !important;
          text-align: center !important;
        }
        /* Make the report more compact */
        #${printId} .report-section {
          margin-bottom: 6mm !important;
        }
        /* Ensure the table is centered and fits well */
        #${printId} table {
          width: 100% !important;
          margin: 0 auto !important;
          border-collapse: collapse !important;
        }
        /* Optimize table cell spacing */
        #${printId} table td, #${printId} table th {
          padding: 3px !important;
          text-align: center !important;
        }
        /* Make sure the font size is readable but compact */
        #${printId} {
          font-size: 10px !important;
        }
        /* Optimize headers */
        #${printId} h4 {
          font-size: 11px !important;
          margin-bottom: 4px !important;
          text-align: center !important;
        }
        /* Make all grid content centered */
        #${printId} .grid-cols-2 > * {
          text-align: center !important;
          justify-content: center !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Trigger the print
    setTimeout(() => {
      window.print();
      
      // Clean up the style after printing
      setTimeout(() => {
        document.head.removeChild(style);
      }, 1000);
    }, 200);
  };

  return (
    <div className="flex flex-col">
      <div 
        ref={reportRef}
        className="font-mono text-sm bg-white text-black w-full max-w-[400px] mx-auto p-8 print:p-6 print:max-w-full text-center"
      >
        {/* Header with Business Info */}
        <div className="text-center mb-6 border-b pb-4 report-section">
          <h2 className="font-bold text-lg uppercase">{businessInfo.businessName}</h2>
          <p className="text-xs mt-2">{businessInfo.address}</p>
          <p className="text-xs mt-2">Tel: {businessInfo.phone}</p>
          <div className="mt-4">
            <h3 className="font-bold text-lg">{data.isTurnoReport ? "INFORME DE TURNO" : "INFORME Z"}</h3>
            <p className="font-normal text-xs mt-2">
              {data.isTurnoReport ? `Turno #${data.cajaId.substring(0, 8)}` : `Cierre de Caja #${data.cajaId.substring(0, 8)}`}
            </p>
          </div>
        </div>
        
        {/* Cash Register Info - Using flex with center alignment instead of grid */}
        <div className="mb-6 text-xs report-section">
          <div className="flex flex-col items-center mb-3">
            <p className="font-bold">Apertura: {formatDateDisplay(data.openDate)}</p>
          </div>
          <div className="flex flex-col items-center mb-3">
            <p className="font-bold">Cierre: {formatDateDisplay(data.closeDate)}</p>
          </div>
          <div className="flex flex-col items-center mb-3">
            <p className="font-bold">Cajero: {data.cashierName}</p>
          </div>
        </div>
        
        {!data.isTurnoReport && (
          <div className="mb-6 border-t border-b py-4 report-section">
            <h4 className="font-bold text-center mb-4">RESUMEN DE OPERACIONES</h4>
            <div className="flex flex-col items-center text-xs mb-3">
              <p className="font-bold">Saldo Inicial: {formatCurrency(data.initialAmount)}</p>
            </div>
            <div className="flex flex-col items-center text-xs mb-3">
              <p className="font-bold">Saldo Final: {formatCurrency(data.finalAmount)}</p>
            </div>
            <div className="flex flex-col items-center text-xs font-bold">
              <p>Diferencia: {formatCurrency(data.finalAmount - data.initialAmount)}</p>
            </div>
          </div>
        )}
        
        {/* Sales by Payment Method */}
        <div className="mb-6 report-section">
          <h4 className="font-bold text-center mb-4">VENTAS POR MÉTODO DE PAGO</h4>
          <table className="w-full text-xs mx-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">Método</th>
                <th className="text-right pb-2">Cant.</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.transactions).map(([method, info]) => (
                <tr key={method} className="border-b">
                  <td className="py-2 capitalize">{method === 'cash' ? 'efectivo' : method === 'card' ? 'tarjeta' : method === 'transfer' ? 'transferencia' : method}</td>
                  <td className="py-2 text-right">{info.count}</td>
                  <td className="py-2 text-right">{formatCurrency(info.total)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="pt-2">TOTAL</td>
                <td className="pt-2 text-right">{data.totalTransactions}</td>
                <td className="pt-2 text-right">{formatCurrency(data.totalSales)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Cashier Sale Details */}
        {Object.values(data.transactions).some(t => t.cashiers && Object.keys(t.cashiers).length > 0) && (
          <div className="mb-6 report-section">
            <h4 className="font-bold text-center mb-4">DETALLE POR CAJERO</h4>
            <table className="w-full text-xs mx-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">Método</th>
                  <th className="text-left pb-2">Cajero</th>
                  <th className="text-right pb-2">Cant.</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.transactions).map(([method, info]) => (
                  info.cashiers && Object.entries(info.cashiers).map(([cashier, count]) => (
                    <tr key={`${method}-${cashier}`} className="border-b">
                      <td className="py-2 capitalize">{method === 'cash' ? 'efectivo' : method === 'card' ? 'tarjeta' : method === 'transfer' ? 'transferencia' : method}</td>
                      <td className="py-2">{cashier}</td>
                      <td className="py-2 text-right">{count}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Observations */}
        {data.observations && (
          <div className="mb-6 text-xs report-section">
            <h4 className="font-bold mb-3 text-center">OBSERVACIONES:</h4>
            <p className="border p-3 text-center">{data.observations}</p>
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center text-xs pt-4 border-t report-section">
          <p>Fecha de impresión: {new Date().toLocaleDateString('es-CL')} {new Date().toLocaleTimeString('es-CL')}</p>
          <p className="mt-3">*** FIN DE INFORME {data.isTurnoReport ? "DE TURNO" : "Z"} ***</p>
        </div>
      </div>
    </div>
  );
};

export default ZReport;
