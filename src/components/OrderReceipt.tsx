import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { initDB } from "@/lib/db";

interface OrderReceiptProps {
  order: any;
  receiptType: 'customer' | 'kitchen';
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

export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, receiptType }) => {
  const [settings, setSettings] = useState<ReceiptSettings>(defaultSettings);
  const [businessName, setBusinessName] = useState<string>("");

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        const db = await initDB();
        const businessData = await db.getAll('business');
        if (businessData.length > 0) {
          setBusinessName(businessData[0].name);
        }
      } catch (error) {
        console.error("Error loading business data:", error);
      }
    };

    loadBusinessData();
    try {
      const savedSettings = localStorage.getItem("receiptSettings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Error loading receipt settings:", error);
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const getSizeAbbreviation = (size: string) => {
    switch (size?.toLowerCase()) {
      case 'personal': return 'P';
      case 'mediana': return 'M';
      case 'familiar': return 'F';
      default: return size;
    }
  };

  const headerLines = settings.header.split('\n');
  const footerLines = settings.footer.split('\n');
  const contentWidthClass = settings.printerSize === "80mm" ? "min-w-[300px] max-w-[400px]" : "min-w-[200px] max-w-[280px]";

  return (
    <div className={`p-4 ${contentWidthClass} text-sm`} id="print-content">
      {receiptType === 'customer' ? (
        <>
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
            <p className="text-xl font-bold mb-1">{businessName}</p>
            {headerLines.slice(1).map((line, index) => (
              <p key={`header-${index}`} className="text-sm text-gray-600">
                {line}
              </p>
            ))}
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm">
              <span>Fecha: {formatDate(order.createdAt)}</span>
              <span>Orden #{order.id.slice(-4)}</span>
            </div>
            <div className="text-sm">
              {order.orderType === 'mesa' && `Mesa: ${order.tableNumber}`}
              {order.orderType === 'delivery' && (
                <div className="border-t border-b border-dashed py-2 my-2">
                  <div className="font-bold mb-1">DELIVERY</div>
                  {order.customerName && (
                    <div className="mb-1">Cliente: {order.customerName}</div>
                  )}
                  {order.customerPhone && (
                    <div className="mb-1">Tel: {order.customerPhone}</div>
                  )}
                  {order.address && (
                    <>
                      <div className="flex items-start gap-1 mb-1">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>{order.address.street}</div>
                          {order.address.reference && (
                            <div className="text-xs text-gray-600">Ref: {order.address.reference}</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {order.orderType === 'takeaway' && 'Para llevar'}
            </div>
          </div>
        </>
      ) : (
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold mb-1">
            {order.orderType === 'mesa' ? `MESA ${order.tableNumber}` : 
             order.orderType === 'delivery' ? 'DELIVERY' : 'PARA LLEVAR'}
          </h2>
          <div className="text-xl">Orden #{order.id.slice(-4)}</div>
          <div className="text-sm">{formatDate(order.createdAt)}</div>
          {order.orderType === 'delivery' && order.address && (
            <div className="mt-2 text-left border-t border-b border-dashed py-2">
              <div>Cliente: {order.customerName}</div>
              {order.customerPhone && <div>Tel: {order.customerPhone}</div>}
              <div className="flex items-start gap-1 mt-1">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div>{order.address.street}</div>
                  {order.address.reference && (
                    <div className="text-xs">Ref: {order.address.reference}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Table>
        <TableBody>
          {order.items.map((item: any, index: number) => (
            <TableRow key={index} className="border-b">
              <TableCell className="py-2 pl-0 font-medium">
                {item.quantity}x {item.name} 
                {item.size && (
                  <span className="ml-1 font-bold">
                    ({getSizeAbbreviation(item.size)})
                  </span>
                )}
                {receiptType === 'kitchen' && item.notes && (
                  <span className="block text-xs text-gray-600 mt-1">
                    Notas: {item.notes}
                  </span>
                )}
              </TableCell>
              {receiptType === 'customer' && (
                <TableCell className="py-2 pr-0 text-right">
                  {formatCurrency(item.price * item.quantity)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {receiptType === 'customer' && (
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>IVA (16%):</span>
            <span>{formatCurrency((order.total || 0) * 0.16)}</span>
          </div>
          {order.tip > 0 && (
            <div className="flex justify-between mb-2">
              <span>Propina:</span>
              <span>{formatCurrency(order.tip)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
          
          <div className="mt-4 text-center text-sm">
            {footerLines.map((line, index) => (
              <p key={`footer-${index}`} className={index === 0 ? "" : "text-xs text-gray-500"}>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
