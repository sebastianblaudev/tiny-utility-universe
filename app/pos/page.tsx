"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Check,
  CreditCard,
  DollarSign,
  FileText,
  Minus,
  Percent,
  Plus,
  Receipt,
  Save,
  Search,
  ShoppingBag,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Datos de ejemplo
const categories = ["Todos", "Bebidas", "Comidas", "Postres", "Snacks", "Café", "Promociones"]

const products = [
  {
    id: 1,
    name: "Café Americano",
    price: 1500,
    category: "Café",
    image: "/placeholder.svg?height=80&width=80",
    stock: 100,
    barcode: "7890123456789",
  },
  {
    id: 2,
    name: "Cappuccino",
    price: 2200,
    category: "Café",
    image: "/placeholder.svg?height=80&width=80",
    stock: 100,
    barcode: "7890123456790",
  },
  {
    id: 3,
    name: "Latte",
    price: 2500,
    category: "Café",
    image: "/placeholder.svg?height=80&width=80",
    stock: 100,
    barcode: "7890123456791",
  },
  {
    id: 4,
    name: "Espresso",
    price: 1200,
    category: "Café",
    image: "/placeholder.svg?height=80&width=80",
    stock: 100,
    barcode: "7890123456792",
  },
  {
    id: 5,
    name: "Sandwich de Pollo",
    price: 3500,
    category: "Comidas",
    image: "/placeholder.svg?height=80&width=80",
    stock: 50,
    barcode: "7890123456793",
  },
  {
    id: 6,
    name: "Ensalada César",
    price: 4200,
    category: "Comidas",
    image: "/placeholder.svg?height=80&width=80",
    stock: 30,
    barcode: "7890123456794",
  },
  {
    id: 7,
    name: "Jugo Natural",
    price: 1800,
    category: "Bebidas",
    image: "/placeholder.svg?height=80&width=80",
    stock: 80,
    barcode: "7890123456795",
  },
  {
    id: 8,
    name: "Agua Mineral",
    price: 1000,
    category: "Bebidas",
    image: "/placeholder.svg?height=80&width=80",
    stock: 120,
    barcode: "7890123456796",
  },
  {
    id: 9,
    name: "Cheesecake",
    price: 2800,
    category: "Postres",
    image: "/placeholder.svg?height=80&width=80",
    stock: 25,
    barcode: "7890123456797",
  },
  {
    id: 10,
    name: "Brownie",
    price: 1500,
    category: "Postres",
    image: "/placeholder.svg?height=80&width=80",
    stock: 40,
    barcode: "7890123456798",
  },
  {
    id: 11,
    name: "Papas Fritas",
    price: 1200,
    category: "Snacks",
    image: "/placeholder.svg?height=80&width=80",
    stock: 60,
    barcode: "7890123456799",
  },
  {
    id: 12,
    name: "Nachos",
    price: 2500,
    category: "Snacks",
    image: "/placeholder.svg?height=80&width=80",
    stock: 45,
    barcode: "7890123456800",
  },
  {
    id: 13,
    name: "Té Chai",
    price: 1800,
    category: "Café",
    image: "/placeholder.svg?height=80&width=80",
    stock: 70,
    barcode: "7890123456801",
  },
  {
    id: 14,
    name: "Muffin de Arándanos",
    price: 1300,
    category: "Postres",
    image: "/placeholder.svg?height=80&width=80",
    stock: 35,
    barcode: "7890123456802",
  },
  {
    id: 15,
    name: "Refresco",
    price: 900,
    category: "Bebidas",
    image: "/placeholder.svg?height=80&width=80",
    stock: 150,
    barcode: "7890123456803",
  },
  {
    id: 16,
    name: "Combo Desayuno",
    price: 4500,
    category: "Promociones",
    image: "/placeholder.svg?height=80&width=80",
    stock: 20,
    barcode: "7890123456804",
  },
  {
    id: 17,
    name: "Combo Almuerzo",
    price: 5500,
    category: "Promociones",
    image: "/placeholder.svg?height=80&width=80",
    stock: 20,
    barcode: "7890123456805",
  },
  {
    id: 18,
    name: "Galletas",
    price: 800,
    category: "Snacks",
    image: "/placeholder.svg?height=80&width=80",
    stock: 80,
    barcode: "7890123456806",
  },
]

