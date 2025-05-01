"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Mail, Phone, ShoppingBag, Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Datos iniciales de clientes (mismos que en la página de clientes)
const initialCustomers = [
  {
    id: 1,
    name: "Juan Mora",
    email: "juan.mora@example.com",
    phone: "8888-1234",
    type: "regular",
    taxId: "1-1234-5678",
    address: "San José, Costa Rica",
    totalPurchases: 320000,
    lastPurchase: "2023-12-10",
    notes: "Cliente frecuente, prefiere pagar en efectivo",
    createdAt: "2023-01-15",
  },
  {
    id: 2,
    name: "Sofía Castro",
    email: "sofia@example.com",
    phone: "8765-4321",
    type: "regular",
    taxId: "1-8765-4321",
    address: "Heredia, Costa Rica",
    totalPurchases: 180000,
    lastPurchase: "2023-12-05",
    notes: "",
    createdAt: "2023-02-20",
  },
  {
    id: 3,
    name: "Carlos Rodríguez",
    email: "carlos@example.com",
    phone: "6123-7890",
    type: "regular",
    taxId: "1-7890-1234",
    address: "Alajuela, Costa Rica",
    totalPurchases: 250000,
    lastPurchase: "2023-11-28",
    notes: "Solicita factura electrónica siempre",
    createdAt: "2023-03-10",
  },
  {
    id: 4,
    name: "Laura Vargas",
    email: "laura@example.com",
    phone: "7890-1234",
    type: "vip",
    taxId: "1-2345-6789",
    address: "Cartago, Costa Rica",
    totalPurchases: 750000,
    lastPurchase: "2023-12-12",
    notes: "Cliente VIP, ofrecer descuentos especiales",
    createdAt: "2023-01-05",
  },
  {
    id: 5,
    name: "Andrés Méndez",
    email: "andres@example.com",
    phone: "8901-2345",
    type: "regular",
    taxId: "1-3456-7890",
    address: "Limón, Costa Rica",
    totalPurchases: 120000,
    lastPurchase: "2023-10-15",
    notes: "",
    createdAt: "2023-04-18",
  },
  {
    id: 6,
    name: "María López",
    email: "maria@example.com",
    phone: "6789-0123",
    type: "vip",
    taxId: "1-4567-8901",
    address: "Puntarenas, Costa Rica",
    totalPurchases: 890000,
    lastPurchase: "2023-12-08",
    notes: "Prefiere ser contactada por WhatsApp",
    createdAt: "2023-02-12",
  },
  {
    id: 7,
    name: "Roberto Jiménez",
    email: "roberto@example.com",
    phone: "7654-3210",
    type: "regular",
    taxId: "1-5678-9012",
    address: "Guanacaste, Costa Rica",
    totalPurchases: 210000,
    lastPurchase: "2023-11-20",
    notes: "",
    createdAt: "2023-05-22",
  },
  {
    id: 8,
    name: "Cliente General",
    email: "",
    phone: "",
    type: "general",
    taxId: "",
    address: "",
    totalPurchases: 1500000,
    lastPurchase: "2023-12-15",
    notes: "Cliente para ventas generales sin registro",
    createdAt: "2023-01-01",
  },
]

// Historial de compras simulado
const purchaseHistory = [
  {
    id: 1,
    date: "2023-12-10",
    amount: 32500,
    items: 3,
    paymentMethod: "Efectivo",
    status: "Completada",
    invoice: "FE-00123",
  },
  {
    id: 2,
    date: "2023-11-25",
    amount: 45800,
    items: 5,
    paymentMethod: "Tarjeta",
    status: "Completada",
    invoice: "FE-00112",
  },
  {
    id: 3,
    date: "2023-10-15",
    amount: 18700,
    items: 2,
    paymentMethod: "Efectivo",
    status: "Completada",
    invoice: "FE-00098",
  },
  {
    id: 4,
    date: "2023-09-30",
    amount: 56000,
    items: 4,
    paymentMethod: "Tarjeta",
    status: "Completada",
    invoice: "FE-00087",
  },
  {
    id: 5,
    date: "2023-08-22",
    amount: 29500,
    items: 3,
    paymentMethod: "Efectivo",
    status: "Completada",
    invoice: "FE-00076",
  },
]

