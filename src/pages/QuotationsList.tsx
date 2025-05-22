import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getQuotations, deleteQuotation, type Quotation } from "@/lib/db-service";
import { PlusCircle, Search, ArrowRight, Trash2, Copy } from "lucide-react";
import { formatCLP, formatDate } from "@/lib/utils";

const QuotationsList = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      const data = await getQuotations();
      setQuotations(data);
    } catch (error) {
      console.error("Error loading quotations:", error);
      toast.error("Error al cargar las cotizaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta cotización?")) {
      try {
        await deleteQuotation(id);
        setQuotations(quotations.filter((q) => q.id !== id));
        toast.success("Cotización eliminada exitosamente");
      } catch (error) {
        console.error("Error deleting quotation:", error);
        toast.error("Error al eliminar la cotización");
      }
    }
  };

  const duplicateQuotation = async (quotation: Quotation) => {
    try {
      // Create a new ID for the duplicated quotation
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      
      // Get today's count
      const countKey = `quotationCount_${year}${month}${day}`;
      const currentCount = parseInt(localStorage.getItem(countKey) || "0");
      const newCount = currentCount + 1;
      localStorage.setItem(countKey, newCount.toString());
      
      const newId = `COT-${year}${month}${day}-${String(newCount).padStart(3, "0")}`;
      
      // Create duplicate with new ID and current date
      const duplicated: Quotation = {
        ...quotation,
        id: newId,
        date: new Date().toISOString(),
        status: 'draft',
      };
      
      // Save the duplicated quotation
      // This will be implemented in the full version
      
      // For now, we'll just add it to the list and show a toast
      setQuotations([...quotations, duplicated]);
      toast.success("Cotización duplicada exitosamente");
    } catch (error) {
      console.error("Error duplicating quotation:", error);
      toast.error("Error al duplicar la cotización");
    }
  };

  // Filter based on search term and status
  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
      quotation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort by date (most recent first)
  const sortedQuotations = [...filteredQuotations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-chile-blue mb-2">
            Cotizaciones
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus cotizaciones
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild>
            <Link to="/quotations/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nueva Cotización
            </Link>
          </Button>
        </div>
      </div>

      <Card className="cotipro-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Historial de cotizaciones</CardTitle>
          <CardDescription>
            {quotations.length} cotización(es) en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o ID..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                  <SelectItem value="accepted">Aceptada</SelectItem>
                  <SelectItem value="rejected">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Cargando cotizaciones...</p>
            </div>
          ) : quotations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay cotizaciones. Crea tu primera cotización usando el botón "Nueva Cotización".
              </p>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No se encontraron cotizaciones con los filtros actuales.
              </p>
            </div>
          ) : (
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
                  {sortedQuotations.map((quotation) => (
                    <tr
                      key={quotation.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-3">{quotation.id}</td>
                      <td className="p-3">{quotation.clientName}</td>
                      <td className="p-3">{formatDate(quotation.date)}</td>
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
                        <div className="flex justify-center space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            asChild
                          >
                            <Link to={`/quotations/${quotation.id}`}>
                              <ArrowRight className="h-4 w-4 text-chile-blue" />
                              <span className="sr-only">Ver</span>
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => duplicateQuotation(quotation)}
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Duplicar</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(quotation.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationsList;
