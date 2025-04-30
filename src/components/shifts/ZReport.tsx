
import React, { useEffect, useState } from 'react';
import { formatDate } from "@/lib/utils";
import { Receipt } from "lucide-react";
import type { Order, Shift } from "@/lib/db";
import { initDB } from "@/lib/db";

interface ZReportProps {
  shift: Shift;
  orders: Order[];
}

type ReceiptSettings = {
  logoUrl: string | null;
  header: string;
  footer: string;
  printerSize: string;
  receiptPrinter: string;
  kitchenPrinter: string;
};

const defaultSettings: ReceiptSettings = {
  logoUrl: null,
  header: "Pizza Point\nCalle Ejemplo 123\nTel: (123) 456-7890",
  footer: "¡Gracias por su compra!\nConserve este ticket como comprobante",
  printerSize: "58mm",
  receiptPrinter: "",
  kitchenPrinter: "",
};

export const ZReport: React.FC<ZReportProps> = ({ shift, orders }) => {
  const [settings, setSettings] = useState<ReceiptSettings>(defaultSettings);
  
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("receiptSettings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Error loading receipt settings:", error);
    }
  }, []);

  const totalByPaymentMethod = orders.reduce(
    (acc, order) => {
      if (order.paymentMethod === 'dividido' && order.paymentSplits) {
        // For split payments, add each split amount to the corresponding method
        order.paymentSplits.forEach(split => {
          acc[split.method] += split.amount;
        });
      } else {
        // For single payment methods, add the total to the corresponding method
        acc[order.paymentMethod === 'cash' ? 'efectivo' : 
            order.paymentMethod === 'card' ? 'tarjeta' : 
            order.paymentMethod === 'transfer' ? 'transferencia' : 'otros'] += order.total;
      }
      acc.total += order.total;
      return acc;
    },
    { efectivo: 0, tarjeta: 0, transferencia: 0, otros: 0, total: 0 }
  );

  // Split header text by newline characters
  const headerLines = settings.header.split('\n');
  
  // Determine width class based on printer size
  const contentWidthClass = settings.printerSize === "80mm" ? "min-w-[300px] max-w-[400px]" : "min-w-[200px] max-w-[280px]";

  return (
    <div className={`p-4 ${contentWidthClass} text-sm`} id="print-content">
      <div className="text-center mb-4">
        {settings.logoUrl && (
          <div className="flex justify-center mb-2">
            <img 
              src={settings.logoUrl} 
              alt="Logo" 
              className="h-16 max-w-[180px] object-contain"
              style={{ background: "#fff", padding: "4px" }}
            />
          </div>
        )}
        <p className="text-xl font-bold mb-1">{headerLines[0] || "Pizza Point"}</p>
        <p className="text-sm text-gray-600">Reporte Z - Cierre de Caja</p>
        <p className="text-sm text-gray-600">Cajero: {shift.cashierName || 'No especificado'}</p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm">
          <span>Apertura:</span>
          <span>{formatDate(shift.startTime || shift.openTime || new Date())}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Cierre:</span>
          <span>{formatDate(shift.endTime || shift.closeTime || new Date())}</span>
        </div>
      </div>

      <div className="border-t border-b py-4 my-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Ventas en Efectivo:</span>
            <span>${totalByPaymentMethod.efectivo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ventas con Tarjeta:</span>
            <span>${totalByPaymentMethod.tarjeta.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Transferencias:</span>
            <span>${totalByPaymentMethod.transferencia.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between font-bold">
          <span>Total Ventas:</span>
          <span>${totalByPaymentMethod.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Fondo Inicial:</span>
          <span>${(shift.startAmount || shift.openBalance || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Monto Final:</span>
          <span>${(shift.endAmount || shift.closeBalance || 0).toFixed(2)}</span>
        </div>
        {(shift.note) && (
          <div className="mt-4 text-sm">
            <span className="font-bold">Nota: </span>
            <span>{shift.note}</span>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-gray-500 mt-6">
        <p>Documento no válido como factura</p>
        <p>{new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};
