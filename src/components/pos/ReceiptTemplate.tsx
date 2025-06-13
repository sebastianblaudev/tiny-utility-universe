
import React, { forwardRef } from 'react';
import { Sale, SaleItem, PaymentMethod } from "@/types";
import { format } from "date-fns";
import { QRCodeSVG } from 'qrcode.react';
import { useLanguageCurrency } from '@/hooks/useLanguageCurrency';

interface ReceiptTemplateProps {
  sale: Sale;
  barberName?: string;
  shopName: string;
  footerText: string;
  logoUrl?: string;
  size?: "58mm" | "80mm";
}

const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(({
  sale,
  barberName,
  shopName,
  footerText,
  logoUrl,
  size = "80mm"
}, ref) => {
  const { formatCurrency, getText } = useLanguageCurrency();
  
  console.log("ReceiptTemplate: Rendering with sale:", {
    id: sale?.id,
    total: sale?.total,
    itemsCount: sale?.items?.length,
    tip: sale?.tip
  });
  
  if (!sale) {
    console.error("ReceiptTemplate: No sale data provided");
    return (
      <div ref={ref} className="print-receipt" style={{ 
        padding: "16px", 
        fontFamily: "'Courier New', monospace", 
        fontSize: "12px",
        backgroundColor: "white",
        color: "black"
      }}>
        <div style={{ textAlign: "center", color: "red" }}>
          {getText("Error: No hay datos de venta", "Error: No sale data")}
        </div>
      </div>
    );
  }
  
  const saleId = sale.id || Date.now().toString();
  const saleItems = sale.items || [];
  const saleTotal = sale.total || 0;
  const saleDate = sale.date || new Date();
  
  const getPaymentMethodName = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return getText("Efectivo", "Cash");
      case PaymentMethod.CARD:
        return getText("Tarjeta", "Card");
      case PaymentMethod.TRANSFER:
        return getText("Transferencia", "Transfer");
      case PaymentMethod.MIXED:
        return getText("Pago Mixto", "Mixed Payment");
      default:
        return getText("Otro", "Other");
    }
  };

  const formattedDate = format(new Date(saleDate), "dd/MM/yyyy HH:mm");

  const qrData = JSON.stringify({
    saleId: saleId,
    total: saleTotal,
    date: formattedDate,
    itemCount: saleItems.length,
    loyaltyPoints: Math.floor(saleTotal / 10),
  });

  const tipAmount = sale.tip ? sale.tip.amount : 0;
  const totalWithTip = saleTotal + tipAmount;

  const receiptWidth = size === "58mm" ? "220px" : "300px";
  const fontSize = size === "58mm" ? "10px" : "12px";
  const lineHeight = size === "58mm" ? "1.3" : "1.4";

  const receiptStyles: React.CSSProperties = {
    width: receiptWidth,
    maxWidth: receiptWidth,
    backgroundColor: "white",
    color: "black",
    fontFamily: "'Courier New', monospace",
    fontSize: fontSize,
    lineHeight: lineHeight,
    padding: size === "58mm" ? "16px 16px" : "20px 20px",
    margin: "0 auto",
    border: "none",
    boxShadow: "none",
    pageBreakInside: "avoid",
    overflow: "hidden",
    WebkitPrintColorAdjust: "exact",
    colorAdjust: "exact",
    printColorAdjust: "exact",
    boxSizing: "border-box"
  };

  return (
    <div ref={ref} className="print-receipt" style={receiptStyles}>
      {/* Header */}
      <div style={{ 
        textAlign: "center", 
        marginBottom: size === "58mm" ? "16px" : "20px",
        pageBreakInside: "avoid",
        borderBottom: "2px solid #000",
        paddingBottom: "12px"
      }}>
        {logoUrl && (
          <div style={{ marginBottom: "12px", textAlign: "center" }}>
            <img 
              src={logoUrl} 
              alt={`${shopName} logo`} 
              style={{ 
                height: size === "58mm" ? "50px" : "60px", 
                objectFit: "contain",
                maxWidth: "85%",
                display: "block",
                margin: "0 auto"
              }}
              onError={(e) => {
                console.error("Logo failed to load");
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div style={{ 
          fontWeight: "bold", 
          fontSize: size === "58mm" ? "16px" : "18px", 
          marginBottom: "8px",
          color: "black",
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}>
          {shopName}
        </div>
        <div style={{ color: "black", marginBottom: "4px", fontSize: size === "58mm" ? "10px" : "12px" }}>
          {getText("RECIBO DE VENTA", "SALES RECEIPT")}
        </div>
        <div style={{ color: "black", marginBottom: "4px", fontSize: size === "58mm" ? "9px" : "11px" }}>
          {formattedDate}
        </div>
        <div style={{ color: "black", marginBottom: "4px", fontSize: size === "58mm" ? "9px" : "11px" }}>
          {getText("No:", "No:")} {saleId.substring(0, 8).toUpperCase()}
        </div>
      </div>

      {/* Barber info */}
      {barberName && (
        <div style={{ 
          marginBottom: size === "58mm" ? "16px" : "18px",
          fontSize: size === "58mm" ? "10px" : "12px",
          pageBreakInside: "avoid",
          color: "black",
          backgroundColor: "#f8f8f8",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ddd"
        }}>
          <strong>{getText("Atendido por:", "Served by:")}</strong> {barberName}
        </div>
      )}

      {/* Items */}
      <div style={{ 
        marginBottom: size === "58mm" ? "16px" : "18px",
        pageBreakInside: "avoid"
      }}>
        <div style={{ 
          fontWeight: "bold", 
          borderBottom: "2px solid #000", 
          paddingBottom: "8px", 
          marginBottom: "8px",
          fontSize: size === "58mm" ? "11px" : "13px",
          color: "black",
          textAlign: "center",
          textTransform: "uppercase"
        }}>
          {getText("DETALLE DE LA VENTA", "SALE DETAILS")}
        </div>
        
        {saleItems.length > 0 ? (
          <div style={{ fontSize: size === "58mm" ? "9px" : "10px" }}>
            {/* Header de tabla */}
            <div style={{ 
              display: "flex", 
              borderBottom: "1px solid #000",
              paddingBottom: "4px",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "black"
            }}>
              <div style={{ flex: "2", textAlign: "left", paddingRight: "4px" }}>
                {getText("Descripción", "Description")}
              </div>
              <div style={{ flex: "0.5", textAlign: "center", paddingRight: "4px" }}>
                {getText("Cant.", "Qty.")}
              </div>
              <div style={{ flex: "1", textAlign: "right", paddingRight: "4px" }}>
                {getText("Precio", "Price")}
              </div>
              <div style={{ flex: "1", textAlign: "right" }}>
                {getText("Total", "Total")}
              </div>
            </div>
            
            {/* Items */}
            {saleItems.map((item: SaleItem, index: number) => (
              <div key={item.id || index} style={{ 
                display: "flex", 
                marginBottom: "6px",
                paddingBottom: "4px",
                borderBottom: "1px dotted #ccc",
                color: "black"
              }}>
                <div style={{ flex: "2", textAlign: "left", paddingRight: "4px" }}>
                  {item.name}
                </div>
                <div style={{ flex: "0.5", textAlign: "center", paddingRight: "4px" }}>
                  {item.quantity}
                </div>
                <div style={{ flex: "1", textAlign: "right", paddingRight: "4px" }}>
                  {formatCurrency(item.price)}
                </div>
                <div style={{ flex: "1", textAlign: "right", fontWeight: "bold" }}>
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "12px", color: "#666" }}>
            {getText("No hay artículos", "No items")}
          </div>
        )}
      </div>

      {/* Payment info */}
      <div style={{ 
        marginBottom: size === "58mm" ? "16px" : "18px",
        pageBreakInside: "avoid",
        borderTop: "2px solid #000",
        paddingTop: "12px"
      }}>
        <div style={{ 
          fontWeight: "bold", 
          marginBottom: "8px",
          fontSize: size === "58mm" ? "11px" : "13px",
          color: "black",
          textAlign: "center",
          textTransform: "uppercase"
        }}>
          {getText("INFORMACIÓN DE PAGO", "PAYMENT INFORMATION")}
        </div>
        
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          marginBottom: "6px",
          fontSize: size === "58mm" ? "9px" : "10px",
          color: "black"
        }}>
          <span><strong>{getText("Método:", "Method:")}</strong></span>
          <span>{getPaymentMethodName(sale.paymentMethod || PaymentMethod.CASH)}</span>
        </div>
        
        {/* For mixed payments */}
        {sale.paymentMethod === PaymentMethod.MIXED && sale.splitPayments && (
          <div style={{ 
            marginTop: "6px", 
            paddingLeft: "16px", 
            fontSize: size === "58mm" ? "8px" : "9px",
            color: "black"
          }}>
            {sale.splitPayments.map((payment, index) => (
              <div key={index} style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginBottom: "2px",
                color: "black"
              }}>
                <span>{getPaymentMethodName(payment.method)}</span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Totales */}
        <div style={{ marginTop: "12px", borderTop: "1px solid #000", paddingTop: "8px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            marginBottom: "4px",
            fontSize: size === "58mm" ? "10px" : "11px",
            color: "black"
          }}>
            <span><strong>{getText("SUBTOTAL:", "SUBTOTAL:")}</strong></span>
            <span><strong>{formatCurrency(saleTotal)}</strong></span>
          </div>

          {tipAmount > 0 && (
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              marginBottom: "4px",
              fontSize: size === "58mm" ? "9px" : "10px",
              color: "black"
            }}>
              <span><strong>{getText("Propina:", "Tip:")}</strong></span>
              <span><strong>{formatCurrency(tipAmount)}</strong></span>
            </div>
          )}

          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            fontWeight: "bold", 
            marginTop: "8px",
            fontSize: size === "58mm" ? "12px" : "14px",
            color: "black",
            borderTop: "2px solid #000",
            paddingTop: "8px",
            backgroundColor: "#f0f0f0",
            padding: "8px",
            borderRadius: "4px"
          }}>
            <span>{getText("TOTAL:", "TOTAL:")}</span>
            <span>{formatCurrency(totalWithTip)}</span>
          </div>
        </div>

        {/* Loyalty points */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          marginTop: "8px",
          fontSize: size === "58mm" ? "9px" : "10px",
          color: "black",
          fontStyle: "italic"
        }}>
          <span>{getText("Puntos obtenidos:", "Points earned:")}</span>
          <span><strong>{Math.floor(totalWithTip / 10)}</strong></span>
        </div>
      </div>

      {/* QR Code */}
      <div style={{ 
        textAlign: "center", 
        margin: size === "58mm" ? "16px 0" : "20px 0",
        pageBreakInside: "avoid",
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fafafa"
      }}>
        <QRCodeSVG 
          value={qrData} 
          size={size === "58mm" ? 60 : 80} 
          style={{ 
            display: "block",
            margin: "0 auto 8px auto"
          }} 
        />
        <div style={{ 
          fontSize: size === "58mm" ? "8px" : "9px", 
          color: "#666",
          fontStyle: "italic"
        }}>
          {getText("Escanea para ver detalles", "Scan to view details")}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: size === "58mm" ? "16px" : "20px", 
        paddingTop: size === "58mm" ? "12px" : "16px", 
        borderTop: "2px double #000", 
        textAlign: "center", 
        fontSize: size === "58mm" ? "10px" : "12px", 
        color: "black",
        pageBreakInside: "avoid",
        fontWeight: "bold"
      }}>
        <div style={{ marginBottom: "8px" }}>{footerText}</div>
        <div style={{ fontSize: size === "58mm" ? "8px" : "9px", color: "#666", fontWeight: "normal" }}>
          {getText("¡Vuelve pronto!", "Come back soon!")}
        </div>
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;
