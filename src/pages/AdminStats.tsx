
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AppSidebar } from "@/components/AppSidebar";
import { MenuDrawer } from "@/components/MenuDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBackupStats } from "@/hooks/useBackupStats";
import { Loader2, FileDown, ArrowDown, Share2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

// Default Drive URL - you can replace this with your specific file if needed
const DEFAULT_DRIVE_URL = "https://drive.google.com/file/d/13NDBlGSMiUuy8Tx89wfpKkX0q56UVlTq/view?usp=sharing";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminStats() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = Auth.getInstance();
  const [driveUrl, setDriveUrl] = useState<string>(DEFAULT_DRIVE_URL);
  const [savedDriveUrl, setSavedDriveUrl] = useState<string>(
    localStorage.getItem("adminStatsBackupUrl") || DEFAULT_DRIVE_URL
  );

  // Redirect non-admin users
  React.useEffect(() => {
    if (!auth.isAuthenticated() || !auth.isAdmin()) {
      toast({
        title: "Acceso restringido",
        description: "Necesitas ser administrador para acceder a esta página",
        variant: "destructive"
      });
      navigate("/login");
    }
  }, [navigate, toast]);

  const { stats, isLoading, error, refreshData } = useBackupStats(savedDriveUrl);

  const handleSaveUrl = () => {
    localStorage.setItem("adminStatsBackupUrl", driveUrl);
    setSavedDriveUrl(driveUrl);
    toast({
      title: "URL guardada",
      description: "La URL del respaldo ha sido guardada"
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  // Format payment methods for pie chart
  const paymentMethodsData = stats?.paymentMethodBreakdown 
    ? Object.entries(stats.paymentMethodBreakdown).map(([name, value]) => ({
        name: name === 'efectivo' ? 'Efectivo' : 
              name === 'tarjeta' ? 'Tarjeta' : 
              name === 'transferencia' ? 'Transferencia' : 
              name === 'dividido' ? 'Pago dividido' : name,
        value
      }))
    : [];

  return (
    <div className="flex min-h-screen bg-[#111111]">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      
      <div className="flex-1 p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Estadísticas Administrativas</h1>
            <p className="text-gray-400">Datos extraídos del respaldo en Google Drive</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="block lg:hidden">
              <MenuDrawer />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={refreshData}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Drive URL Input Section */}
        <Card className="mb-6 bg-[#1A1A1A] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-xl">Configuración del Respaldo</CardTitle>
            <CardDescription className="text-gray-400">
              Introduce la URL de Google Drive donde se encuentra el archivo pizzapos_latest_backup.json
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Input 
                value={driveUrl} 
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="URL de Google Drive"
                className="flex-1 bg-[#252525] text-white border-[#333333]"
              />
              <Button onClick={handleSaveUrl} className="bg-orange-500 hover:bg-orange-600">
                Guardar y Cargar
              </Button>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              URL actual: {savedDriveUrl.substring(0, 40)}...
            </div>
          </CardContent>
        </Card>
        
        {/* Error Message */}
        {error && (
          <div className="p-4 mb-6 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300">
            <h3 className="font-bold">Error al cargar datos</h3>
            <p>{error}</p>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            <span className="ml-4 text-xl text-white">Cargando datos del respaldo...</span>
          </div>
        )}
        
        {/* Stats Overview */}
        {!isLoading && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Revenue */}
              <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#252525] border-[#333333] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-300">Ingresos Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</div>
                  <p className="text-sm text-gray-400 mt-2">{stats.orderCount} pedidos en total</p>
                </CardContent>
              </Card>
              
              {/* Average Ticket */}
              <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#252525] border-[#333333] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-300">Ticket Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{formatCurrency(stats.averageTicket)}</div>
                  <p className="text-sm text-gray-400 mt-2">Por pedido</p>
                </CardContent>
              </Card>
              
              {/* Product Count */}
              <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#252525] border-[#333333] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-300">Productos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.productCount}</div>
                  <p className="text-sm text-gray-400 mt-2">Productos registrados</p>
                </CardContent>
              </Card>
              
              {/* Customer Count */}
              <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#252525] border-[#333333] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-300">Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.customerCount}</div>
                  <p className="text-sm text-gray-400 mt-2">Clientes registrados</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Daily Revenue Chart */}
              <Card className="bg-[#1A1A1A] border-[#333333] text-white">
                <CardHeader>
                  <CardTitle className="text-xl">Ingresos Diarios (Última Semana)</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.dailyRevenueLastWeek}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#888"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis 
                        stroke="#888"
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${formatCurrency(value)}`, 'Ingresos']}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return date.toLocaleDateString();
                        }}
                        contentStyle={{ backgroundColor: '#252525', borderColor: '#444' }}
                      />
                      <Bar dataKey="revenue" fill="#FF7700" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Payment Methods Pie Chart */}
              <Card className="bg-[#1A1A1A] border-[#333333] text-white">
                <CardHeader>
                  <CardTitle className="text-xl">Métodos de Pago</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentMethodsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Total']}
                        contentStyle={{ backgroundColor: '#252525', borderColor: '#444' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            
            {/* Top Products Table */}
            <Card className="bg-[#1A1A1A] border-[#333333] text-white mb-8">
              <CardHeader>
                <CardTitle className="text-xl">Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#333333]">
                        <th className="p-3 text-gray-400">Producto</th>
                        <th className="p-3 text-gray-400">Cantidad</th>
                        <th className="p-3 text-gray-400">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topSellingProducts.map((product, index) => (
                        <tr key={index} className="border-b border-[#333333]">
                          <td className="p-3">{product.name}</td>
                          <td className="p-3">{product.quantity}</td>
                          <td className="p-3">{formatCurrency(product.revenue)}</td>
                        </tr>
                      ))}
                      {stats.topSellingProducts.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-3 text-center text-gray-400">
                            No hay datos de productos disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            {/* Backup Info */}
            <Card className="bg-[#1A1A1A] border-[#333333] text-white">
              <CardHeader>
                <CardTitle className="text-xl">Información del Respaldo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 mb-1">Fecha de respaldo:</p>
                    <p className="font-semibold">
                      {new Date(stats?.backupData?.timestamp || '').toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">ID del Negocio:</p>
                    <p className="font-semibold">
                      {stats?.backupData?.business?.id || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Nombre del Negocio:</p>
                    <p className="font-semibold">
                      {stats?.backupData?.business?.name || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Email del Negocio:</p>
                    <p className="font-semibold">
                      {stats?.backupData?.business?.email || 'No disponible'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
