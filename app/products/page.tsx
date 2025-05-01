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
  BarChart4,
  Download,
  Edit,
  Filter,
  ImagePlus,
  Package,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
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

// Datos iniciales de productos
const initialProducts = [
  {
    id: 1,
    name: "Café Americano",
    price: 1500,
    cost: 800,
    category: "Café",
    image: "/placeholder.svg?height=80&width=80",
    stock: 100,
    minStock: 20,
    barcode: "7890123456789",
    sku: "CAF-001",
    description: "Café americano preparado con granos premium.",
    taxable: true,
    active: true,
    location: "Estantería A",
    supplier: "Café de Costa Rica S.A.",
    lastUpdated: "2023-12-15",
  },
  {
    id: 2,
    name: "Cappuccino",
    price: 2200,
    cost: 1200,
    category: "Café",
    image: "/placeholder.svg?height=80&width=80",
    stock: 100,
    minStock: 20,
    barcode: "7890123456790",
    sku: "CAF-002",
    description: "Cappuccino cremoso con espuma de leche perfecta.",
    taxable: true,
    active: true,
    location: "Estantería A",
    supplier: "Café de Costa Rica S.A.",
    lastUpdated: "2023-12-15",
  },
  {
    id: 3,
    name: "Latte",
    price: 2500,
    cost: 1300,
    category: "Café",
    image: "/placeholder.svg?height=80&width=80",
    stock: 100,
    minStock: 20,
    barcode: "7890123456791",
    sku: "CAF-003",
    description: "Café latte con leche cremosa y un shot de espresso.",
    taxable: true,
    active: true,
    location: "Estantería A",
    supplier: "Café de Costa Rica S.A.",
    lastUpdated: "2023-12-15",
  },
  {
    id: 4,
    name: "Espresso",
    price: 1200,
    cost: 600,
    category: "Café",
    image: "/placeholder.svg?height=80&width=80",
    stock: 100,
    minStock: 20,
    barcode: "7890123456792",
    sku: "CAF-004",
    description: "Shot de espresso intenso y aromático.",
    taxable: true,
    active: true,
    location: "Estantería A",
    supplier: "Café de Costa Rica S.A.",
    lastUpdated: "2023-12-15",
  },
  {
    id: 5,
    name: "Sandwich de Pollo",
    price: 3500,
    cost: 2000,
    category: "Comidas",
    image: "/placeholder.svg?height=80&width=80",
    stock: 50,
    minStock: 10,
    barcode: "7890123456793",
    sku: "COM-001",
    description: "Sandwich de pollo con lechuga, tomate y mayonesa.",
    taxable: true,
    active: true,
    location: "Refrigerador",
    supplier: "Alimentos Frescos S.A.",
    lastUpdated: "2023-12-14",
  },
  {
    id: 6,
    name: "Ensalada César",
    price: 4200,
    cost: 2500,
    category: "Comidas",
    image: "/placeholder.svg?height=80&width=80",
    stock: 30,
    minStock: 5,
    barcode: "7890123456794",
    sku: "COM-002",
    description: "Ensalada césar con pollo, crutones y aderezo especial.",
    taxable: true,
    active: true,
    location: "Refrigerador",
    supplier: "Alimentos Frescos S.A.",
    lastUpdated: "2023-12-14",
  },
  {
    id: 7,
    name: "Jugo Natural",
    price: 1800,
    cost: 900,
    category: "Bebidas",
    image: "/placeholder.svg?height=80&width=80",
    stock: 80,
    minStock: 15,
    barcode: "7890123456795",
    sku: "BEB-001",
    description: "Jugo natural de naranja recién exprimido.",
    taxable: true,
    active: true,
    location: "Refrigerador",
    supplier: "Frutas Tropicales S.A.",
    lastUpdated: "2023-12-14",
  },
  {
    id: 8,
    name: "Agua Mineral",
    price: 1000,
    cost: 400,
    category: "Bebidas",
    image: "/placeholder.svg?height=80&width=80",
    stock: 120,
    minStock: 30,
    barcode: "7890123456796",
    sku: "BEB-002",
    description: "Agua mineral purificada de 500ml.",
    taxable: true,
    active: true,
    location: "Refrigerador",
    supplier: "Aguas Cristalinas S.A.",
    lastUpdated: "2023-12-13",
  },
  {
    id: 9,
    name: "Cheesecake",
    price: 2800,
    cost: 1500,
    category: "Postres",
    image: "/placeholder.svg?height=80&width=80",
    stock: 25,
    minStock: 5,
    barcode: "7890123456797",
    sku: "POS-001",
    description: "Cheesecake cremoso con salsa de frutos rojos.",
    taxable: true,
    active: true,
    location: "Vitrina Refrigerada",
    supplier: "Delicias Dulces S.A.",
    lastUpdated: "2023-12-13",
  },
  {
    id: 10,
    name: "Brownie",
    price: 1500,
    cost: 700,
    category: "Postres",
    image: "/placeholder.svg?height=80&width=80",
    stock: 40,
    minStock: 10,
    barcode: "7890123456798",
    sku: "POS-002",
    description: "Brownie de chocolate con nueces.",
    taxable: true,
    active: true,
    location: "Vitrina",
    supplier: "Delicias Dulces S.A.",
    lastUpdated: "2023-12-13",
  },
]

