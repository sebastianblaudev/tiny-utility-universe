
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle, Settings, ArrowRight } from "lucide-react";
import { getCompanyInfo, getQuotations, type Company, type Quotation } from "@/lib/db-service";
import { formatCLP } from "@/lib/utils";

const Index = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [recentQuotations, setRecentQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load company info
        const companyData = await getCompanyInfo();
        setCompany(companyData);

        // Load recent quotations
        const allQuotations = await getQuotations();
        // Sort by date (most recent first) and take the 5 most recent
        const recent = allQuotations
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        setRecentQuotations(recent);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
