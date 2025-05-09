"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { formatDate } from "@/lib/utils"
import { initDB } from "@/lib/db"

interface OrderReceiptProps {
  order: any
  receiptType: "customer" | "kitchen"
}

type ReceiptSettings = {
  logoUrl: string | null
  header: string
  footer: string
  printerSize: string
  receiptPrinter: string
  kitchenPrinter: string
}

const defaultSettings: ReceiptSettings = {
  logoUrl: null,
  header: "Pizza Point\nCalle Ejemplo 123\nTel: (123) 456-7890",
  footer: "¡Gracias por su compra!\nConserve este ticket como comprobante",
  printerSize: "58mm",
  receiptPrinter: "",
  kitchenPrinter: "",
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, receiptType }) => {
  const [settings, setSettings] = useState<ReceiptSettings>(defaultSettings)
  const [businessName, setBusinessName] = useState<string>("")
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [sentToKitchenItems, setSentToKitchenItems] = useState<string[]>([])

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        const db = await initDB()
        const businessInfo = await db.get("business", "businessInfo")
        if (businessInfo) {
          setBusinessName(businessInfo.name || "")
        }
      } catch (error) {
        console.error("Error loading business data:", error)
      }
    }

    const loadSettings = async () => {
      try {
        const savedSettings = localStorage.getItem("receiptSettings")
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }

    // Load sent to kitchen items if this is a saved order
    const loadSentToKitchenItems = async () => {
      if (order.tableNumber && order.sentToKitchenItems && Array.isArray(order.sentToKitchenItems)) {
        setSentToKitchenItems(order.sentToKitchenItems)
      } else if (order.tableNumber) {
        try {
          const db = await initDB()
          const kitchenRecords = await db.getAll("kitchenRecords")

          // Find records for this specific table
          const tableRecords = kitchenRecords.filter((record) => record.tableNumber === order.tableNumber)

          if (tableRecords.length > 0) {
            // Extract all item IDs that have been sent to kitchen
            const sentItems = tableRecords.reduce((acc: string[], record) => {
              if (record.items && Array.isArray(record.items)) {
                const itemIds = record.items.map((item: any) => item.id || item.productId)
                return [...acc, ...itemIds]
              }
              return acc
            }, [])

            setSentToKitchenItems(sentItems)
          }
        } catch (error) {
          console.error("Error loading kitchen records:", error)
        }
      }
    }

    // Load all data and then mark as loaded
    Promise.all([loadBusinessData(), loadSettings(), loadSentToKitchenItems()]).finally(() => {
      setIsLoaded(true)
    })
  }, [order.tableNumber, order.sentToKitchenItems])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
      .format(amount)
      .replace("ARS", "")
      .trim()
  }

  const getSizeAbbreviation = (size: string) => {
    switch (size?.toLowerCase()) {
      case "personal":
        return "P"
      case "mediana":
        return "M"
      case "familiar":
        return "F"
      default:
        return size
    }
  }

  // Check if an item has been sent to kitchen
  const hasBeenSentToKitchen = (item: any) => {
    const itemId = item.id || item.productId
    return sentToKitchenItems.includes(itemId)
  }

  // If not loaded yet, render a minimal placeholder to avoid blank output
  if (!isLoaded) {
    return (
      <div className="p-4 min-w-[200px] max-w-[280px] text-sm">
        <div className="text-center mb-4">
          <p className="text-xl font-bold mb-1">Cargando recibo...</p>
        </div>
      </div>
    )
  }

  const headerLines = settings.header.split("\n")
  const footerLines = settings.footer.split("\n")
  const contentWidthClass =
    settings.printerSize === "80mm" ? "min-w-[300px] max-w-[400px]" : "min-w-[200px] max-w-[280px]"

  // Use the total directly from the order
  const total = order.total
  const taxEnabled = order.taxSettings?.taxEnabled || false
  const taxPercentage = order.taxSettings?.taxPercentage || 0
  const taxAmount = order.tax || 0

  // Generate dotted line
  const dottedLine = "·".repeat(settings.printerSize === "80mm" ? 48 : 32)

  // Generate barcode (placeholder)
  const barcode = "llllllllllllllllllllllllllllllll"

  return (
    <div
      className={`p-4 ${contentWidthClass} bg-white rounded-md shadow-md print:shadow-none`}
      id="print-content"
      style={{
        fontFamily: "monospace",
        fontSize: settings.printerSize === "58mm" ? "12px" : "14px",
        lineHeight: "1.2",
      }}
    >
      {receiptType === "customer" ? (
        <>
          {/* Customer receipt header */}
          <div className="text-center mb-2">
            <p className="font-bold text-lg uppercase">{businessName || headerLines[0]}</p>
            {headerLines.slice(1).map((line, index) => (
              <p key={`header-${index}`} className="text-center">
                {line}
              </p>
            ))}
          </div>

          <div className="text-center my-2">{dottedLine}</div>

          <div className="text-center font-bold mb-1">
            {order.orderType === "mesa"
              ? `MESA ${order.tableNumber || "Sin asignar"}`
              : order.orderType === "delivery"
                ? "DELIVERY"
                : "PARA LLEVAR"}
          </div>

          <div className="text-center mb-2">RECIBO #{order.id.slice(-4)}</div>

          <div className="text-center my-2">{dottedLine}</div>

          <div className="flex justify-between mb-1">
            <span className="font-bold">Descripción</span>
            <span className="font-bold">Precio</span>
          </div>

          {order.items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between">
              <div>
                {item.quantity}x {item.name} {item.size ? `(${getSizeAbbreviation(item.size)})` : ""}
              </div>
              <div>{formatCurrency(item.price * item.quantity)}</div>
            </div>
          ))}

          <div className="text-center my-2">{dottedLine}</div>

          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          {order.tip > 0 && (
            <div className="flex justify-between">
              <span>Propina</span>
              <span>{formatCurrency(order.tip)}</span>
            </div>
          )}

          {taxEnabled && taxPercentage > 0 && (
            <div className="flex justify-between">
              <span>IVA ({taxPercentage}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          )}

          <div className="mt-2">
            <div className="flex justify-between">
              <span>Pago</span>
              <span>{formatCurrency(total + (order.tip || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span>Cambio</span>
              <span>0.0</span>
            </div>
          </div>

          <div className="mt-2">
            <div>Tarjeta bancaria</div>
            <div className="flex justify-between">
              <span>Código de aprobación</span>
              <span>#{order.id.slice(-6)}</span>
            </div>
          </div>

          <div className="text-center mt-4 mb-2 font-bold">¡GRACIAS POR SU COMPRA!</div>

          <div className="flex justify-center mt-3">
            <div
              className="text-center"
              style={{
                fontFamily: "monospace",
                letterSpacing: "-0.5px",
                fontSize: "16px",
                lineHeight: "0.8",
              }}
            >
              {barcode.split("").map((char, i) => (
                <span key={i} style={{ display: "inline-block", width: "2px" }}>
                  {char === "l" ? "█" : " "}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Kitchen receipt */}
          <div className="text-center mb-2">
            <p className="font-bold text-lg uppercase">{businessName || headerLines[0]}</p>
          </div>

          <div className="text-center my-2">{dottedLine}</div>

          <div className="text-center font-bold mb-1">COMANDA DE COCINA</div>

          <div className="text-center mb-2">
            {order.orderType === "mesa"
              ? `MESA ${order.tableNumber || "Sin asignar"}`
              : order.orderType === "delivery"
                ? "DELIVERY"
                : "PARA LLEVAR"}
          </div>

          <div className="text-center my-2">{dottedLine}</div>

          <div className="font-bold mb-1">PRODUCTOS:</div>

          {order.items.map((item: any, index: number) => {
            const isSentToKitchen = hasBeenSentToKitchen(item)

            return (
              <div key={index} className={isSentToKitchen ? "line-through" : ""}>
                {item.quantity}x {item.name} {item.size ? `(${getSizeAbbreviation(item.size)})` : ""}
                {item.notes && <div className="ml-4 text-xs">Notas: {item.notes}</div>}
              </div>
            )
          })}

          <div className="text-center my-2">{dottedLine}</div>

          <div className="text-center text-sm">{formatDate(new Date())}</div>
        </>
      )}
    </div>
  )
}
