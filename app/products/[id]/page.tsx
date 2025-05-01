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
import { ArrowLeft, Edit, Package, Printer, Share, ShoppingCart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Datos iniciales de productos (mismos que en la página de productos)
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
  // ... otros productos
]

// Historial de movimientos de inventario
const inventoryMovements = [
  {
    id: 1,
    date: "2023-12-15",
    type: "Entrada",
    quantity: 50,
    reference: "Compra #12345",
    user: "Admin",
  },
  {
    id: 2,
    date: "2023-12-10",
    type: "Salida",
    quantity: 5,
    reference: "Venta #67890",
    user: "Cajero",
  },
  {
    id: 3,
    date: "2023-12-05",
    type: "Ajuste",
    quantity: -2,
    reference: "Inventario",
    user: "Admin",
  },
  {
    id: 4,
    date: "2023-12-01",
    type: "Entrada",
    quantity: 100,
    reference: "Compra #12340",
    user: "Admin",
  },
]

// Datos de ventas por mes
const salesData = [
  { month: "Ene", quantity: 120 },
  { month: "Feb", quantity: 150 },
  { month: "Mar", quantity: 180 },
  { month: "Abr", quantity: 140 },
  { month: "May", quantity: 160 },
  { month: "Jun", quantity: 190 },
  { month: "Jul", quantity: 210 },
  { month: "Ago", quantity: 230 },
  { month: "Sep", quantity: 200 },
  { month: "Oct", quantity: 180 },
  { month: "Nov", quantity: 220 },
  { month: "Dic", quantity: 250 },
]

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulamos la carga del producto desde una API
    const productId = Number.parseInt(params.id)
    const foundProduct = initialProducts.find((p) => p.id === productId)

    if (foundProduct) {
      setProduct(foundProduct)
    } else {
      toast({
        variant: "destructive",
        title: "Producto no encontrado",
        description: "El producto solicitado no existe o ha sido eliminado.",
      })
      router.push("/products")
    }

    setLoading(false)
  }, [params.id, router])

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <p>Cargando información del producto...</p>
        </div>
      </DashboardShell>
    )
  }

  if (!product) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <p>Producto no encontrado</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Detalle de Producto" text="Información detallada del producto seleccionado">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => router.push(`/products/edit/${product.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <div className="h-40 w-40 overflow-hidden rounded-md border mb-4">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold">{product.name}</h2>
                <Badge
                  variant={product.active ? "outline" : "secondary"}
                  className={
                    product.active
                      ? "mt-2 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                      : "mt-2 bg-gray-100 text-gray-500"
                  }
                >
                  {product.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Descripción</h3>
                  <p className="mt-1">{product.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">SKU</h3>
                    <p className="mt-1 font-medium">{product.sku}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Código de Barras</h3>
                    <p className="mt-1 font-medium">{product.barcode}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Categoría</h3>
                    <p className="mt-1 font-medium">{product.category}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Última Actualización</h3>
                    <p className="mt-1 font-medium">{product.lastUpdated}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Precio de Venta</h3>
                    <p className="mt-1 text-lg font-bold">₡{product.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Costo</h3>
                    <p className="mt-1 font-medium">₡{product.cost.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Impuestos</h3>
                  <p className="mt-1 font-medium">{product.taxable ? "Gravado (13% IVA)" : "Exento"}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Button className="w-full">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Añadir al Carrito
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Button>
                  <Button variant="outline">
                    <Share className="mr-2 h-4 w-4" />
                    Compartir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inventory">Inventario</TabsTrigger>
              <TabsTrigger value="sales">Ventas</TabsTrigger>
              <TabsTrigger value="related">Productos Relacionados</TabsTrigger>
            </TabsList>
            <TabsContent value="inventory" className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Stock Actual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{product.stock}</div>
                    <p className="text-xs text-muted-foreground">Unidades disponibles</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Stock Mínimo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{product.minStock}</div>
                    <p className="text-xs text-muted-foreground">Punto de reorden</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Valor en Inventario</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₡{(product.cost * product.stock).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Basado en costo</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Información de Inventario</CardTitle>
                  <CardDescription>Detalles de ubicación y proveedor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Ubicación</h3>
                      <p className="mt-1 font-medium">{product.location}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Proveedor</h3>
                      <p className="mt-1 font-medium">{product.supplier}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Movimientos de Inventario</CardTitle>
                  <CardDescription>Historial de entradas y salidas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inventoryMovements.map((movement) => (
                      <div key={movement.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{movement.type}</p>
                          <p className="text-sm text-muted-foreground">{movement.date}</p>
                        </div>
                        <div>
                          <p className="text-sm">{movement.reference}</p>
                          <p className="text-sm text-muted-foreground">Por: {movement.user}</p>
                        </div>
                        <div>
                          <Badge
                            variant={
                              movement.type === "Entrada"
                                ? "outline"
                                : movement.type === "Salida"
                                  ? "secondary"
                                  : "default"
                            }
                            className={
                              movement.type === "Entrada"
                                ? "bg-green-50 text-green-700"
                                : movement.type === "Salida"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-amber-50 text-amber-700"
                            }
                          >
                            {movement.quantity > 0 ? "+" : ""}
                            {movement.quantity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="sales" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Ventas</CardTitle>
                  <CardDescription>Ventas del producto en los últimos 12 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <div className="flex h-full items-end gap-2">
                      {salesData.map((data, index) => (
                        <div key={index} className="relative flex h-full w-full flex-col justify-end">
                          <div
                            className="bg-primary rounded-md w-full"
                            style={{ height: `${(data.quantity / 250) * 100}%` }}
                          ></div>
                          <span className="mt-1 text-xs text-center">{data.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2,030</div>
                    <p className="text-xs text-muted-foreground">Unidades en el último año</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Generados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₡3,045,000</div>
                    <p className="text-xs text-muted-foreground">En el último año</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Rentabilidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">47%</div>
                    <p className="text-xs text-muted-foreground">Margen de ganancia</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Últimas Ventas</CardTitle>
                  <CardDescription>Transacciones recientes que incluyen este producto</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">Venta #{Math.floor(10000 + Math.random() * 90000)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">
                            Cliente:{" "}
                            {["Juan Mora", "María López", "Carlos Sánchez", "Ana Jiménez", "Pedro Vargas"][i - 1]}
                          </p>
                          <p className="text-sm text-muted-foreground">Cantidad: {Math.floor(1 + Math.random() * 5)}</p>
                        </div>
                        <div>
                          <p className="font-medium">
                            ₡{(product.price * Math.floor(1 + Math.random() * 5)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="related" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Productos Relacionados</CardTitle>
                  <CardDescription>Productos que se compran frecuentemente junto con este</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {initialProducts
                      .filter((p) => p.id !== product.id && p.category === product.category)
                      .slice(0, 3)
                      .map((relatedProduct) => (
                        <Card key={relatedProduct.id} className="overflow-hidden">
                          <div className="aspect-square relative">
                            <img
                              src={relatedProduct.image || "/placeholder.svg"}
                              alt={relatedProduct.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-medium truncate">{relatedProduct.name}</h3>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-sm text-muted-foreground">₡{relatedProduct.price.toLocaleString()}</p>
                              <Badge variant="outline" className="text-xs">
                                {relatedProduct.category}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => router.push(`/products/${relatedProduct.id}`)}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Productos Complementarios</CardTitle>
                  <CardDescription>Productos que complementan o mejoran este producto</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {initialProducts
                      .filter((p) => p.id !== product.id && p.category !== product.category)
                      .slice(0, 3)
                      .map((complementaryProduct) => (
                        <Card key={complementaryProduct.id} className="overflow-hidden">
                          <div className="aspect-square relative">
                            <img
                              src={complementaryProduct.image || "/placeholder.svg"}
                              alt={complementaryProduct.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-medium truncate">{complementaryProduct.name}</h3>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-sm text-muted-foreground">
                                ₡{complementaryProduct.price.toLocaleString()}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {complementaryProduct.category}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => router.push(`/products/${complementaryProduct.id}`)}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </Button>
                          </CardContent>
                        </Card>
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
