
import React, { useEffect, useState } from 'react';
import { formatDate } from "@/lib/utils";
import type { Order, Shift } from "@/lib/db";
import { CreditCard, Banknote, ArrowRight, CheckCircle2, Clock } from "lucide-react";

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
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem("receiptSettings");
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error("Error loading receipt settings:", error);
      }
    };

    loadSettings();
  }, []);

  const totalByPaymentMethod = orders.reduce(
    (acc, order) => {
      if (order.paymentMethod === 'dividido' && order.paymentSplits) {
        // For split payments, add each split amount to the corresponding method
        order.paymentSplits.forEach(split => {
          acc[split.method] += split.amount;
        });
      } else if (order.paymentMethod) {
        // For single payment methods, add the total to the corresponding method
        acc[order.paymentMethod] += order.total;
      }
      acc.total += order.total;
      return acc;
    },
    { efectivo: 0, tarjeta: 0, transferencia: 0, total: 0 }
  );

  // Split header text by newline characters
  const headerLines = settings.header.split('\n');
  
  // Determine width class based on printer size
  const contentWidthClass = settings.printerSize === "80mm" ? "min-w-[300px] max-w-[400px]" : "min-w-[200px] max-w-[280px]";
  const fontSizeClass = settings.printerSize === "58mm" ? "text-xs" : "text-sm";

  return (
    <div className={`p-6 ${contentWidthClass} ${fontSizeClass} bg-white rounded-md shadow-md border border-gray-200`} id="print-content">
      <div className="text-center mb-6">
        {settings.logoUrl && (
          <div className="flex justify-center mb-3">
            <img 
              src={settings.logoUrl} 
              alt="Logo" 
              className={`${settings.printerSize === "58mm" ? "h-16" : "h-20"} max-w-[200px] object-contain`}
              style={{ background: "#fff", padding: "4px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
            />
          </div>
        )}
        <p className={`${settings.printerSize === "58mm" ? "text-xl" : "text-2xl"} font-bold mb-1`}>
          {headerLines[0] || "Pizza Point"}
        </p>
        <div className="bg-gray-100 rounded-lg p-2 mt-2">
          <p className="text-base font-semibold text-gray-800">Reporte Z - Cierre de Caja</p>
          <p className={`${settings.printerSize === "58mm" ? "text-xs" : "text-sm"} text-gray-600`}>
            Cajero: {shift.cashierName}
          </p>
        </div>
      </div>

      <div className="mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
        <div className="flex items-center mb-2 text-blue-800">
          <Clock className={`mr-2 ${settings.printerSize === "58mm" ? "h-4 w-4" : "h-5 w-5"}`} />
          <span className="font-medium">Periodo del turno</span>
        </div>
        <div className={`flex justify-between ${settings.printerSize === "58mm" ? "text-xs" : "text-sm"} mb-1 ml-7`}>
          <span className="text-gray-600">Apertura:</span>
          <span className="font-medium">{formatDate(shift.startTime)}</span>
        </div>
        <div className={`flex justify-between ${settings.printerSize === "58mm" ? "text-xs" : "text-sm"} ml-7`}>
          <span className="text-gray-600">Cierre:</span>
          <span className="font-medium">{formatDate(shift.endTime || new Date())}</span>
        </div>
      </div>

      <div className="border rounded-lg bg-gray-50 p-4 mb-6">
        <h3 className="font-medium text-gray-700 mb-3 pb-2 border-b">Resumen de Ventas</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Banknote className={`${settings.printerSize === "58mm" ? "h-4 w-4" : "h-5 w-5"} mr-2 text-green-600`} />
              <span>Ventas en Efectivo:</span>
            </div>
            <span className="font-medium">${totalByPaymentMethod.efectivo.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className={`${settings.printerSize === "58mm" ? "h-4 w-4" : "h-5 w-5"} mr-2 text-blue-600`} />
              <span>Ventas con Tarjeta:</span>
            </div>
            <span className="font-medium">${totalByPaymentMethod.tarjeta.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ArrowRight className={`${settings.printerSize === "58mm" ? "h-4 w-4" : "h-5 w-5"} mr-2 text-purple-600`} />
              <span>Transferencias:</span>
            </div>
            <span className="font-medium">${totalByPaymentMethod.transferencia.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className={`flex justify-between font-bold ${settings.printerSize === "58mm" ? "text-base" : "text-lg"} bg-orange-50 p-3 rounded-md border-l-4 border-orange-500`}>
          <span>Total Ventas:</span>
          <span>${totalByPaymentMethod.total.toFixed(2)}</span>
        </div>
        
        <div className="p-3 rounded-lg border border-gray-200">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Fondo Inicial:</span>
            <span className="font-medium">${shift.startAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Monto Final:</span>
            <span className="font-medium">${shift.endAmount?.toFixed(2)}</span>
          </div>
        </div>
        
        {shift.note && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <span className="font-bold block mb-1">Nota: </span>
            <span className="text-gray-700">{shift.note}</span>
          </div>
        )}
      </div>

      <div className={`text-center ${settings.printerSize === "58mm" ? "text-xs" : "text-sm"} text-gray-500 mt-6 pt-4 border-t`}>
        <div className="flex items-center justify-center mb-1 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1 text-gray-400" />
          <span>Documento no válido como factura</span>
        </div>
        <p className="text-xs">{new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};
