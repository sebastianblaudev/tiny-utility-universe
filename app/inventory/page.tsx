import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ArrowUpDown, Download, FileText, Filter, Package, Plus, Search, Settings, Upload } from "lucide-react"

// Datos de ejemplo
const inventoryItems = [
  {
    id: "INV001",
    name: "Café Premium 1kg",
    category: "Insumos",
    stock: 15,
    minStock: 5,
    cost: 5000,
    price: 8500,
    location: "Bodega Principal",
    status: "En stock",
  },
  {
    id: "INV002",
    name: "Azúcar Refinada 2kg",
    category: "Insumos",
    stock: 8,
    minStock: 10,
    cost: 1200,
    price: 2000,
    location: "Bodega Principal",
    status: "Bajo stock",
  },
  {
    id: "INV003",
    name: "Leche Deslactosada 1L",
    category: "Lácteos",
    stock: 24,
    minStock: 8,
    cost: 800,
    price: 1200,
    location: "Refrigerador",
    status: "En stock",
  },
  {
    id: "INV004",
    name: "Vasos Desechables 12oz",
    category: "Desechables",
    stock: 120,
    minStock: 50,
    cost: 15,
    price: 30,
    location: "Estantería A",
    status: "En stock",
  },
  {
    id: "INV005",
    name: "Papel Térmico 80mm",
    category: "Suministros",
    stock: 3,
    minStock: 5,
    cost: 1500,
    price: 2500,
    location: "Oficina",
    status: "Bajo stock",
  },
  {
    id: "INV006",
    name: "Jarabe de Vainilla 750ml",
    category: "Insumos",
    stock: 6,
    minStock: 2,
    cost: 3500,
    price: 6000,
    location: "Estantería B",
    status: "En stock",
  },
  {
    id: "INV007",
    name: "Chocolate en Polvo 500g",
    category: "Insumos",
    stock: 10,
    minStock: 3,
    cost: 2800,
    price: 4500,
    location: "Estantería B",
    status: "En stock",
  },
  {
    id: "INV008",
    name: "Servilletas",
    category: "Desechables",
    stock: 200,
    minStock: 100,
    cost: 5,
    price: 10,
    location: "Estantería A",
    status: "En stock",
  },
]

export default function InventoryPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Inventario" text="Gestione su inventario, productos y existencias">
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button>
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
            <div className="text-2xl font-bold">386</div>
            <p className="text-xs text-muted-foreground">+24 este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor del Inventario</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡4,582,500</div>
            <p className="text-xs text-muted-foreground">+₡320,000 este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Bajo Stock</CardTitle>
            <Badge variant="destructive" className="px-1 py-0">
              12
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimientos Recientes</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">En las últimas 24 horas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="movements">Movimientos</TabsTrigger>
            <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar productos..." className="pl-8 w-[250px]" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Listado de Productos</CardTitle>
              <CardDescription>Gestione su inventario, precios y existencias</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.stock < item.minStock ? "text-red-500 font-medium" : ""}>
                          {item.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">₡{item.cost.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₡{item.price.toLocaleString()}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === "En stock" ? "outline" : "destructive"}
                          className={
                            item.status === "En stock"
                              ? "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                              : ""
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categorías de Productos</CardTitle>
              <CardDescription>Organice sus productos por categorías</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {["Insumos", "Lácteos", "Desechables", "Suministros", "Equipos", "Limpieza"].map((category) => (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        {Math.floor(Math.random() * 50) + 10} productos
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
