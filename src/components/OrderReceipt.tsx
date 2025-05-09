
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { MapPin, Phone, User, CheckCircle } from "lucide-react";
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
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [sentToKitchenItems, setSentToKitchenItems] = useState<string[]>([]);

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        const db = await initDB();
        const businessInfo = await db.get('business', 'businessInfo');
        if (businessInfo) {
          setBusinessName(businessInfo.name || "");
        }
      } catch (error) {
        console.error("Error loading business data:", error);
      }
    };

    const loadSettings = async () => {
      try {
        const savedSettings = localStorage.getItem("receiptSettings");
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    // Load sent to kitchen items if this is a saved order
    const loadSentToKitchenItems = async () => {
      if (order.tableNumber && order.sentToKitchenItems && Array.isArray(order.sentToKitchenItems)) {
        setSentToKitchenItems(order.sentToKitchenItems);
      } else if (order.tableNumber) {
        try {
          const db = await initDB();
          const kitchenRecords = await db.getAll('kitchenRecords');
          
          // Find records for this specific table
          const tableRecords = kitchenRecords.filter(record => 
            record.tableNumber === order.tableNumber
          );
          
          if (tableRecords.length > 0) {
            // Extract all item IDs that have been sent to kitchen
            const sentItems = tableRecords.reduce((acc: string[], record) => {
              if (record.items && Array.isArray(record.items)) {
                const itemIds = record.items.map((item: any) => item.id || item.productId);
                return [...acc, ...itemIds];
              }
              return acc;
            }, []);
            
            setSentToKitchenItems(sentItems);
          }
        } catch (error) {
          console.error("Error loading kitchen records:", error);
        }
      }
    };

    // Load all data and then mark as loaded
    Promise.all([loadBusinessData(), loadSettings(), loadSentToKitchenItems()])
      .finally(() => {
        setIsLoaded(true);
      });
  }, [order.tableNumber, order.sentToKitchenItems]);

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

  // Check if an item has been sent to kitchen
  const hasBeenSentToKitchen = (item: any) => {
    const itemId = item.id || item.productId;
    return sentToKitchenItems.includes(itemId);
  };

  // If not loaded yet, render a minimal placeholder to avoid blank output
  if (!isLoaded) {
    return (
      <div className="p-4 min-w-[200px] max-w-[280px] text-sm">
        <div className="text-center mb-4">
          <p className="text-xl font-bold mb-1">Cargando recibo...</p>
        </div>
      </div>
    );
  }

  const headerLines = settings.header.split('\n');
  const footerLines = settings.footer.split('\n');
  const contentWidthClass = settings.printerSize === "80mm" ? "min-w-[300px] max-w-[400px]" : "min-w-[200px] max-w-[280px]";
  const fontSizeClass = settings.printerSize === "58mm" ? "text-xs" : "text-sm";

  // Use the total directly from the order
  const total = order.total;
  const taxEnabled = order.taxSettings?.taxEnabled || false;
  const taxPercentage = order.taxSettings?.taxPercentage || 0;
  const taxAmount = order.tax || 0;
  
  const hasCustomerInfo = order.customerName || (order.customerPhone || order.customerTelephone);
  
  return (
    <div className={`p-4 ${contentWidthClass} ${fontSizeClass} bg-white rounded-md shadow-md`} id="print-content">
      {receiptType === 'customer' ? (
        <>
          {/* Customer receipt header */}
          <div className="text-center mb-6">
            {settings.logoUrl && (
              <div className="flex justify-center mb-3">
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className={`${settings.printerSize === "58mm" ? "h-16" : "h-20"} max-w-[200px] object-contain`}
                  style={{ background: "#fff", padding: "4px" }}
                />
              </div>
            )}
            <p className={`${settings.printerSize === "58mm" ? "text-xl" : "text-2xl"} font-bold mb-1`}>{businessName || headerLines[0]}</p>
            <div className="border-t border-b border-gray-200 py-2 my-2">
              {headerLines.slice(1).map((line, index) => (
                <p key={`header-${index}`} className={`${settings.printerSize === "58mm" ? "text-xs" : "text-sm"} text-gray-600`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium bg-gray-50 p-2 rounded-lg mb-3">
              <span>Fecha: {formatDate(order.createdAt)}</span>
              <span className="font-bold text-orange-600">Orden #{order.id.slice(-4)}</span>
            </div>
            
            {/* Cliente información */}
            {hasCustomerInfo && (
              <div className="border-t border-b border-dashed py-3 my-3 bg-gray-50 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <User className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-500" />
                  <div className="font-bold">{order.customerName}</div>
                </div>
                
                {order.customerPhone && (
                  <div className="flex items-start gap-2 mb-2">
                    <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-500" />
                    <div>{order.customerPhone}</div>
                  </div>
                )}
                
                {order.address && (
                  <div className="flex items-start gap-2 mb-1">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-500" />
                    <div>
                      <div>{order.address.street}</div>
                      {order.address.reference && (
                        <div className={`${settings.printerSize === "58mm" ? "text-[10px]" : "text-xs"} text-gray-600`}>
                          Ref: {order.address.reference}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="text-sm">
              {order.orderType === 'mesa' && (
                <div className="bg-orange-100 text-orange-800 font-medium p-2 rounded-md text-center">
                  Mesa: {order.tableNumber || "Sin asignar"}
                </div>
              )}
              {order.orderType === 'delivery' && (
                <div className="bg-blue-100 text-blue-800 font-medium p-2 rounded-md">
                  <div className="text-center mb-1">DELIVERY</div>
                  
                  {!hasCustomerInfo && order.address && (
                    <>
                      <div className="flex items-start gap-1 mb-1">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>{order.address.street}</div>
                          {order.address.reference && (
                            <div className={`${settings.printerSize === "58mm" ? "text-[10px]" : "text-xs"} text-gray-600`}>
                              Ref: {order.address.reference}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {order.orderType === 'takeaway' && (
                <div className="bg-green-100 text-green-800 font-medium p-2 rounded-md text-center">
                  Para llevar
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="mb-6">
          <div className="text-center">
            <h2 className={`${settings.printerSize === "58mm" ? "text-2xl" : "text-3xl"} font-bold mb-2 text-gray-800`}>
              {order.orderType === 'mesa' ? `MESA ${order.tableNumber || "Sin asignar"}` : 
              order.orderType === 'delivery' ? 'DELIVERY' : 'PARA LLEVAR'}
            </h2>
            <div className="bg-gray-200 p-2 rounded-md inline-block px-4">
              <span className={`${settings.printerSize === "58mm" ? "text-lg" : "text-xl"} font-medium`}>
                Orden #{order.id.slice(-4)}
              </span>
            </div>
            <div className="text-sm mt-2">{formatDate(order.createdAt)}</div>
          </div>
          
          {/* Información del cliente en recibo de cocina */}
          {hasCustomerInfo && (
            <div className="mt-4 text-left border-t border-dashed py-3 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-orange-500" />
                <div className="font-medium">{order.customerName}</div>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-orange-500" />
                  <div>{order.customerPhone}</div>
                </div>
              )}
            </div>
          )}
          
          {order.orderType === 'delivery' && order.address && (
            <div className="mt-4 text-left border border-blue-200 bg-blue-50 py-3 rounded-lg p-3">
              {!hasCustomerInfo && (
                <div className="font-medium mb-1">Cliente: {order.customerName || "No especificado"}</div>
              )}
              {!hasCustomerInfo && order.customerPhone && <div className="mb-2">Tel: {order.customerPhone}</div>}
              <div className="flex items-start gap-2 mt-1">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-500" />
                <div>
                  <div className="font-medium">{order.address.street}</div>
                  {order.address.reference && (
                    <div className={`${settings.printerSize === "58mm" ? "text-[10px]" : "text-sm"} text-gray-600`}>
                      Ref: {order.address.reference}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`${receiptType === 'kitchen' ? "border-2 border-gray-300 rounded-lg p-2 bg-gray-50" : ""}`}>
        <Table>
          <TableBody>
            {order.items.map((item: any, index: number) => {
              const isSentToKitchen = hasBeenSentToKitchen(item);
              const itemTextClass = receiptType === 'kitchen' && isSentToKitchen 
                ? 'line-through text-gray-500' 
                : '';
              
              return (
                <TableRow key={index} className={`border-b ${receiptType === 'kitchen' ? "border-gray-300" : ""}`}>
                  <TableCell 
                    className={`py-2 pl-0 font-medium ${receiptType === 'kitchen' ? (settings.printerSize === "58mm" ? "text-sm" : "text-base") : ""} ${itemTextClass}`}
                  >
                    {receiptType === 'kitchen' && isSentToKitchen && (
                      <span className="inline-block w-full relative">
                        <span className="absolute top-1/2 left-0 right-0 border-t-2 border-red-500 transform -translate-y-1/2"></span>
                      </span>
                    )}
                    
                    {receiptType === 'kitchen' && (
                      <span className={`inline-block bg-gray-800 text-white px-2 py-0.5 rounded mr-2 ${isSentToKitchen ? 'bg-opacity-50' : ''}`}>
                        {item.quantity}x
                      </span>
                    )}
                    
                    {receiptType !== 'kitchen' && `${item.quantity}x `}
                    
                    <span className={`${isSentToKitchen && receiptType === 'kitchen' ? 'line-through text-gray-500' : ''}`}>
                      {item.name} 
                      {item.size && (
                        <span className={`ml-1 font-bold ${receiptType === 'kitchen' ? "text-gray-700" : ""} ${isSentToKitchen ? 'text-gray-500' : ''}`}>
                          ({getSizeAbbreviation(item.size)})
                        </span>
                      )}
                    </span>
                    
                    {receiptType === 'kitchen' && isSentToKitchen && (
                      <span className="ml-2 text-xs bg-green-700 text-white px-1 py-0.5 rounded">
                        Enviado
                      </span>
                    )}
                    
                    {receiptType === 'kitchen' && item.notes && (
                      <div className={`block ${settings.printerSize === "58mm" ? "text-xs" : "text-sm"} ${isSentToKitchen ? 'bg-yellow-50/50 border-yellow-200' : 'bg-yellow-50 border-yellow-400'} border-l-4 text-yellow-800 p-2 mt-1`}>
                        <span className="font-bold">Notas:</span> {item.notes}
                      </div>
                    )}
                  </TableCell>
                  {receiptType === 'customer' && (
                    <TableCell className="py-2 pr-0 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {receiptType === 'customer' && (
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between mb-2 text-gray-700">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          
          {taxEnabled && taxPercentage > 0 && (
            <div className="flex justify-between mb-2 text-gray-700">
              <span>IVA ({taxPercentage}%):</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          )}
          
          {order.tip > 0 && (
            <div className="flex justify-between mb-2 text-gray-700">
              <span>Propina:</span>
              <span>{formatCurrency(order.tip)}</span>
            </div>
          )}
          
          <div className={`flex justify-between font-bold ${settings.printerSize === "58mm" ? "text-base" : "text-lg"} bg-gray-100 p-2 rounded-md mt-2`}>
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          
          <div className="mt-6 text-center text-sm border-t border-dashed pt-3">
            {footerLines.map((line, index) => (
              <p key={`footer-${index}`} className={index === 0 ? "font-medium" : `${settings.printerSize === "58mm" ? "text-[10px]" : "text-xs"} text-gray-500 mt-1`}>
                {line}
              </p>
            ))}
            
            <div className="flex items-center justify-center mt-3 text-gray-500 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>Gracias por su preferencia</span>
            </div>
          </div>
        </div>
      )}

      {receiptType === 'kitchen' && (
        <div className="mt-4 border-t pt-3 text-center text-gray-500">
          <p className="text-sm">{formatDate(new Date())}</p>
        </div>
      )}
    </div>
  );
};
