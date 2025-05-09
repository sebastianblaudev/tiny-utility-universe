"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { MapPin, Phone, User, CheckCircle, Clock, Receipt, ChefHat } from "lucide-react"
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
    }).format(amount)
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
  const fontSizeClass = settings.printerSize === "58mm" ? "text-xs" : "text-sm"

  // Use the total directly from the order
  const total = order.total
  const taxEnabled = order.taxSettings?.taxEnabled || false
  const taxPercentage = order.taxSettings?.taxPercentage || 0
  const taxAmount = order.tax || 0

  const hasCustomerInfo = order.customerName || order.customerPhone || order.customerTelephone

  // Get order type badge styling
  const getOrderTypeBadge = () => {
    switch (order.orderType) {
      case "mesa":
        return {
          bg: "bg-amber-100",
          text: "text-amber-800",
          icon: <Receipt className="h-4 w-4" />,
          label: `Mesa ${order.tableNumber || "Sin asignar"}`,
        }
      case "delivery":
        return {
          bg: "bg-sky-100",
          text: "text-sky-800",
          icon: <MapPin className="h-4 w-4" />,
          label: "DELIVERY",
        }
      case "takeaway":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-800",
          icon: <CheckCircle className="h-4 w-4" />,
          label: "PARA LLEVAR",
        }
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          icon: <Receipt className="h-4 w-4" />,
          label: "Orden",
        }
    }
  }

  const orderTypeBadge = getOrderTypeBadge()

  return (
    <div
      className={`p-4 ${contentWidthClass} ${fontSizeClass} bg-white rounded-md shadow-md print:shadow-none`}
      id="print-content"
      style={{ fontFamily: "'Arial', sans-serif" }}
    >
      {receiptType === "customer" ? (
        <>
          {/* Customer receipt header */}
          <div className="text-center mb-4">
            {settings.logoUrl && (
              <div className="flex justify-center mb-3">
                <img
                  src={settings.logoUrl || "/placeholder.svg"}
                  alt="Logo"
                  className={`${settings.printerSize === "58mm" ? "h-16" : "h-20"} max-w-[200px] object-contain`}
                  style={{ background: "#fff", padding: "4px" }}
                />
              </div>
            )}
            <p className={`${settings.printerSize === "58mm" ? "text-xl" : "text-2xl"} font-bold mb-1`}>
              {businessName || headerLines[0]}
            </p>
            <div className="border-t border-b border-gray-300 py-2 my-2">
              {headerLines.slice(1).map((line, index) => (
                <p
                  key={`header-${index}`}
                  className={`${settings.printerSize === "58mm" ? "text-xs" : "text-sm"} text-gray-600`}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">{formatDate(order.createdAt)}</span>
              </div>
              <div className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-md text-sm">
                Orden #{order.id.slice(-4)}
              </div>
            </div>

            {/* Order type badge */}
            <div
              className={`${orderTypeBadge.bg} ${orderTypeBadge.text} font-medium p-2 rounded-md text-center flex items-center justify-center gap-2 mb-3`}
            >
              {orderTypeBadge.icon}
              <span>{orderTypeBadge.label}</span>
            </div>

            {/* Cliente información */}
            {hasCustomerInfo && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 mb-3">
                <div className="flex items-start gap-2 mb-2">
                  <User className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                  <div className="font-medium">{order.customerName}</div>
                </div>

                {order.customerPhone && (
                  <div className="flex items-start gap-2 mb-2">
                    <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                    <div>{order.customerPhone}</div>
                  </div>
                )}

                {order.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                    <div>
                      <div>{order.address.street}</div>
                      {order.address.reference && (
                        <div className={`${settings.printerSize === "58mm" ? "text-[10px]" : "text-xs"} text-gray-500`}>
                          Ref: {order.address.reference}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mb-4">
          {/* Kitchen receipt header */}
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ChefHat className="h-6 w-6 text-gray-700" />
              <h2 className={`${settings.printerSize === "58mm" ? "text-xl" : "text-2xl"} font-bold text-gray-800`}>
                COMANDA DE COCINA
              </h2>
            </div>

            <div
              className={`${orderTypeBadge.bg} ${orderTypeBadge.text} font-bold p-2 rounded-md inline-block px-4 mb-2`}
            >
              {orderTypeBadge.label}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDate(order.createdAt)}</span>
            </div>

            <div className="mt-2 bg-gray-800 text-white py-1 px-3 rounded-md inline-block">
              <span className="font-medium">Orden #{order.id.slice(-4)}</span>
            </div>
          </div>

          {/* Información del cliente en recibo de cocina */}
          {hasCustomerInfo && (
            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-500" />
                <div className="font-medium">{order.customerName}</div>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>{order.customerPhone}</div>
                </div>
              )}
            </div>
          )}

          {order.orderType === "delivery" && order.address && (
            <div className="border border-sky-200 rounded-lg p-3 bg-sky-50 mb-3">
              {!hasCustomerInfo && (
                <div className="font-medium mb-1">Cliente: {order.customerName || "No especificado"}</div>
              )}
              {!hasCustomerInfo && order.customerPhone && <div className="mb-2">Tel: {order.customerPhone}</div>}
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-sky-500" />
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

      {/* Items section */}
      <div
        className={`${receiptType === "kitchen" ? "border-2 border-gray-300 rounded-lg p-2 bg-gray-50" : "border border-gray-200 rounded-lg p-2"}`}
      >
        <div className="text-xs uppercase font-bold text-gray-500 mb-1 px-1">
          {receiptType === "kitchen" ? "PRODUCTOS A PREPARAR" : "DETALLE DE LA ORDEN"}
        </div>

        <Table>
          <TableBody>
            {order.items.map((item: any, index: number) => {
              const isSentToKitchen = hasBeenSentToKitchen(item)
              const itemTextClass = receiptType === "kitchen" && isSentToKitchen ? "line-through text-gray-500" : ""

              return (
                <TableRow
                  key={index}
                  className={`border-b ${receiptType === "kitchen" ? "border-gray-300" : "border-gray-200"}`}
                >
                  <TableCell
                    className={`py-2 pl-0 font-medium ${receiptType === "kitchen" ? (settings.printerSize === "58mm" ? "text-sm" : "text-base") : ""} ${itemTextClass}`}
                  >
                    {receiptType === "kitchen" && isSentToKitchen && (
                      <span className="inline-block w-full relative">
                        <span className="absolute top-1/2 left-0 right-0 border-t-2 border-red-500 transform -translate-y-1/2"></span>
                      </span>
                    )}

                    {receiptType === "kitchen" ? (
                      <span
                        className={`inline-block bg-gray-800 text-white px-2 py-0.5 rounded mr-2 ${isSentToKitchen ? "bg-opacity-50" : ""}`}
                      >
                        {item.quantity}x
                      </span>
                    ) : (
                      <span className="inline-block bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-sm mr-1.5 text-xs font-bold">
                        {item.quantity}
                      </span>
                    )}

                    <span
                      className={`${isSentToKitchen && receiptType === "kitchen" ? "line-through text-gray-500" : ""}`}
                    >
                      {item.name}
                      {item.size && (
                        <span
                          className={`ml-1 font-bold ${receiptType === "kitchen" ? "text-gray-700" : ""} ${isSentToKitchen ? "text-gray-500" : ""}`}
                        >
                          ({getSizeAbbreviation(item.size)})
                        </span>
                      )}
                    </span>

                    {receiptType === "kitchen" && isSentToKitchen && (
                      <span className="ml-2 text-xs bg-green-700 text-white px-1 py-0.5 rounded">Enviado</span>
                    )}

                    {receiptType === "kitchen" && item.notes && (
                      <div
                        className={`block ${settings.printerSize === "58mm" ? "text-xs" : "text-sm"} ${isSentToKitchen ? "bg-yellow-50/50 border-yellow-200" : "bg-yellow-50 border-yellow-400"} border-l-4 text-yellow-800 p-2 mt-1 rounded-r`}
                      >
                        <span className="font-bold">Notas:</span> {item.notes}
                      </div>
                    )}
                  </TableCell>
                  {receiptType === "customer" && (
                    <TableCell className="py-2 pr-0 text-right font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {receiptType === "customer" && (
        <div className="mt-4 pt-2">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
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

            <div className="border-t border-gray-300 mt-2 pt-2">
              <div
                className={`flex justify-between font-bold ${settings.printerSize === "58mm" ? "text-base" : "text-lg"}`}
              >
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center border-t border-gray-200 pt-3">
            {footerLines.map((line, index) => (
              <p
                key={`footer-${index}`}
                className={
                  index === 0
                    ? "font-medium"
                    : `${settings.printerSize === "58mm" ? "text-[10px]" : "text-xs"} text-gray-500 mt-1`
                }
              >
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

      {receiptType === "kitchen" && (
        <div className="mt-4 border-t border-gray-300 pt-3 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 text-xs">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(new Date())}</span>
          </div>
        </div>
      )}
    </div>
  )
}