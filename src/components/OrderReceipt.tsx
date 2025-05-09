"use client"

import type React from "react"
import { useEffect, useState } from "react"
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

  // Format date in a more compact way for receipts
  const formatReceiptDate = (date: Date | string | number) => {
    const d = new Date(date)
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
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

  // Generate barcode (more realistic)
  const generateBarcode = () => {
    // Create a pattern based on order ID
    const id = order.id.toString()
    let pattern = ""

    // Create a pattern of thick and thin lines
    for (let i = 0; i < 30; i++) {
      const charCode = (id.charCodeAt(i % id.length) || 0) % 4
      if (charCode === 0) pattern += "█  "
      else if (charCode === 1) pattern += "██ "
      else if (charCode === 2) pattern += "███"
      else pattern += "█ █"
    }

    return pattern
  }

  // Generate receipt number (combination of date and order ID)
  const receiptNumber = `${new Date(order.createdAt).getFullYear()}${(new Date(order.createdAt).getMonth() + 1).toString().padStart(2, "0")}${order.id.slice(-6)}`

  return (
    <div
      className={`p-4 ${contentWidthClass} bg-white rounded-md shadow-md print:shadow-none`}
      id="print-content"
      style={{
        fontFamily: "monospace",
        fontSize: settings.printerSize === "58mm" ? "12px" : "14px",
        lineHeight: "1.3",
        letterSpacing: "0.02em",
      }}
    >
      {receiptType === "customer" ? (
        <>
          {/* Customer receipt header */}
          <div className="text-center mb-3">
            <p className="font-bold text-lg uppercase tracking-wider">{businessName || headerLines[0]}</p>
            {headerLines.slice(1).map((line, index) => (
              <p key={`header-${index}`} className="text-center">
                {line}
              </p>
            ))}
            <p className="text-xs mt-1">Tel: 11-2233-4455</p>
          </div>

          <div className="text-center my-2">{dottedLine}</div>

          <div className="flex justify-between text-xs mb-1">
            <span>RECIBO: #{receiptNumber}</span>
            <span>CAJA #1</span>
          </div>

          <div className="flex justify-between text-xs mb-2">
            <span>FECHA: {formatReceiptDate(order.createdAt)}</span>
            <span>CAJERO: Admin</span>
          </div>

          <div className="text-center my-2">{dottedLine}</div>

          <div className="text-center font-bold mb-1 uppercase">
            {order.orderType === "mesa"
              ? `Mesa ${order.tableNumber || "Sin asignar"}`
              : order.orderType === "delivery"
                ? "Delivery"
                : "Para llevar"}
          </div>

          <div className="text-center my-2">{dottedLine}</div>

          <div className="flex justify-between mb-1">
            <span className="font-bold">Descripción</span>
            <span className="font-bold">Precio</span>
          </div>

          {order.items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between py-0.5">
              <div className="max-w-[70%]">
                <span className="inline-block min-w-[2ch] mr-1">{item.quantity}x</span>
                {item.name} {item.size ? `(${getSizeAbbreviation(item.size)})` : ""}
              </div>
              <div className="text-right min-w-[30%]">{formatCurrency(item.price * item.quantity)}</div>
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

          <div className="text-center my-2">{dottedLine}</div>

          <div className="mt-2">
            <div className="font-bold">Tarjeta bancaria</div>
            <div className="flex justify-between text-xs">
              <span>Número de tarjeta</span>
              <span>XXXX-XXXX-XXXX-{order.id.slice(-4)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Código de aprobación</span>
              <span>#{order.id.slice(-6)}</span>
            </div>
          </div>

          <div className="text-center my-2">{dottedLine}</div>

          <div className="text-center mt-3 mb-2 font-bold tracking-wide">¡GRACIAS POR SU COMPRA!</div>

          <div className="text-xs text-center mb-3">
            {footerLines.map((line, index) => (
              <p key={`footer-${index}`}>{line}</p>
            ))}
          </div>

          <div className="text-center text-xs mb-2">COPIA CLIENTE</div>

          <div className="flex justify-center mt-3">
            <div
              className="text-center"
              style={{
                fontFamily: "monospace",
                letterSpacing: "-1px",
                fontSize: "16px",
                lineHeight: "0.8",
              }}
            >
              {generateBarcode()}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Kitchen receipt */}
          <div className="text-center mb-2">
            <p className="font-bold text-lg uppercase tracking-wider">{businessName || headerLines[0]}</p>
          </div>

          <div className="text-center my-2">{dottedLine}</div>

          <div className="text-center font-bold mb-1 uppercase">Comanda de Cocina</div>

          <div className="flex justify-between text-xs mb-2">
            <span>ORDEN: #{order.id.slice(-4)}</span>
            <span>FECHA: {formatReceiptDate(order.createdAt)}</span>
          </div>

          <div className="text-center my-2">{dottedLine}</div>

          <div className="text-center font-bold mb-2 uppercase bg-gray-100 py-1">
            {order.orderType === "mesa"
              ? `Mesa ${order.tableNumber || "Sin asignar"}`
              : order.orderType === "delivery"
                ? "Delivery"
                : "Para llevar"}
          </div>

          <div className="font-bold mb-1 uppercase">Productos:</div>

          {order.items.map((item: any, index: number) => {
            const isSentToKitchen = hasBeenSentToKitchen(item)

            return (
              <div key={index} className={`py-0.5 ${isSentToKitchen ? "line-through text-gray-500" : ""}`}>
                <div>
                  <span className="inline-block min-w-[2ch] mr-1 font-bold">{item.quantity}x</span>
                  {item.name} {item.size ? `(${getSizeAbbreviation(item.size)})` : ""}
                </div>
                {item.notes && (
                  <div className="ml-4 text-xs border-l-2 border-gray-300 pl-1 mt-0.5">Notas: {item.notes}</div>
                )}
              </div>
            )
          })}

          <div className="text-center my-2">{dottedLine}</div>

          <div className="flex justify-between text-xs">
            <span>IMPRESO: {formatReceiptDate(new Date())}</span>
            <span>PREPARACIÓN: INMEDIATA</span>
          </div>
        </>
      )}
    </div>
  )
}
