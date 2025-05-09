
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesOverview } from "@/components/reports/SalesOverview"
import { ProductsReport } from "@/components/reports/ProductsReport"
import { RevenueChart } from "@/components/reports/RevenueChart"
import { useReportsData, calculateOverviewStats, calculateTodayPaymentsByMethod } from "@/hooks/useReportsData"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect } from "react"
import { initDB } from "@/lib/db"
import { BackButton } from "@/components/BackButton"
import { useToast } from "@/hooks/use-toast"
import { queryClient } from "@/lib/query-client"

export default function Reports() {
  const { data: orders = [], isLoading, error, refetch } = useReportsData();
  const { toast } = useToast();
  
  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        // Force a refresh of the data
        queryClient.invalidateQueries({ queryKey: ['reports-data'] });
        refetch();
      } catch (error) {
        console.error("Error initializing database:", error);
        toast({
          title: "Error",
          description: "Error al inicializar la base de datos",
          variant: "destructive",
        });
      }
    };
    
    init();
  }, [refetch, toast]);
  
  const stats = calculateOverviewStats(orders);
  const paymentsToday = calculateTodayPaymentsByMethod(orders);

  const methodsDisplay = [
    { key: "efectivo", label: "Efectivo", color: "bg-green-600" },
    { key: "transferencia", label: "Transferencia", color: "bg-blue-600" },
    { key: "tarjeta", label: "Tarjeta", color: "bg-purple-600" },
    { key: "otros", label: "Otros", color: "bg-zinc-600" }
  ];

  useEffect(() => {
    if (orders.length > 0) {
      console.log("Orders data loaded:", orders.length, "orders");
      console.log("Sample order:", orders[0]);
      console.log("Today's payments summary:", paymentsToday);
    }
  }, [orders, paymentsToday]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto p-4">
        <BackButton />
        
        <h1 className="text-3xl font-bold mb-6">Reportes y Análisis</h1>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-[#1A1A1A] border-[#333333]">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24 bg-[#333333]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 bg-[#333333]" />
                  <Skeleton className="h-4 w-20 mt-2 bg-[#333333]" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-[#1A1A1A] border-[#333333] mb-4">
            <CardContent className="py-4">
              <p className="text-red-400">Error al cargar los datos: {(error as Error).message}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            {methodsDisplay.map((m) => (
              <Card key={m.key} className="bg-[#1A1A1A] border-[#333333]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${m.color}`}></span>
                    Ventas HOY: {m.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    ${paymentsToday[m.key]?.toFixed(2) ?? '0.00'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-[#1A1A1A] border border-[#333333]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#252525] text-white">
              Vista General
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-[#252525] text-white">
              Productos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-[#1A1A1A] border-[#333333]">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24 bg-[#333333]" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-32 bg-[#333333]" />
                      <Skeleton className="h-4 w-20 mt-2 bg-[#333333]" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">
                      Ventas Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      ${stats.totalSales.toFixed(2)}
                    </div>
                    <p className="text-xs text-zinc-400">
                      {stats.salesGrowth >= 0 ? '+' : ''}{stats.salesGrowth.toFixed(1)}% respecto al mes anterior
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">
                      Órdenes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">+{stats.totalOrders}</div>
                    <p className="text-xs text-zinc-400">
                      {stats.ordersGrowth >= 0 ? '+' : ''}{stats.ordersGrowth.toFixed(1)}% respecto al mes anterior
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">
                      Clientes Nuevos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">+{stats.uniqueCustomers}</div>
                    <p className="text-xs text-zinc-400">
                      {stats.customersGrowth >= 0 ? '+' : ''}{stats.customersGrowth.toFixed(1)}% respecto al mes anterior
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">
                      Ticket Promedio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">${stats.averageTicket.toFixed(2)}</div>
                    <p className="text-xs text-zinc-400">
                      {stats.ticketGrowth >= 0 ? '+' : ''}{stats.ticketGrowth.toFixed(1)}% respecto al mes anterior
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            <SalesOverview />
            <RevenueChart />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <ProductsReport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
