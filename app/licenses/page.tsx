import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Calendar, Check, CreditCard, Download, Key, Plus, RefreshCw, Shield, Store } from "lucide-react"

// Datos de ejemplo
const licenses = [
  {
    id: "LIC-2023-001",
    client: "Café Mirador",
    plan: "Premium",
    status: "Activa",
    devices: 3,
    startDate: "15/01/2023",
    endDate: "15/01/2024",
    lastConnection: "Hoy, 10:45 AM",
  },
  {
    id: "LIC-2023-002",
    client: "Restaurante El Jardín",
    plan: "Standard",
    status: "Activa",
    devices: 2,
    startDate: "03/03/2023",
    endDate: "03/03/2024",
    lastConnection: "Ayer, 08:30 PM",
  },
  {
    id: "LIC-2023-003",
    client: "Supermercado La Esquina",
    plan: "Enterprise",
    status: "Activa",
    devices: 5,
    startDate: "22/04/2023",
    endDate: "22/04/2024",
    lastConnection: "Hoy, 09:15 AM",
  },
  {
    id: "LIC-2023-004",
    client: "Farmacia San José",
    plan: "Premium",
    status: "Por vencer",
    devices: 3,
    startDate: "10/05/2023",
    endDate: "10/05/2024",
    lastConnection: "Hace 3 días",
  },
  {
    id: "LIC-2023-005",
    client: "Tienda de Ropa Eleganza",
    plan: "Standard",
    status: "Vencida",
    devices: 2,
    startDate: "05/01/2023",
    endDate: "05/01/2024",
    lastConnection: "Hace 45 días",
  },
]

const plans = [
  {
    name: "Standard",
    price: "₡25,000",
    period: "mensual",
    description: "Ideal para pequeños negocios",
    features: ["1 Terminal de punto de venta", "Facturación electrónica", "Reportes básicos", "Soporte por correo"],
    popular: false,
  },
  {
    name: "Premium",
    price: "₡45,000",
    period: "mensual",
    description: "Para negocios en crecimiento",
    features: [
      "3 Terminales de punto de venta",
      "Facturación electrónica",
      "Reportes avanzados",
      "Control de inventario",
      "Soporte prioritario",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "₡85,000",
    period: "mensual",
    description: "Para negocios establecidos",
    features: [
      "Terminales ilimitadas",
      "Facturación electrónica",
      "Reportes personalizados",
      "Control de inventario avanzado",
      "Múltiples sucursales",
      "Soporte 24/7",
    ],
    popular: false,
  },
]

export default function LicensesPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Sistema de Licencias" text="Gestione las licencias de sus clientes">
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Licencia
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licencias</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+12 este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licencias Activas</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">112</div>
            <p className="text-xs text-muted-foreground">87.5% del total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">En los próximos 30 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡4,850,000</div>
            <p className="text-xs text-muted-foreground">+₡450,000 del mes anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Licencias Activas</CardTitle>
            <CardDescription>Gestione las licencias de sus clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Dispositivos</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Última Conexión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">{license.id}</TableCell>
                    <TableCell>{license.client}</TableCell>
                    <TableCell>{license.plan}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          license.status === "Activa"
                            ? "outline"
                            : license.status === "Por vencer"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          license.status === "Activa"
                            ? "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                            : license.status === "Por vencer"
                              ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-700"
                              : ""
                        }
                      >
                        {license.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{license.devices}</TableCell>
                    <TableCell>{license.endDate}</TableCell>
                    <TableCell>{license.lastConnection}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Planes Disponibles</CardTitle>
            <CardDescription>Planes de licenciamiento para sus clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {plans.map((plan) => (
                <Card key={plan.name} className={plan.popular ? "border-teal-500" : ""}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/3">
                      <Badge className="bg-teal-500 hover:bg-teal-600">Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <Check className="mr-2 h-4 w-4 text-teal-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className={plan.popular ? "bg-teal-500 hover:bg-teal-600 w-full" : "w-full"}>
                      Seleccionar Plan
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Componente de Licenciamiento</CardTitle>
          <CardDescription>Sistema de validación y activación de licencias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Características del Sistema</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Shield className="mr-2 h-5 w-5 text-teal-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Seguridad Avanzada</p>
                    <p className="text-sm text-muted-foreground">
                      Encriptación de extremo a extremo y validación segura
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Store className="mr-2 h-5 w-5 text-teal-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Multi-sucursal</p>
                    <p className="text-sm text-muted-foreground">
                      Soporte para múltiples ubicaciones con una sola licencia
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <RefreshCw className="mr-2 h-5 w-5 text-teal-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Activación Automática</p>
                    <p className="text-sm text-muted-foreground">Proceso de activación y renovación simplificado</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="rounded-lg border bg-muted p-6 flex items-center justify-center">
              <div className="text-center">
                <Key className="h-12 w-12 mx-auto mb-4 text-teal-500" />
                <h3 className="text-lg font-medium mb-2">Sistema de Licencias</h3>
                <p className="text-sm text-muted-foreground mb-4">Componente listo para integrar con el backend</p>
                <Button>Ver Documentación</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