const customers = [
  { id: 1, name: "Cliente General", email: "", phone: "", type: "general" },
  { id: 2, name: "Juan Mora", email: "juan.mora@example.com", phone: "8888-1234", type: "regular" },
  { id: 3, name: "Sofía Castro", email: "sofia@example.com", phone: "8765-4321", type: "regular" },
  { id: 4, name: "Carlos Rodríguez", email: "carlos@example.com", phone: "6123-7890", type: "regular" },
  { id: 5, name: "Laura Vargas", email: "laura@example.com", phone: "7890-1234", type: "vip" },
]

type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
  discount?: number
  notes?: string
}

type Customer = {
  id: number
  name: string
  email: string
  phone: string
  type: string
}

export default function POSPage() {
  const { toast } = useToast()
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[0])
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [currentItem, setCurrentItem] = useState<CartItem | null>(null)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [cashAmount, setCashAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [orderNote, setOrderNote] = useState("")
  const [receiptNumber, setReceiptNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Generar un número de recibo aleatorio al cargar la página
  useEffect(() => {
    const randomReceiptNumber = Math.floor(100000 + Math.random() * 900000).toString()
    setReceiptNumber(randomReceiptNumber)
  }, [])

  // Manejar entrada de código de barras
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si estamos en un campo de entrada, no procesamos
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return
      }

      // Solo aceptamos números y Enter
      if ((/^\d$/.test(e.key) || e.key === "Enter") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.key === "Enter" && barcodeInput.length > 0) {
          // Buscar producto por código de barras
          const product = products.find((p) => p.barcode === barcodeInput)
          if (product) {
            addToCart(product)
            toast({
              title: "Producto añadido",
              description: `${product.name} añadido al carrito`,
            })
          } else {
            toast({
              variant: "destructive",
              title: "Producto no encontrado",
              description: `No se encontró ningún producto con el código ${barcodeInput}`,
            })
          }
          setBarcodeInput("")
        } else if (e.key !== "Enter") {
          setBarcodeInput((prev) => prev + e.key)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [barcodeInput])

  // Limpiar el código de barras después de 500ms de inactividad
  useEffect(() => {
    const timer = setTimeout(() => {
      if (barcodeInput.length > 0 && barcodeInput.length < 12) {
        setBarcodeInput("")
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [barcodeInput])

  const filteredProducts = products.filter(
    (product) =>
      (activeCategory === "Todos" || product.category === activeCategory) &&
      (searchQuery === "" || product.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const addToCart = (product: (typeof products)[0]) => {
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }

    setCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const editCartItem = (item: CartItem) => {
    setCurrentItem(item)
    setShowItemDialog(true)
  }

  const saveItemChanges = () => {
    if (!currentItem) return

    setCart(cart.map((item) => (item.id === currentItem.id ? currentItem : item)))
    setShowItemDialog(false)
    setCurrentItem(null)
  }

  const applyGlobalDiscount = (percentage: number) => {
    setGlobalDiscount(percentage)
  }

  const clearCart = () => {
    setCart([])
    setGlobalDiscount(0)
    setOrderNote("")
  }

  const saveOrder = () => {
    toast({
      title: "Orden guardada",
      description: "La orden ha sido guardada correctamente",
    })
  }

  const processPayment = () => {
    setIsProcessing(true)

    // Simulamos un proceso de pago
    setTimeout(() => {
      setIsProcessing(false)
      setShowPaymentDialog(false)
      setShowReceiptDialog(true)

      // Generar nuevo número de recibo para la próxima venta
      const newReceiptNumber = Math.floor(100000 + Math.random() * 900000).toString()
      setReceiptNumber(newReceiptNumber)

      toast({
        title: "Pago procesado",
        description: "El pago ha sido procesado correctamente",
      })
    }, 1500)
  }

  const finishTransaction = () => {
    setShowReceiptDialog(false)
    clearCart()
    setSelectedCustomer(customers[0])
  }

  const subtotal = cart.reduce((sum, item) => {
    const itemDiscount = item.discount || 0
    const discountedPrice = item.price * (1 - itemDiscount / 100)
    return sum + discountedPrice * item.quantity
  }, 0)

  const discountAmount = subtotal * (globalDiscount / 100)
  const discountedSubtotal = subtotal - discountAmount
  const tax = discountedSubtotal * 0.13 // 13% IVA en Costa Rica
  const total = discountedSubtotal + tax

  const change = cashAmount ? Number.parseFloat(cashAmount) - total : 0

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Productos */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => (window.location.href = "/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Punto de Venta</h1>
            {barcodeInput && (
              <Badge variant="outline" className="ml-2 px-2 py-1">
                Escaneando: {barcodeInput}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Cajero</h4>
                  <Button variant="ghost" size="sm">
                    Cerrar Sesión
                  </Button>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center gap-4 py-2">
                  <Avatar>
                    <AvatarFallback>CA</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Carlos Alvarado</p>
                    <p className="text-xs text-muted-foreground">Cajero Principal</p>
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="grid gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Caja:</span>
                    <span>Caja #1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Turno:</span>
                    <span>Mañana (8:00 - 16:00)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ventas del día:</span>
                    <span>24</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <div className="p-4">
          <ScrollArea className="whitespace-nowrap pb-3">
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square relative">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                  {product.stock < 10 && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      Stock bajo: {product.stock}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-muted-foreground">₡{product.price.toLocaleString()}</p>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Carrito */}
      <div className="w-96 bg-white dark:bg-gray-800 border-l flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="font-bold text-lg">Carrito de Compra</h2>
            <Badge className="ml-auto">{cart.length} items</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 justify-start overflow-hidden"
              onClick={() => setShowCustomerDialog(true)}
            >
              <User className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{selectedCustomer.name}</span>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => clearCart()}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Limpiar carrito</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mb-2 opacity-20" />
              <p>El carrito está vacío</p>
              <p className="text-sm">Agregue productos haciendo clic en ellos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{item.name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          ₡{item.price.toLocaleString()}
                          {item.discount && item.discount > 0 && (
                            <span className="ml-1 text-green-600">(-{item.discount}%)</span>
                          )}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => editCartItem(item)}
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="font-medium">
                      ₡{(item.price * (1 - (item.discount || 0) / 100) * item.quantity).toLocaleString()}
                    </div>
                  </div>
                  {item.notes && (
                    <div className="text-xs text-muted-foreground bg-muted p-1 rounded">Nota: {item.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₡{subtotal.toLocaleString()}</span>
            </div>
            {globalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento ({globalDiscount}%)</span>
                <span>-₡{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA (13%)</span>
              <span>₡{tax.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₡{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => applyGlobalDiscount(10)}
              disabled={cart.length === 0}
            >
              <Percent className="h-4 w-4 mr-2" />
              10%
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => applyGlobalDiscount(15)}
              disabled={cart.length === 0}
            >
              <Percent className="h-4 w-4 mr-2" />
              15%
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="outline" className="w-full" onClick={saveOrder} disabled={cart.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
            <Button className="w-full" onClick={() => setShowPaymentDialog(true)} disabled={cart.length === 0}>
              <Receipt className="h-4 w-4 mr-2" />
              Pagar
            </Button>
          </div>
        </div>
      </div>

      {/* Diálogo de selección de cliente */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Cliente</DialogTitle>
            <DialogDescription>Seleccione un cliente existente o cree uno nuevo</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <Input placeholder="Buscar cliente..." />
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-muted ${
                    selectedCustomer.id === customer.id ? "border-primary bg-primary/10" : ""
                  }`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
                      </div>
                    </div>
                    {customer.type === "vip" && <Badge className="bg-amber-500 hover:bg-amber-600">VIP</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">Nuevo Cliente</Button>
              <Button onClick={() => setShowCustomerDialog(false)}>Seleccionar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de edición de item */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>Modifique los detalles del producto seleccionado</DialogDescription>
          </DialogHeader>
          {currentItem && (
            <div className="py-4 space-y-4">
              <div>
                <h3 className="font-medium">{currentItem.name}</h3>
                <p className="text-sm text-muted-foreground">₡{currentItem.price.toLocaleString()} por unidad</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentItem({ ...currentItem, quantity: Math.max(1, currentItem.quantity - 1) })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number.parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentItem({ ...currentItem, quantity: currentItem.quantity + 1 })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discount">Descuento (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={currentItem.discount || 0}
                  onChange={(e) => setCurrentItem({ ...currentItem, discount: Number.parseInt(e.target.value) || 0 })}
                  min="0"
                  max="100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  value={currentItem.notes || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, notes: e.target.value })}
                  placeholder="Ej: Sin azúcar, para llevar, etc."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveItemChanges}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>Seleccione el método de pago y complete la transacción</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Tabs defaultValue="cash" onValueChange={setPaymentMethod}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="cash">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Efectivo
                </TabsTrigger>
                <TabsTrigger value="card">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Tarjeta
                </TabsTrigger>
                <TabsTrigger value="other">
                  <Wallet className="h-4 w-4 mr-2" />
                  Otros
                </TabsTrigger>
              </TabsList>
              <TabsContent value="cash" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="cash-amount">Monto Recibido</Label>
                  <Input
                    id="cash-amount"
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                {Number.parseFloat(cashAmount) > 0 && (
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted">
                    <div>
                      <p className="text-sm text-muted-foreground">Total a Pagar</p>
                      <p className="text-lg font-bold">₡{total.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cambio</p>
                      <p className={`text-lg font-bold ${change < 0 ? "text-red-500" : "text-green-600"}`}>
                        ₡{change.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" onClick={() => setCashAmount("1000")}>
                    ₡1,000
                  </Button>
                  <Button variant="outline" onClick={() => setCashAmount("2000")}>
                    ₡2,000
                  </Button>
                  <Button variant="outline" onClick={() => setCashAmount("5000")}>
                    ₡5,000
                  </Button>
                  <Button variant="outline" onClick={() => setCashAmount("10000")}>
                    ₡10,000
                  </Button>
                  <Button variant="outline" onClick={() => setCashAmount("20000")}>
                    ₡20,000
                  </Button>
                  <Button variant="outline" onClick={() => setCashAmount(total.toString())}>
                    Exacto
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="card" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="card-type">Tipo de Tarjeta</Label>
                  <Select defaultValue="visa">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de tarjeta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="mastercard">Mastercard</SelectItem>
                      <SelectItem value="amex">American Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="terminal">Terminal</Label>
                  <Select defaultValue="terminal1">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar terminal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="terminal1">Terminal Principal</SelectItem>
                      <SelectItem value="terminal2">Terminal Secundaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="auth-code">Código de Autorización</Label>
                  <Input id="auth-code" placeholder="Opcional" />
                </div>
              </TabsContent>
              <TabsContent value="other" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="payment-method">Método de Pago</Label>
                  <Select defaultValue="sinpe">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sinpe">SINPE Móvil</SelectItem>
                      <SelectItem value="transfer">Transferencia Bancaria</SelectItem>
                      <SelectItem value="credit">Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reference">Número de Referencia</Label>
                  <Input id="reference" placeholder="Número de referencia" />
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="invoice" />
                <Label htmlFor="invoice">Generar factura electrónica</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="email-receipt" />
                <Label htmlFor="email-receipt">Enviar recibo por correo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={processPayment}
              disabled={
                (paymentMethod === "cash" && (Number.parseFloat(cashAmount) < total || !cashAmount)) || isProcessing
              }
            >
              {isProcessing ? (
                <>Procesando...</>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Completar Pago
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de recibo */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recibo de Venta</DialogTitle>
            <DialogDescription>Venta completada exitosamente</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">¡Pago Completado!</h3>
              <p className="text-sm text-muted-foreground">Recibo #{receiptNumber}</p>
            </div>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hora:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span>{selectedCustomer.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Método de pago:</span>
                <span>{paymentMethod === "cash" ? "Efectivo" : paymentMethod === "card" ? "Tarjeta" : "Otro"}</span>
              </div>
              <Separator />
              <div className="space-y-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity} x {item.name}
                      {item.discount && item.discount > 0 && (
                        <span className="text-green-600 ml-1">(-{item.discount}%)</span>
                      )}
                    </span>
                    <span>₡{(item.price * (1 - (item.discount || 0) / 100) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>₡{subtotal.toLocaleString()}</span>
              </div>
              {globalDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento ({globalDiscount}%):</span>
                  <span>-₡{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (13%):</span>
                <span>₡{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>₡{total.toLocaleString()}</span>
              </div>
              {paymentMethod === "cash" && Number.parseFloat(cashAmount) > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Efectivo recibido:</span>
                    <span>₡{Number.parseFloat(cashAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cambio:</span>
                    <span>₡{change.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="sm:flex-1" onClick={() => setShowReceiptDialog(false)}>
              <FileText className="mr-2 h-4 w-4" />
              Imprimir Recibo
            </Button>
            <Button className="sm:flex-1" onClick={finishTransaction}>
              <Check className="mr-2 h-4 w-4" />
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
