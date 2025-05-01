// Exporta todas las funciones de la base de datos para uso en la aplicación

export * from "./indexed-db"
export * from "./supabase-sync"

// Tipos de datos para la aplicación

// Producto
export interface Product {
  id?: number
  name: string
  price: number
  cost: number
  category: string
  image: string
  stock: number
  minStock: number
  barcode: string
  sku: string
  description: string
  taxable: boolean
  active: boolean
  location: string
  supplier: string
  lastUpdated: string
}

// Cliente
export interface Customer {
  id?: number
  name: string
  email: string
  phone: string
  type: string
  taxId: string
  address: string
  totalPurchases: number
  lastPurchase: string
  notes: string
  createdAt: string
}

// Venta
export interface Sale {
  id?: number
  date: string
  customerId: number
  customerName: string
  items: SaleItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: string
  paymentStatus: string
  notes: string
  receiptNumber: string
  invoiceNumber: string
  userId: number
  userName: string
}

// Ítem de venta
export interface SaleItem {
  productId: number
  productName: string
  quantity: number
  price: number
  discount: number
  tax: number
  total: number
}

// Movimiento de inventario
export interface InventoryMovement {
  id?: number
  date: string
  productId: number
  productName: string
  type: "entrada" | "salida" | "ajuste"
  quantity: number
  reference: string
  notes: string
  userId: number
  userName: string
}

// Configuración
export interface Settings {
  general: {
    businessName: string
    legalName: string
    taxId: string
    phone: string
    email: string
    address: string
    website: string
    logo: string
    currency: string
    language: string
    timeZone: string
  }
  tax: {
    ivaEnabled: boolean
    ivaRate: number
    ivaIncluded: boolean
    exemptionEnabled: boolean
    exemptionCode: string
    otherTaxesEnabled: boolean
    serviceTaxEnabled: boolean
    serviceTaxRate: number
  }
  printing: {
    receiptPrinterEnabled: boolean
    receiptPrinterName: string
    receiptWidth: number
    receiptHeader: string
    receiptFooter: string
    showLogo: boolean
    showBarcode: boolean
    autoPrint: boolean
    printCopies: number
    emailReceipt: boolean
  }
  backup: {
    autoBackup: boolean
    backupFrequency: string
    backupTime: string
    cloudBackup: boolean
    localBackup: boolean
    backupLocation: string
    lastBackup: string
    encryptBackup: boolean
  }
  user: {
    multipleUsers: boolean
    requireLogin: boolean
    sessionTimeout: number
    passwordPolicy: string
    twoFactorAuth: boolean
  }
  invoice: {
    electronicInvoiceEnabled: boolean
    haciendaUsername: string
    haciendaPassword: string
    certificateExpiration: string
    environment: string
    autoSend: boolean
    sendCopy: boolean
  }
  connection: {
    offlineMode: boolean
    syncOnConnect: boolean
    syncFrequency: string
    prioritySyncItems: string[]
    connectionTimeout: number
  }
}

// Usuario
export interface User {
  id?: number
  username: string
  password: string
  name: string
  email: string
  role: string
  active: boolean
  lastLogin: string
  createdAt: string
}
