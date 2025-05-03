
import React, { useRef } from 'react';
import { formatCurrency } from "@/lib/utils";
import { Customer } from "@/lib/db";
import { Printer } from "lucide-react";

interface PreBillReceiptProps {
  cart: any[];
  activeTable: string | null;
  selectedCustomer: Customer | null;
  orderType: "mesa" | "delivery" | "takeaway";
  subtotal: number;
  taxAmount: number;
  total: number;
}

export const PreBillReceipt: React.FC<PreBillReceiptProps> = ({
  cart,
  activeTable,
  selectedCustomer,
  orderType,
  subtotal,
  taxAmount,
  total
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  // Calculate 10% tip
  const tipAmount = total * 0.1;
  const totalWithTip = total + tipAmount;
  
  const printPreBill = () => {
    if (printRef.current) {
      const printContent = printRef.current;
      const windowPrint = window.open('', '_blank');
      
      if (!windowPrint) return;
      
      windowPrint.document.write(`
        <html>
          <head>
            <title>Pre-Cuenta</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                width: 80mm;
                margin: 0 auto;
                padding: 5mm;
                font-size: 12px;
              }
              .header {
                text-align: center;
                margin-bottom: 10px;
                font-size: 14px;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 10px 0;
              }
              .item {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
              }
              .extras {
                padding-left: 15px;
                font-style: italic;
                font-size: 11px;
              }
              .total-section {
                margin-top: 10px;
                border-top: 1px dashed #000;
                padding-top: 10px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
              }
              .tip-row {
                display: flex;
                justify-content: space-between;
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      
      windowPrint.document.close();
      windowPrint.focus();
      windowPrint.print();
      setTimeout(() => windowPrint.close(), 500);
    }
  };
  
  // Get current date and time
  const now = new Date();
  const dateString = now.toLocaleDateString();
  const timeString = now.toLocaleTimeString();

  return (
    <>
      <div className="hidden">
        <div ref={printRef}>
          <div className="header">
            <h2>PRE-CUENTA</h2>
            <p>Fecha: {dateString} - Hora: {timeString}</p>
            {orderType === "mesa" && <p>Mesa: {activeTable}</p>}
            {orderType === "delivery" && <p>Delivery</p>}
            {orderType === "takeaway" && <p>Para llevar</p>}
            {selectedCustomer && <p>Cliente: {selectedCustomer.name}</p>}
          </div>
          
          <div className="divider"></div>
          
          {cart.map((item, index) => {
            const extras = item.extras || [];
            const extrasTotal = extras.reduce((sum: number, ext: any) => sum + (ext.price || 0), 0);
            const itemTotal = (item.price + extrasTotal) * item.quantity;
            
            return (
              <div key={index}>
                <div className="item">
                  <span>{item.quantity} x {item.name} {item.size ? `(${item.size})` : ''}</span>
                  <span>{formatCurrency(itemTotal, false)}</span>
                </div>
                {extras.length > 0 && (
                  <div className="extras">
                    {extras.map((extra: any, i: number) => (
                      <div key={i}>+ {extra.name} {extra.price ? formatCurrency(extra.price, false) : ''}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="total-section">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal, false)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="total-row">
                <span>IVA:</span>
                <span>{formatCurrency(taxAmount, false)}</span>
              </div>
            )}
            <div className="total-row">
              <span>Total:</span>
              <span>{formatCurrency(total, false)}</span>
            </div>
            <div className="tip-row">
              <span>Propina sugerida (10%):</span>
              <span>{formatCurrency(tipAmount, false)}</span>
            </div>
            <div className="total-row" style={{ marginTop: "10px", borderTop: "1px dashed #000", paddingTop: "5px" }}>
              <span>Total con propina:</span>
              <span>{formatCurrency(totalWithTip, false)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={printPreBill} 
        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-md"
      >
        <Printer className="h-4 w-4" />
        Imprimir Pre-Cuenta
      </button>
    </>
  );
};