// Datos de compras por mes para gráfico
const monthlyPurchases = [
  { month: "Ene", amount: 25000 },
  { month: "Feb", amount: 32000 },
  { month: "Mar", amount: 18000 },
  { month: "Abr", amount: 42000 },
  { month: "May", amount: 35000 },
  { month: "Jun", amount: 28000 },
  { month: "Jul", amount: 22000 },
  { month: "Ago", amount: 29500 },
  { month: "Sep", amount: 56000 },
  { month: "Oct", amount: 18700 },
  { month: "Nov", amount: 45800 },
  { month: "Dic", amount: 32500 },
]

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulamos la carga del cliente desde IndexedDB
    const customerId = Number.parseInt(params.id)
    const foundCustomer = initialCustomers.find((c) => c.id === customerId)

    if (foundCustomer) {
      setCustomer(foundCustomer)
    } else {
      toast({
        variant: "destructive",
        title: "Cliente no encontrado",
        description: "El cliente solicitado no existe o ha sido eliminado.",
      })
      router.push("/customers")
    }

    setLoading(false)
  }, [params.id, router, toast])

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <p>Cargando información del cliente...</p>
        </div>
      </DashboardShell>
    )
  }

  if (!customer) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <p>Cliente no encontrado</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Detalle de Cliente" text="Información detallada del cliente seleccionado">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/customers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => router.push(`/customers/edit/${customer.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-2xl">
                    {customer.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{customer.name}</h2>
                <Badge
                  variant={customer.type === "vip" ? "default" : customer.type === "general" ? "secondary" : "outline"}
                  className={
                    customer.type === "vip"
                      ? "mt-2 bg-amber-500 hover:bg-amber-600"
                      : customer.type === "general"
                        ? "mt-2 bg-gray-200 text-gray-800 hover:bg-gray-300"
                        : "mt-2"
                  }
                >
                  {customer.type === "vip" ? "VIP" : customer.type === "regular" ? "Regular" : "General"}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>{customer.email || "No registrado"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{customer.phone || "No registrado"}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Cédula</h3>
                  <p className="mt-1">{customer.taxId || "No registrada"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Dirección</h3>
                  <p className="mt-1">{customer.address || "No registrada"}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Fecha de Registro</h3>
                  <p className="mt-1">{customer.createdAt}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Notas</h3>
                  <p className="mt-1">{customer.notes || "Sin notas"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="purchases" className="w-full">
            <TabsList>
              <TabsTrigger value="purchases">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Historial de Compras
              </TabsTrigger>
              <TabsTrigger value="stats">
                <Star className="mr-2 h-4 w-4" />
                Estadísticas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="purchases" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Compras</CardTitle>
                  <CardDescription>Registro de todas las compras realizadas por el cliente</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Factura</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead>Método de Pago</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseHistory.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{purchase.date}</TableCell>
                          <TableCell>{purchase.invoice}</TableCell>
                          <TableCell>{purchase.items} items</TableCell>
                          <TableCell>{purchase.paymentMethod}</TableCell>
                          <TableCell className="text-right">₡{purchase.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="stats" className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₡{customer.totalPurchases.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Desde {customer.createdAt}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Última Compra</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₡{purchaseHistory[0].amount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{purchaseHistory[0].date}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Compras Totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{purchaseHistory.length}</div>
                    <p className="text-xs text-muted-foreground">Transacciones registradas</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Compras Mensuales</CardTitle>
                  <CardDescription>Historial de compras durante el último año</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <div className="flex h-full items-end gap-2">
                      {monthlyPurchases.map((data, index) => (
                        <div key={index} className="relative flex h-full w-full flex-col justify-end">
                          <div
                            className="bg-primary rounded-md w-full"
                            style={{ height: `${(data.amount / 56000) * 100}%` }}
                          ></div>
                          <span className="mt-1 text-xs text-center">{data.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Productos Más Comprados</CardTitle>
                  <CardDescription>Productos favoritos del cliente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Café Americano", quantity: 15, total: 22500 },
                      { name: "Sandwich de Pollo", quantity: 8, total: 28000 },
                      { name: "Jugo Natural", quantity: 12, total: 21600 },
                      { name: "Cheesecake", quantity: 6, total: 16800 },
                      { name: "Cappuccino", quantity: 10, total: 22000 },
                    ].map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.quantity} unidades</p>
                        </div>
                        <p className="font-medium">₡{product.total.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  )
}
