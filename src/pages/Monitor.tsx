
import React, { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBackupStats } from "@/hooks/useBackupStats";
import { 
  ChartBarIcon, 
  LineChart,
  ChartPieIcon, 
  Loader2, 
  CalendarIcon, 
  Settings,
  InfoIcon
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ChartContainer } from "@/components/ui/chart";
import { 
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Monitor() {
  const [backupUrl, setBackupUrl] = useState("");
  const [urlSubmitted, setUrlSubmitted] = useState(false);
  const [isDemoData, setIsDemoData] = useState(false);
  
  const { stats, isLoading, error, refreshData } = useBackupStats(urlSubmitted ? backupUrl : "");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlSubmitted(true);
    setIsDemoData(false); // Resetear el indicador de datos de demostración
    refreshData(); // Forzar actualización cuando se envía la URL
  };

  // Detectar cuando se están usando datos de demostración
  React.useEffect(() => {
    if (stats && stats.isDemoData) {
      setIsDemoData(true);
    }
  }, [stats]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4">
      <div className="relative max-w-6xl mx-auto">
        <BackButton />
        
        <h1 className="text-2xl font-bold mb-6 text-white text-center mt-8">
          Monitor de Ventas
        </h1>
        
        <Card className="bg-[#1A1A1A] border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Conectar a mi respaldo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Ingresa la URL del archivo de respaldo JSON (.json) de tu negocio
                </p>
                <Input
                  value={backupUrl}
                  onChange={(e) => setBackupUrl(e.target.value)}
                  placeholder="https://pizzapos.app/bkp/minegocio@email.com_bkp.json"
                  className="bg-[#2A2A2A] border-zinc-700 text-white"
                />
              </div>
              <Button 
                type="submit"
                className="w-full bg-[#4A64E2] hover:bg-[#3B51B8]"
                disabled={isLoading || !backupUrl}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Cargando datos...
                  </>
                ) : (
                  'Cargar Estadísticas'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {isDemoData && (
          <Alert className="mb-6 bg-amber-900/30 border-amber-700 text-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-300" />
            <AlertTitle>Datos de demostración activos</AlertTitle>
            <AlertDescription>
              Debido a restricciones CORS, se están mostrando datos de demostración. Para ver tus datos reales, 
              necesitas habilitar CORS en tu servidor o usar la app oficial de PizzaPOS.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Card className="bg-[#2A1515] border-red-900 mb-6">
            <CardContent className="pt-6">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}
        
        {isLoading && (
          <div className="flex justify-center my-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
        )}
        
        {stats && !isLoading && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Resumen General */}
            <Card className="bg-[#1A1A1A] border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Resumen General</CardTitle>
                <Settings className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#2A2A2A] rounded-lg">
                    <p className="text-gray-400 text-sm">Productos</p>
                    <p className="text-3xl font-bold">{stats.productCount}</p>
                  </div>
                  <div className="p-4 bg-[#2A2A2A] rounded-lg">
                    <p className="text-gray-400 text-sm">Clientes</p>
                    <p className="text-3xl font-bold">{stats.customerCount}</p>
                  </div>
                  <div className="p-4 bg-[#2A2A2A] rounded-lg">
                    <p className="text-gray-400 text-sm">Órdenes</p>
                    <p className="text-3xl font-bold">{stats.orderCount}</p>
                  </div>
                  <div className="p-4 bg-[#2A2A2A] rounded-lg">
                    <p className="text-gray-400 text-sm">Ticket Promedio</p>
                    <p className="text-3xl font-bold">${stats.averageTicket.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-[#2A2A2A] rounded-lg">
                  <p className="text-gray-400 text-sm">Ingresos Totales</p>
                  <p className="text-4xl font-bold text-green-500">${stats.totalRevenue.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Productos Más Vendidos */}
            <Card className="bg-[#1A1A1A] border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Productos Más Vendidos</CardTitle>
                <ChartPieIcon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topSellingProducts.map((product, index) => (
                    <div key={product.productId} className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-black" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">{product.name}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-sm text-gray-400">{product.quantity} unidades</p>
                          <p className="text-sm font-medium">${product.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Ingresos Diarios */}
            <Card className="bg-[#1A1A1A] border-zinc-800 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Ingresos Diarios (Última Semana)</CardTitle>
                <LineChart className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <AspectRatio ratio={16/9} className="bg-[#222] rounded-md">
                  <ChartContainer 
                    config={{
                      sales: {
                        label: "Ventas",
                        theme: {
                          light: "#8884d8",
                          dark: "#8884d8"
                        }
                      }
                    }}
                  >
                    <BarChart
                      data={stats.dailyRevenueLastWeek}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#999" 
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#999" />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
                        contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }}
                      />
                      <Bar dataKey="revenue" name="Ingresos" fill="var(--color-sales)" />
                    </BarChart>
                  </ChartContainer>
                </AspectRatio>
              </CardContent>
            </Card>
            
            {/* Métodos de Pago */}
            <Card className="bg-[#1A1A1A] border-zinc-800 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Métodos de Pago</CardTitle>
                <ChartBarIcon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-center">
                  <div className="w-full max-w-[300px]">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(stats.paymentMethodBreakdown).map(([name, value]) => ({
                            name,
                            value,
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {Object.entries(stats.paymentMethodBreakdown).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Monto']}
                          contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 md:mt-0 md:ml-8">
                    <h3 className="text-lg font-semibold mb-2">Detalle</h3>
                    <div className="space-y-2">
                      {Object.entries(stats.paymentMethodBreakdown).map(([method, amount], index) => (
                        <div key={method} className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-sm">{method}: ${amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Botón de actualizar */}
            <Card className="bg-[#1A1A1A] border-zinc-800 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Actualizar Datos</CardTitle>
                <Button 
                  onClick={() => {
                    if (urlSubmitted && backupUrl) {
                      setIsDemoData(false);
                      refreshData();
                    }
                  }} 
                  disabled={isLoading || !urlSubmitted}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Actualizar'
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">
                  Haz clic en "Actualizar" para obtener los datos más recientes del respaldo.
                  <br />
                  Última actualización: {stats ? new Date(stats.backupData.timestamp).toLocaleString() : 'No disponible'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
