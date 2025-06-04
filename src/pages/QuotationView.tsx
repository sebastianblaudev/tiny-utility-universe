import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getQuotationById, getCompanyInfo, saveQuotation, type Quotation, type Company } from "@/lib/db-service";
import { exportQuotationToPDF, shareQuotationPDF, shareQuotationByEmail } from "@/lib/pdf-service";
import { generateModernQuotationPDF, loadThemeConfig } from "@/lib/modern-pdf-service";
import { ArrowLeft, Printer, FileText, Share, Send, SendHorizontal, Check, X, Pencil, FileCheck, Mail, Edit, Copy, Settings } from "lucide-react";
import { formatCLP, formatDate } from "@/lib/utils";
import PDFStyleSettings from "@/components/PDFStyleSettings";

const QuotationView = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Quotation["status"]>("draft");
  const [showPdfSettings, setShowPdfSettings] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id) {
          const quotationData = await getQuotationById(id);
          setQuotation(quotationData);
          setSelectedStatus(quotationData?.status || "draft");
          const companyData = await getCompanyInfo();
          setCompany(companyData);
        }
      } catch (error) {
        console.error("Error loading quotation:", error);
        toast.error("Error al cargar la cotización");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleExportPDF = async () => {
    try {
      if (!quotation) return;
      setPdfLoading(true);
      
      // Usar el servicio de PDF moderno con la configuración guardada
      const themeConfig = loadThemeConfig();
      const quotationData = {
        quotationNumber: quotation.id,
        clientName: quotation.clientName,
        clientEmail: quotation.clientEmail || '',
        clientPhone: quotation.clientPhone || '',
        clientAddress: '', // No tenemos este campo en el modelo actual
        date: formatDate(quotation.date),
        validUntil: formatDate(quotation.validUntil),
        items: quotation.items.map(item => ({
          description: item.description ? `${item.name}\n${item.description}` : item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity * (1 - item.discount / 100)
        })),
        subtotal: quotation.subtotal,
        tax: quotation.tax,
        total: quotation.total,
        notes: quotation.notes
      };
      
      await generateModernQuotationPDF(quotationData);
      toast.success("PDF exportado correctamente");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Error al exportar el PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      if (!quotation) return;
      setPdfLoading(true);
      
      // Usar el servicio original para imprimir (ya que necesitamos el blob)
      const pdfBlob = await exportQuotationToPDF(quotation, company);
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          setPdfLoading(false);
        };
      } else {
        setPdfLoading(false);
        toast.error("El navegador bloqueó la ventana emergente. Permita ventanas emergentes e intente nuevamente.");
      }
    } catch (error) {
      console.error("Error printing PDF:", error);
      toast.error("Error al imprimir");
      setPdfLoading(false);
    }
  };

  const shareViaWhatsApp = async () => {
    try {
      if (!quotation) return;
      setPdfLoading(true);
      await shareQuotationPDF(quotation, company);
      toast.success("Cotización compartida correctamente");
    } catch (error) {
      console.error("Error sharing via WhatsApp:", error);
      toast.error("Error al compartir la cotización");
    } finally {
      setPdfLoading(false);
      setShowShareDialog(false);
    }
  };

  const shareViaEmail = async () => {
    try {
      if (!quotation) return;
      setPdfLoading(true);
      await shareQuotationByEmail(quotation, company);
      toast.success("Preparando email con cotización adjunta");
    } catch (error) {
      console.error("Error sharing via email:", error);
      toast.error("Error al preparar el email");
    } finally {
      setPdfLoading(false);
      setShowShareDialog(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      if (!quotation || !id) return;
      setUpdatingStatus(true);

      const updatedQuotation: Quotation = {
        ...quotation,
        status: selectedStatus
      };
      await saveQuotation(updatedQuotation);
      setQuotation(updatedQuotation);
      setShowStatusDialog(false);
      const statusLabels = {
        draft: "borrador",
        created: "creada",
        sent: "enviada",
        accepted: "aceptada",
        rejected: "rechazada"
      };
      toast.success(`Estado actualizado a ${statusLabels[selectedStatus]}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: Quotation["status"]) => {
    switch (status) {
      case "accepted":
        return "bg-green-600";
      case "rejected":
        return "bg-red-600";
      case "sent":
        return "bg-blue-600";
      case "created":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: Quotation["status"]) => {
    switch (status) {
      case "accepted":
        return <Check className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      case "sent":
        return <Send className="h-4 w-4" />;
      case "created":
        return <FileCheck className="h-4 w-4" />;
      default:
        return <Pencil className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: Quotation["status"]) => {
    switch (status) {
      case "accepted":
        return "Aceptada";
      case "rejected":
        return "Rechazada";
      case "sent":
        return "Enviada";
      case "created":
        return "Creada";
      default:
        return "Borrador";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p>Cargando cotización...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Cotización no encontrada</h1>
          <p className="mb-6">La cotización que buscas no existe o ha sido eliminada.</p>
          <Button asChild>
            <Link to="/quotations">Volver a la lista de cotizaciones</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center">
          <Button variant="outline" size="icon" asChild className="mr-4">
            <Link to="/quotations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-chile-blue mb-2">
              {quotation?.id}
            </h1>
            <p className="text-muted-foreground">
              Cliente: {quotation?.clientName}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
          >
            <Link to={`/quotations/edit/${id}?edit=true`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            asChild
          >
            <Link to={`/quotations/edit/${id}?duplicate=true`}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Link>
          </Button>

          {/* Agregar diálogo para personalizar PDF */}
          <Dialog open={showPdfSettings} onOpenChange={setShowPdfSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Estilo PDF
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Personalizar Estilo de PDF</DialogTitle>
              </DialogHeader>
              <PDFStyleSettings />
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={pdfLoading}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={pdfLoading}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          
          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Compartir
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Compartir cotización</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Seleccione una opción para compartir la cotización {quotation?.id} para {quotation?.clientName}
                </p>
                <div className="flex justify-center flex-wrap gap-4">
                  <Button onClick={handleExportPDF} className="flex flex-col items-center h-auto py-4 px-6" disabled={pdfLoading}>
                    <FileText className="h-8 w-8 mb-2" />
                    <span>Exportar PDF</span>
                  </Button>
                  
                  <Button onClick={shareViaWhatsApp} variant="default" className="flex flex-col items-center h-auto py-4 px-6 bg-green-600 hover:bg-green-700" disabled={pdfLoading}>
                    <SendHorizontal className="h-8 w-8 mb-2" />
                    <span>WhatsApp</span>
                  </Button>
                  
                  <Button onClick={shareViaEmail} variant="default" className="flex flex-col items-center h-auto py-4 px-6 bg-blue-600 hover:bg-blue-700" disabled={pdfLoading}>
                    <Mail className="h-8 w-8 mb-2" />
                    <span>Email</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Status change dialog */}
          <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className={`${getStatusColor(quotation?.status || "draft")} text-white hover:opacity-90`}>
                {getStatusIcon(quotation?.status || "draft")}
                <span className="ml-2">Cambiar estado</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Actualizar estado de la cotización</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Seleccione el nuevo estado para la cotización {quotation?.id}
                </p>
                
                <RadioGroup value={selectedStatus} onValueChange={value => setSelectedStatus(value as Quotation["status"])} className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="draft" id="draft" className="text-gray-400" />
                    <div className="flex items-center ml-2 cursor-pointer w-full" onClick={() => setSelectedStatus("draft")}>
                      <div className="bg-gray-400 rounded-full p-2 mr-3 text-white">
                        <Pencil className="h-4 w-4" />
                      </div>
                      <Label htmlFor="draft" className="cursor-pointer flex-1">
                        <span className="font-medium">Borrador</span>
                        <p className="text-muted-foreground text-xs">Cotización en preparación, no enviada al cliente</p>
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="created" id="created" className="text-gray-500" />
                    <div className="flex items-center ml-2 cursor-pointer w-full" onClick={() => setSelectedStatus("created")}>
                      <div className="bg-gray-500 rounded-full p-2 mr-3 text-white">
                        <FileCheck className="h-4 w-4" />
                      </div>
                      <Label htmlFor="created" className="cursor-pointer flex-1">
                        <span className="font-medium">Creada</span>
                        <p className="text-muted-foreground text-xs">Cotización creada y lista para enviar al cliente</p>
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="sent" id="sent" className="text-blue-600" />
                    <div className="flex items-center ml-2 cursor-pointer w-full" onClick={() => setSelectedStatus("sent")}>
                      <div className="bg-blue-600 rounded-full p-2 mr-3 text-white">
                        <Send className="h-4 w-4" />
                      </div>
                      <Label htmlFor="sent" className="cursor-pointer flex-1">
                        <span className="font-medium">Enviada</span>
                        <p className="text-muted-foreground text-xs">Cotización enviada al cliente, esperando respuesta</p>
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="accepted" id="accepted" className="text-green-600" />
                    <div className="flex items-center ml-2 cursor-pointer w-full" onClick={() => setSelectedStatus("accepted")}>
                      <div className="bg-green-600 rounded-full p-2 mr-3 text-white">
                        <Check className="h-4 w-4" />
                      </div>
                      <Label htmlFor="accepted" className="cursor-pointer flex-1">
                        <span className="font-medium">Aceptada</span>
                        <p className="text-muted-foreground text-xs">Cotización aceptada por el cliente</p>
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="rejected" id="rejected" className="text-red-600" />
                    <div className="flex items-center ml-2 cursor-pointer w-full" onClick={() => setSelectedStatus("rejected")}>
                      <div className="bg-red-600 rounded-full p-2 mr-3 text-white">
                        <X className="h-4 w-4" />
                      </div>
                      <Label htmlFor="rejected" className="cursor-pointer flex-1">
                        <span className="font-medium">Rechazada</span>
                        <p className="text-muted-foreground text-xs">Cotización rechazada por el cliente</p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                <Button onClick={handleStatusChange} className={`${getStatusColor(selectedStatus)} text-white hover:opacity-90`} disabled={updatingStatus || selectedStatus === quotation?.status}>
                  {updatingStatus ? 'Actualizando...' : 'Actualizar estado'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="cotipro-shadow mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <CardTitle className="text-xl mb-2">Detalles de la Cotización</CardTitle>
              <CardDescription>
                Fecha: {formatDate(quotation.date)}
              </CardDescription>
            </div>
            <div className="mt-4 md:mt-0 px-4 py-2 bg-muted rounded-md flex items-center gap-2">
              <div>
                <p className="text-sm">Estado:</p>
                <p className={`font-semibold capitalize ${quotation.status === 'accepted' ? 'text-green-600' : quotation.status === 'rejected' ? 'text-red-600' : quotation.status === 'sent' ? 'text-blue-600' : 'text-gray-600'}`}>
                  {getStatusLabel(quotation.status)}
                </p>
              </div>
              <Badge className={`ml-2 ${getStatusColor(quotation.status)}`}>
                {getStatusIcon(quotation.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Información del Cliente</h3>
              <div className="bg-muted p-4 rounded-md">
                <p className="font-semibold">{quotation.clientName}</p>
                {quotation.clientRut && <p>RUT: {quotation.clientRut}</p>}
                {quotation.clientEmail && <p>Email: {quotation.clientEmail}</p>}
                {quotation.clientPhone && <p>Teléfono: {quotation.clientPhone}</p>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Información de la Empresa</h3>
              <div className="bg-muted p-4 rounded-md">
                {company ? (
                  <>
                    <p className="font-semibold">{company.name}</p>
                    <p>RUT: {company.rut}</p>
                    <p>Dirección: {company.address}</p>
                    <p>Email: {company.email}</p>
                    <p>Teléfono: {company.phone}</p>
                  </>
                ) : (
                  <p>Información de empresa no configurada</p>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <h3 className="font-semibold mb-4">Productos y Servicios</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 text-left">Descripción</th>
                  <th className="py-2 px-3 text-right">Precio Unitario</th>
                  <th className="py-2 px-3 text-right">Cantidad</th>
                  <th className="py-2 px-3 text-right">Descuento</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-border">
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">{formatCLP(item.unitPrice)}</td>
                    <td className="py-3 px-3 text-right">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">{item.discount}%</td>
                    <td className="py-3 px-3 text-right font-medium">
                      {formatCLP(item.unitPrice * item.quantity * (1 - item.discount / 100))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full md:w-64">
              <div className="flex justify-between py-2">
                <span>Subtotal:</span>
                <span>{formatCLP(quotation.subtotal)}</span>
              </div>
              {quotation.discount > 0 && (
                <div className="flex justify-between py-2 text-red-600">
                  <span>Descuento:</span>
                  <span>-{formatCLP(quotation.discount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span>IVA (19%):</span>
                <span>{formatCLP(quotation.tax)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between py-2 font-bold">
                <span>Total:</span>
                <span>{formatCLP(quotation.total)}</span>
              </div>
            </div>
          </div>

          {quotation.notes && (
            <div className="mt-6 p-4 bg-muted rounded-md">
              <h3 className="font-semibold mb-2">Notas</h3>
              <p>{quotation.notes}</p>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">
              Esta cotización es válida hasta: {formatDate(quotation.validUntil)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationView;
