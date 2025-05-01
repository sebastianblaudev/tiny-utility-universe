"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import {
  ArrowUpDown,
  CreditCard,
  Download,
  Edit,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Datos iniciales de clientes
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

// Tipo de cliente
type Customer = {
  id: number
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

export default function CustomersPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    type: "regular",
    taxId: "",
    address: "",
    notes: "",
  })
  const [sortField, setSortField] = useState<keyof Customer>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Filtrar clientes por tipo y búsqueda
  const filteredCustomers = customers.filter(
    (customer) =>
      (activeTab === "all" ||
        (activeTab === "vip" && customer.type === "vip") ||
        (activeTab === "regular" && customer.type === "regular") ||
        (activeTab === "general" && customer.type === "general")) &&
      (searchQuery === "" ||
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery)),
  )

  // Ordenar clientes
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortField === "name" || sortField === "email" || sortField === "phone" || sortField === "type") {
      return sortDirection === "asc"
        ? a[sortField].localeCompare(b[sortField])
        : b[sortField].localeCompare(a[sortField])
    } else {
      return sortDirection === "asc"
        ? Number(a[sortField]) - Number(b[sortField])
        : Number(b[sortField]) - Number(a[sortField])
    }
  })

  // Manejar ordenamiento
  const handleSort = (field: keyof Customer) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Crear un nuevo cliente
  const handleCreateCustomer = () => {
    const id = Math.max(...customers.map((c) => c.id)) + 1
    const today = new Date().toISOString().split("T")[0]
    const customer: Customer = {
      ...newCustomer,
      id,
      totalPurchases: 0,
      lastPurchase: "",
      createdAt: today,
    } as Customer

    setCustomers([...customers, customer])
    setShowAddDialog(false)
    setNewCustomer({
      name: "",
      email: "",
      phone: "",
      type: "regular",
      taxId: "",
      address: "",
      notes: "",
    })

    toast({
      title: "Cliente creado",
      description: `El cliente "${customer.name}" ha sido creado exitosamente.`,
    })
  }

  // Editar un cliente existente
  const handleEditCustomer = () => {
    if (!currentCustomer) return

    setCustomers(customers.map((c) => (c.id === currentCustomer.id ? currentCustomer : c)))
    setShowEditDialog(false)
    setCurrentCustomer(null)

    toast({
      title: "Cliente actualizado",
      description: `El cliente "${currentCustomer.name}" ha sido actualizado exitosamente.`,
    })
  }

  // Eliminar un cliente
  const handleDeleteCustomer = () => {
    if (!currentCustomer) return

    setCustomers(customers.filter((c) => c.id !== currentCustomer.id))
    setShowDeleteDialog(false)

    toast({
      title: "Cliente eliminado",
      description: `El cliente "${currentCustomer.name}" ha sido eliminado exitosamente.`,
    })

    setCurrentCustomer(null)
  }

  // Abrir diálogo de edición
  const openEditDialog = (customer: Customer) => {
    setCurrentCustomer(customer)
    setShowEditDialog(true)
  }

  // Abrir diálogo de eliminación
  const openDeleteDialog = (customer: Customer) => {
    setCurrentCustomer(customer)
    setShowDeleteDialog(true)
  }

  // Importar clientes
  const handleImportCustomers = () => {
    toast({
      title: "Importación iniciada",
      description: "Se ha iniciado el proceso de importación de clientes.",
    })
  }

  // Exportar clientes
  const handleExportCustomers = () => {
    toast({
      title: "Exportación iniciada",
      description: "Se ha iniciado el proceso de exportación de clientes.",
    })
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Clientes" text="Gestione su base de clientes">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImportCustomers}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExportCustomers}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              {customers.filter((c) => c.type !== "general").length} clientes registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes VIP</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter((c) => c.type === "vip").length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((customers.filter((c) => c.type === "vip").length / customers.length) * 100)}% del total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₡{customers.reduce((sum, c) => sum + c.totalPurchases, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Acumulado histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Compra</CardTitle>
            <Badge variant="outline" className="px-1 py-0">
              Hoy
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡32,500</div>
            <p className="text-xs text-muted-foreground">Juan Mora - 10:45 AM</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col space-y-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="vip">VIP</TabsTrigger>
              <TabsTrigger value="regular">Regulares</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Clientes</CardTitle>
            <CardDescription>
              {filteredCustomers.length} clientes encontrados de un total de {customers.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">
                      Nombre
                      {sortField === "name" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                    <div className="flex items-center">
                      Email
                      {sortField === "email" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("phone")}>
                    <div className="flex items-center">
                      Teléfono
                      {sortField === "phone" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort("totalPurchases")}>
                    <div className="flex items-center justify-end">
                      Total Compras
                      {sortField === "totalPurchases" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell className="text-right">
                      {customer.totalPurchases > 0 ? `₡${customer.totalPurchases.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.type === "vip" ? "default" : customer.type === "general" ? "secondary" : "outline"
                        }
                        className={
                          customer.type === "vip"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : customer.type === "general"
                              ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                              : ""
                        }
                      >
                        {customer.type === "vip" ? "VIP" : customer.type === "regular" ? "Regular" : "General"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)}>
                            <User className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(customer)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para añadir cliente */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
            <DialogDescription>Complete la información del nuevo cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo de Cliente</Label>
                <Select
                  value={newCustomer.type}
                  onValueChange={(value) => setNewCustomer({ ...newCustomer, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Ej: cliente@ejemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Ej: 8888-8888"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxId">Cédula Física/Jurídica</Label>
              <Input
                id="taxId"
                value={newCustomer.taxId}
                onChange={(e) => setNewCustomer({ ...newCustomer, taxId: e.target.value })}
                placeholder="Ej: 1-1234-5678"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                placeholder="Notas adicionales sobre el cliente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCustomer} disabled={!newCustomer.name}>
              Crear Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar cliente */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Modifique la información del cliente.</DialogDescription>
          </DialogHeader>
          {currentCustomer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nombre Completo *</Label>
                  <Input
                    id="edit-name"
                    value={currentCustomer.name}
                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">Tipo de Cliente</Label>
                  <Select
                    value={currentCustomer.type}
                    onValueChange={(value) => setCurrentCustomer({ ...currentCustomer, type: value })}
                  >
                    <SelectTrigger id="edit-type">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Correo Electrónico</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={currentCustomer.email}
                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Teléfono</Label>
                  <Input
                    id="edit-phone"
                    value={currentCustomer.phone}
                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-taxId">Cédula Física/Jurídica</Label>
                <Input
                  id="edit-taxId"
                  value={currentCustomer.taxId}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, taxId: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Dirección</Label>
                <Textarea
                  id="edit-address"
                  value={currentCustomer.address}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, address: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notas</Label>
                <Textarea
                  id="edit-notes"
                  value={currentCustomer.notes}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCustomer}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmar eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  )
}
