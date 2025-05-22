
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle, Settings, ArrowRight, ChartBar, ChartLine, Users } from "lucide-react";
import { getCompanyInfo, getQuotations, type Company, type Quotation } from "@/lib/db-service";
import { formatCLP } from "@/lib/utils";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

const Index = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [recentQuotations, setRecentQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<Array<{name: string, cotizaciones: number, valor: number}>>([]);
  const [statusStats, setStatusStats] = useState<Array<{name: string, value: number}>>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar información de la empresa
        const companyData = await getCompanyInfo();
        setCompany(companyData);

        // Cargar cotizaciones recientes
        const allQuotations = await getQuotations();
        // Ordenar por fecha (más reciente primero) y tomar las 5 más recientes
        const recent = allQuotations
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        setRecentQuotations(recent);

        // Procesar datos para gráficos
        processChartData(allQuotations);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Procesar datos para gráficos
  const processChartData = (quotations: Quotation[]) => {
    // Datos para gráfico mensual
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const currentYear = new Date().getFullYear();
    
    // Inicializar datos mensuales
    const monthlyData = Array(12).fill(0).map((_, i) => ({
      name: monthNames[i],
      cotizaciones: 0,
      valor: 0
    }));

    // Contador de estados
    const statusCount = {
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0
    };

    quotations.forEach(quotation => {
      const date = new Date(quotation.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        monthlyData[month].cotizaciones += 1;
        monthlyData[month].valor += quotation.total;
      }

      // Contar estados
      if (quotation.status === 'draft') statusCount.draft += 1;
      if (quotation.status === 'sent') statusCount.sent += 1;
      if (quotation.status === 'accepted') statusCount.accepted += 1;
      if (quotation.status === 'rejected') statusCount.rejected += 1;
    });

    setMonthlyStats(monthlyData);
    
    setStatusStats([
      { name: 'Borrador', value: statusCount.draft },
      { name: 'Enviada', value: statusCount.sent },
      { name: 'Aceptada', value: statusCount.accepted },
      { name: 'Rechazada', value: statusCount.rejected }
    ]);
  };

  const statusColors = {
    Borrador: "#64748b",
    Enviada: "#3b82f6",
    Aceptada: "#22c55e",
    Rechazada: "#ef4444"
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-chile-blue">
          {company ? `Bienvenido a ${company.name}` : "Bienvenido a CotiPro Chile"}
        </h1>
        <p className="text-muted-foreground mt-2">
          Sistema de cotizaciones profesionales para empresas chilenas
        </p>
      </div>

      {!company && !loading && (
        <Card className="mb-8 border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Configura tu empresa</h3>
              <p className="text-muted-foreground mb-4">
                Para comenzar, configura los datos de tu empresa para que aparezcan en tus cotizaciones.
              </p>
              <Button asChild>
                <Link to="/settings">Configurar ahora</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {company && (
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="cotipro-shadow">
              <CardHeader className="pb-1">
                <CardTitle className="text-lg font-medium flex items-center">
                  <ChartBar className="h-5 w-5 mr-2 text-chile-blue" /> 
                  Cotizaciones este año
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-3xl font-bold">
                  {loading ? "..." : recentQuotations.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de cotizaciones generadas
                </p>
              </CardContent>
            </Card>

            <Card className="cotipro-shadow">
              <CardHeader className="pb-1">
                <CardTitle className="text-lg font-medium flex items-center">
                  <ChartLine className="h-5 w-5 mr-2 text-chile-blue" /> 
                  Valor total
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-3xl font-bold">
                  {loading ? "..." : formatCLP(recentQuotations.reduce((sum, q) => sum + q.total, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Suma de todas las cotizaciones
                </p>
              </CardContent>
            </Card>

            <Card className="cotipro-shadow">
              <CardHeader className="pb-1">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Users className="h-5 w-5 mr-2 text-chile-blue" /> 
                  Tasa de conversión
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-3xl font-bold">
                  {loading ? "..." : recentQuotations.length > 0 
                    ? Math.round((recentQuotations.filter(q => q.status === 'accepted').length / recentQuotations.length) * 100) + '%' 
                    : '0%'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Porcentaje de cotizaciones aceptadas
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Card className="cotipro-shadow">
              <CardHeader>
                <CardTitle>Cotizaciones mensuales</CardTitle>
                <CardDescription>Tendencia de cotizaciones en {new Date().getFullYear()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ChartContainer
                    config={{
                      cotizaciones: {
                        label: "Cotizaciones",
                        theme: {
                          light: "#1A3A6C",
                          dark: "#60a5fa",
                        },
                      },
                      valor: {
                        label: "Valor Total",
                        theme: {
                          light: "#D52B1E",
                          dark: "#ef4444",
                        },
                      },
                    }}
                  >
                    <LineChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="cotizaciones" 
                        name="Cotizaciones" 
                        stroke="var(--color-cotizaciones)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="valor"
                        name="Valor Total (CLP)"
                        stroke="var(--color-valor)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="cotipro-shadow">
              <CardHeader>
                <CardTitle>Estado de cotizaciones</CardTitle>
                <CardDescription>Distribución por estado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusStats}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [`${value} cotizaciones`, name]}
                        labelFormatter={(label) => `Estado: ${label}`}
                      />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        name="Cotizaciones"
                        fill="#1A3A6C"
                        radius={[4, 4, 0, 0]}
                        fillOpacity={0.8}
                      >
                        {statusStats.map((entry, index) => (
                          <g key={`cell-${index}`}>
                            <rect
                              x={0}
                              y={0}
                              width="100%"
                              height="100%"
                              fill={statusColors[entry.name as keyof typeof statusColors] || "#1A3A6C"}
                            />
                          </g>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cotipro-shadow hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Nueva cotización</span>
              <PlusCircle className="h-5 w-5 text-chile-blue" />
            </CardTitle>
            <CardDescription>Crea una nueva cotización para un cliente</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex items-center justify-center">
            <p className="text-muted-foreground">Genera cotizaciones profesionales en segundos</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link to="/quotations/new">Crear cotización</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="cotipro-shadow hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Historial</span>
              <FileText className="h-5 w-5 text-chile-blue" />
            </CardTitle>
            <CardDescription>
              Ver historial completo de cotizaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex items-center justify-center">
            <p className="text-muted-foreground">
              {recentQuotations.length === 0
                ? "No hay cotizaciones recientes"
                : `${recentQuotations.length} cotización(es) reciente(s)`}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/quotations">Ver historial</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="cotipro-shadow hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Productos</span>
              <FileText className="h-5 w-5 text-chile-blue" />
            </CardTitle>
            <CardDescription>
              Administra tu catálogo de productos
            </CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex items-center justify-center">
            <p className="text-muted-foreground">
              Gestiona tu catálogo de productos y servicios
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/products">Ver productos</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {recentQuotations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-heading font-semibold mb-4">Cotizaciones recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Cliente</th>
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotations.map((quotation) => (
                  <tr
                    key={quotation.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3">{quotation.id}</td>
                    <td className="p-3">{quotation.clientName}</td>
                    <td className="p-3">{new Date(quotation.date).toLocaleDateString('es-CL')}</td>
                    <td className="p-3 text-right">{formatCLP(quotation.total)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs capitalize ${
                          quotation.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : quotation.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : quotation.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {quotation.status === 'accepted'
                          ? 'Aceptada'
                          : quotation.status === 'rejected'
                          ? 'Rechazada'
                          : quotation.status === 'sent'
                          ? 'Enviada'
                          : 'Borrador'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        to={`/quotations/${quotation.id}`}
                        className="text-chile-blue hover:text-blue-700 inline-flex items-center"
                      >
                        Ver <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