// Categorías disponibles
const categories = ["Todos", "Bebidas", "Comidas", "Postres", "Snacks", "Café", "Promociones"]

// Proveedores disponibles
const suppliers = [
  "Café de Costa Rica S.A.",
  "Alimentos Frescos S.A.",
  "Frutas Tropicales S.A.",
  "Aguas Cristalinas S.A.",
  "Delicias Dulces S.A.",
  "Distribuidora Nacional S.A.",
]

// Ubicaciones disponibles
const locations = ["Estantería A", "Estantería B", "Refrigerador", "Vitrina", "Vitrina Refrigerada", "Bodega"]

// Tipo de producto
type Product = {
  id: number
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

export default function ProductsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    price: 0,
    cost: 0,
    category: "Café",
    image: "/placeholder.svg?height=80&width=80",
    stock: 0,
    minStock: 0,
    barcode: "",
    sku: "",
    description: "",
    taxable: true,
    active: true,
    location: "Estantería A",
    supplier: "Café de Costa Rica S.A.",
  })
  const [sortField, setSortField] = useState<keyof Product>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Filtrar productos por categoría y búsqueda
  const filteredProducts = products.filter(
    (product) =>
      (activeCategory === "Todos" || product.category === activeCategory) &&
      (searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.includes(searchQuery)),
  )

  // Ordenar productos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortField === "name" || sortField === "category" || sortField === "supplier" || sortField === "location") {
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
  const handleSort = (field: keyof Product) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Crear un nuevo producto
  const handleCreateProduct = () => {
    const id = Math.max(...products.map((p) => p.id)) + 1
    const today = new Date().toISOString().split("T")[0]
    const product: Product = {
      ...newProduct,
      id,
      lastUpdated: today,
    } as Product

    setProducts([...products, product])
    setShowAddDialog(false)
    setNewProduct({
      name: "",
      price: 0,
      cost: 0,
      category: "Café",
      image: "/placeholder.svg?height=80&width=80",
      stock: 0,
      minStock: 0,
      barcode: "",
      sku: "",
      description: "",
      taxable: true,
      active: true,
      location: "Estantería A",
      supplier: "Café de Costa Rica S.A.",
    })

    toast({
      title: "Producto creado",
      description: `El producto "${product.name}" ha sido creado exitosamente.`,
    })
  }

  // Editar un producto existente
  const handleEditProduct = () => {
    if (!currentProduct) return

    const today = new Date().toISOString().split("T")[0]
    const updatedProduct = { ...currentProduct, lastUpdated: today }

    setProducts(products.map((p) => (p.id === currentProduct.id ? updatedProduct : p)))
    setShowEditDialog(false)
    setCurrentProduct(null)

    toast({
      title: "Producto actualizado",
      description: `El producto "${updatedProduct.name}" ha sido actualizado exitosamente.`,
    })
  }

  // Eliminar un producto
  const handleDeleteProduct = () => {
    if (!currentProduct) return

    setProducts(products.filter((p) => p.id !== currentProduct.id))
    setShowDeleteDialog(false)

    toast({
      title: "Producto eliminado",
      description: `El producto "${currentProduct.name}" ha sido eliminado exitosamente.`,
    })

    setCurrentProduct(null)
  }

  // Abrir diálogo de edición
  const openEditDialog = (product: Product) => {
    setCurrentProduct(product)
    setShowEditDialog(true)
  }

  // Abrir diálogo de eliminación
  const openDeleteDialog = (product: Product) => {
    setCurrentProduct(product)
    setShowDeleteDialog(true)
  }

  // Importar productos
  const handleImportProducts = () => {
    toast({
      title: "Importación iniciada",
      description: "Se ha iniciado el proceso de importación de productos.",
    })
  }

  // Exportar productos
  const handleExportProducts = () => {
    toast({
      title: "Exportación iniciada",
      description: "Se ha iniciado el proceso de exportación de productos.",
    })
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Productos" text="Gestione su catálogo de productos e inventario">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImportProducts}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExportProducts}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter((p) => p.active).length} activos, {products.filter((p) => !p.active).length} inactivos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor del Inventario</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₡{products.reduce((sum, p) => sum + p.cost * p.stock, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Basado en el costo de adquisición</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Bajo Stock</CardTitle>
            <Badge variant="destructive" className="px-1 py-0">
              {products.filter((p) => p.stock < p.minStock).length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.stock < p.minStock).length}</div>
            <p className="text-xs text-muted-foreground">Requieren reabastecimiento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(products.map((p) => p.category)).size}</div>
            <p className="text-xs text-muted-foreground">Categorías de productos</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <ScrollArea className="w-full sm:w-auto">
            <div className="flex gap-2 p-1">
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
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
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

        <Card>
          <CardHeader>
            <CardTitle>Listado de Productos</CardTitle>
            <CardDescription>
              {filteredProducts.length} productos encontrados de un total de {products.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagen</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">
                      Nombre
                      {sortField === "name" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("sku")}>
                    <div className="flex items-center">
                      SKU
                      {sortField === "sku" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                    <div className="flex items-center">
                      Categoría
                      {sortField === "category" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort("price")}>
                    <div className="flex items-center justify-end">
                      Precio
                      {sortField === "price" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort("stock")}>
                    <div className="flex items-center justify-end">
                      Stock
                      {sortField === "stock" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">₡{product.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          product.stock < product.minStock ? "text-red-500 font-medium" : "text-green-600 font-medium"
                        }
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.active ? "outline" : "secondary"}
                        className={
                          product.active
                            ? "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }
                      >
                        {product.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/products/${product.id}`)}>
                            <Package className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(product)}
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

      {/* Diálogo para añadir producto */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Producto</DialogTitle>
            <DialogDescription>Complete la información del nuevo producto.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="inventory">Inventario</TabsTrigger>
              <TabsTrigger value="additional">Información Adicional</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                    <img
                      src={newProduct.image || "/placeholder.svg?height=80&width=80"}
                      alt="Imagen del producto"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Subir Imagen
                  </Button>
                </div>
                <div className="col-span-3 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre del Producto *</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Ej: Café Americano"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Descripción del producto"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoría *</Label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((c) => c !== "Todos")
                            .map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="active">Estado</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="active"
                          checked={newProduct.active}
                          onCheckedChange={(checked) => setNewProduct({ ...newProduct, active: checked as boolean })}
                        />
                        <label
                          htmlFor="active"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Producto Activo
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="inventory" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="Ej: CAF-001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <Input
                    id="barcode"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    placeholder="Ej: 7890123456789"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock Actual *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minStock">Stock Mínimo *</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({ ...newProduct, minStock: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Select
                    value={newProduct.location}
                    onValueChange={(value) => setNewProduct({ ...newProduct, location: value })}
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supplier">Proveedor</Label>
                  <Select
                    value={newProduct.supplier}
                    onValueChange={(value) => setNewProduct({ ...newProduct, supplier: value })}
                  >
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier} value={supplier}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="additional" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Precio de Venta *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cost">Costo de Adquisición *</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({ ...newProduct, cost: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="taxable"
                    checked={newProduct.taxable}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, taxable: checked as boolean })}
                  />
                  <label
                    htmlFor="taxable"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Producto Gravado (IVA)
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProduct} disabled={!newProduct.name || !newProduct.sku}>
              Crear Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar producto */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>Modifique la información del producto.</DialogDescription>
          </DialogHeader>
          {currentProduct && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Información Básica</TabsTrigger>
                <TabsTrigger value="inventory">Inventario</TabsTrigger>
                <TabsTrigger value="additional">Información Adicional</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4 py-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                      <img
                        src={currentProduct.image || "/placeholder.svg"}
                        alt="Imagen del producto"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Cambiar Imagen
                    </Button>
                  </div>
                  <div className="col-span-3 space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name">Nombre del Producto *</Label>
                      <Input
                        id="edit-name"
                        value={currentProduct.name}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-description">Descripción</Label>
                      <Textarea
                        id="edit-description"
                        value={currentProduct.description}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-category">Categoría *</Label>
                        <Select
                          value={currentProduct.category}
                          onValueChange={(value) => setCurrentProduct({ ...currentProduct, category: value })}
                        >
                          <SelectTrigger id="edit-category">
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .filter((c) => c !== "Todos")
                              .map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-active">Estado</Label>
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="edit-active"
                            checked={currentProduct.active}
                            onCheckedChange={(checked) =>
                              setCurrentProduct({ ...currentProduct, active: checked as boolean })
                            }
                          />
                          <label
                            htmlFor="edit-active"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Producto Activo
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="inventory" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-sku">SKU *</Label>
                    <Input
                      id="edit-sku"
                      value={currentProduct.sku}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-barcode">Código de Barras</Label>
                    <Input
                      id="edit-barcode"
                      value={currentProduct.barcode}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, barcode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-stock">Stock Actual *</Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={currentProduct.stock}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, stock: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-minStock">Stock Mínimo *</Label>
                    <Input
                      id="edit-minStock"
                      type="number"
                      value={currentProduct.minStock}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, minStock: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-location">Ubicación</Label>
                    <Select
                      value={currentProduct.location}
                      onValueChange={(value) => setCurrentProduct({ ...currentProduct, location: value })}
                    >
                      <SelectTrigger id="edit-location">
                        <SelectValue placeholder="Seleccionar ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-supplier">Proveedor</Label>
                    <Select
                      value={currentProduct.supplier}
                      onValueChange={(value) => setCurrentProduct({ ...currentProduct, supplier: value })}
                    >
                      <SelectTrigger id="edit-supplier">
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>
                            {supplier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="additional" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Precio de Venta *</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={currentProduct.price}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-cost">Costo de Adquisición *</Label>
                    <Input
                      id="edit-cost"
                      type="number"
                      value={currentProduct.cost}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, cost: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-taxable"
                      checked={currentProduct.taxable}
                      onCheckedChange={(checked) =>
                        setCurrentProduct({ ...currentProduct, taxable: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="edit-taxable"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Producto Gravado (IVA)
                    </label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditProduct}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmar eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  )
}
