
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { MapPin, Phone, User, CheckCircle, Receipt, FileText, Tag } from "lucide-react";
import { initDB } from "@/lib/db";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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

  // Check if an item has been sent to kitchen
  const hasBeenSentToKitchen = (item: any) => {
    const itemId = item.id || item.productId;
    return sentToKitchenItems.includes(itemId);
  };

  const getSizeAbbreviation = (size: string) => {
    switch (size?.toLowerCase()) {
      case 'personal': return 'P';
      case 'mediana': return 'M';
      case 'familiar': return 'F';
      default: return size;
    }
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
    <div 
      className={`p-4 ${contentWidthClass} ${fontSizeClass} bg-white rounded-lg shadow-md border border-gray-100`} 
      id="print-content"
      style={{
        backgroundImage: 'linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%)',
        backgroundSize: 'cover'
      }}
    >
      {receiptType === 'customer' ? (
        <>
          {/* Customer receipt header with gradient background */}
          <div className="text-center mb-6 relative">
            <div 
              className="absolute inset-0 opacity-10 rounded-lg" 
              style={{backgroundImage: 'linear-gradient(109.6deg, rgba(223,234,247,1) 11.2%, rgba(244,248,252,1) 91.1%)'}}
            />
            
            {settings.logoUrl && (
              <div className="flex justify-center mb-3">
                <AspectRatio ratio={3/2} className="w-[140px] bg-white rounded-lg shadow-sm overflow-hidden">
                  <img 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    className="object-contain h-full w-full p-1"
                  />
                </AspectRatio>
              </div>
            )}

            <div className="space-y-1 py-2">
              <p className={`${settings.printerSize === "58mm" ? "text-xl" : "text-2xl"} font-bold mb-1 tracking-tight`}>
                {businessName || headerLines[0]}
              </p>
              <div className="border-t border-b border-gray-200 py-2 my-2 bg-white/50 backdrop-blur-sm rounded">
                {headerLines.slice(1).map((line, index) => (
                  <p key={`header-${index}`} className={`${settings.printerSize === "58mm" ? "text-xs" : "text-sm"} text-gray-600`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center text-sm font-medium bg-white p-3 rounded-lg mb-3 shadow-sm border border-gray-100">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-gray-500" />
                <span>{formatDate(order.createdAt)}</span>
              </span>
              <span className="font-bold text-orange-600 flex items-center">
                <Receipt className="h-4 w-4 mr-1" />
                #{order.id.slice(-4)}
              </span>
            </div>
            
            {/* Cliente información */}
            {hasCustomerInfo && (
              <div className="rounded-lg p-3 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-100 mb-4">
                <div className="flex items-start gap-2 mb-2">
                  <User className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                  <div className="font-bold">{order.customerName}</div>
                </div>
                
                {order.customerPhone && (
                  <div className="flex items-start gap-2 mb-2">
                    <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                    <div>{order.customerPhone}</div>
                  </div>
                )}
                
                {order.address && (
                  <div className="flex items-start gap-2 mb-1">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
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
                <div className="bg-gradient-to-r from-orange-100 to-amber-100 text-amber-800 font-medium p-2 rounded-md text-center shadow-sm border border-orange-200">
                  <span className="flex items-center justify-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    Mesa: {order.tableNumber || "Sin asignar"}
                  </span>
                </div>
              )}
              {order.orderType === 'delivery' && (
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-800 font-medium p-2 rounded-md shadow-sm border border-blue-200">
                  <div className="text-center mb-1 flex items-center justify-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    DELIVERY
                  </div>
                  
                  {!hasCustomerInfo && order.address && (
                    <div className="flex items-start gap-1 mb-1 mt-1 bg-white/60 p-2 rounded">
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
              {order.orderType === 'takeaway' && (
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-800 font-medium p-2 rounded-md text-center shadow-sm border border-green-200">
                  <span className="flex items-center justify-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    Para llevar
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="mb-6">
          <div className="text-center">
            <div className="py-2 px-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-lg shadow-md mb-3">
              <h2 className={`${settings.printerSize === "58mm" ? "text-xl" : "text-2xl"} font-bold`}>
                {order.orderType === 'mesa' ? `MESA ${order.tableNumber || "Sin asignar"}` : 
                order.orderType === 'delivery' ? 'DELIVERY' : 'PARA LLEVAR'}
              </h2>
            </div>
            <div className="bg-gray-200 p-2 rounded-md inline-block px-4">
              <span className={`${settings.printerSize === "58mm" ? "text-lg" : "text-xl"} font-medium flex items-center justify-center gap-1`}>
                <Receipt className="h-4 w-4" />
                #{order.id.slice(-4)}
              </span>
            </div>
            <div className="text-sm mt-2 text-gray-600">{formatDate(order.createdAt)}</div>
          </div>
          
          {/* Información del cliente en recibo de cocina */}
          {hasCustomerInfo && (
            <div className="mt-4 text-left border-t border-dashed py-3 bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-600" />
                <div className="font-medium">{order.customerName}</div>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <div>{order.customerPhone}</div>
                </div>
              )}
            </div>
          )}
          
          {order.orderType === 'delivery' && order.address && (
            <div className="mt-4 text-left bg-blue-50 py-3 rounded-lg p-3 border border-blue-200">
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

      <div className={`${receiptType === 'kitchen' ? "border border-gray-200 rounded-lg p-3 bg-white shadow-sm" : "bg-white rounded-lg shadow-sm p-2"}`}>
        <Table>
          <TableBody>
            {order.items.map((item: any, index: number) => {
              const isSentToKitchen = hasBeenSentToKitchen(item);
              const itemTextClass = receiptType === 'kitchen' && isSentToKitchen 
                ? 'line-through text-gray-500' 
                : '';
              
              return (
                <TableRow key={index} className={`border-b ${receiptType === 'kitchen' ? "border-gray-200" : ""}`}>
                  <TableCell 
                    className={`py-2 pl-0 font-medium ${receiptType === 'kitchen' ? (settings.printerSize === "58mm" ? "text-sm" : "text-base") : ""} ${itemTextClass}`}
                  >
                    {receiptType === 'kitchen' && isSentToKitchen && (
                      <span className="inline-block w-full relative">
                        <span className="absolute top-1/2 left-0 right-0 border-t-2 border-red-400 transform -translate-y-1/2"></span>
                      </span>
                    )}
                    
                    {receiptType === 'kitchen' ? (
                      <div className="flex items-center gap-1">
                        <span className={`inline-block bg-gray-800 text-white px-2 py-0.5 rounded mr-1 ${isSentToKitchen ? 'bg-opacity-50' : ''}`}>
                          {item.quantity}x
                        </span>
                        
                        <span className={`${isSentToKitchen ? 'line-through text-gray-500' : ''} flex-grow`}>
                          {item.name} 
                          {item.size && (
                            <span className={`ml-1 font-bold ${receiptType === 'kitchen' ? "text-gray-700" : ""} ${isSentToKitchen ? 'text-gray-500' : ''}`}>
                              ({getSizeAbbreviation(item.size)})
                            </span>
                          )}
                        </span>
                        
                        {isSentToKitchen && (
                          <span className="ml-auto text-xs bg-green-700 text-white px-1.5 py-0.5 rounded">
                            Enviado
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span>
                          <span className="font-bold">{item.quantity}x </span>
                          {item.name} 
                          {item.size && (
                            <span className="ml-1 text-gray-700">
                              ({item.size})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    
                    {receiptType === 'kitchen' && item.notes && (
                      <div className={`block mt-1 ${settings.printerSize === "58mm" ? "text-xs" : "text-sm"} ${isSentToKitchen ? 'bg-yellow-50/50 border-yellow-200' : 'bg-yellow-50 border-yellow-400'} border-l-4 text-yellow-800 p-2 rounded`}>
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
          
          <div className={`flex justify-between font-bold ${settings.printerSize === "58mm" ? "text-base" : "text-lg"} bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg mt-2 shadow-sm border border-orange-100`}>
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
