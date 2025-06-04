
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Quotation, Company, type QuotationItem } from "./db-service";
import { formatCLP, formatDate } from "./utils";

export const exportQuotationToPDF = async (
  quotation: Quotation,
  company: Company | null
): Promise<Blob> => {
  // Crear documento PDF con orientación vertical, unidad mm, tamaño carta
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  // Configuración de colores
  const primaryColor = "#1A3A6C"; // Chile blue
  const accentColor = "#D52B1E"; // Chile red

  let currentY = 20;

  // Logo y encabezado de la empresa
  if (company?.logo) {
    try {
      // Agregar logo
      doc.addImage(company.logo, 'JPEG', 20, currentY, 40, 30);
      
      // Información de la empresa al lado del logo
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text(company.name || 'Empresa', 70, currentY + 10);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(68, 68, 68);
      if (company.rut) doc.text(`RUT: ${company.rut}`, 70, currentY + 16);
      if (company.address) doc.text(company.address, 70, currentY + 22);
      if (company.email) doc.text(company.email, 70, currentY + 28);
      if (company.phone) doc.text(company.phone, 70, currentY + 34);
      
      currentY += 45;
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      // Continuar sin logo si hay error
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor);
      doc.text(company?.name?.toUpperCase() || 'EMPRESA', 105, currentY, { align: "center" });
      currentY += 15;
    }
  } else if (company) {
    // Sin logo, solo encabezado de texto
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text(company.name.toUpperCase(), 105, currentY, { align: "center" });
    currentY += 15;

    // Información de la empresa
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(68, 68, 68);
    doc.text(`RUT: ${company.rut}`, 20, currentY);
    doc.text(`Dirección: ${company.address}`, 20, currentY + 6);
    doc.text(`Email: ${company.email}`, 20, currentY + 12);
    doc.text(`Teléfono: ${company.phone}`, 20, currentY + 18);
    currentY += 25;
  } else {
    // Encabezado simple si no hay info de empresa
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text("COTIZACIÓN", 105, currentY, { align: "center" });
    currentY += 15;
  }

  // Título de cotización
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text("COTIZACIÓN", 105, currentY, { align: "center" });

  // Agregar línea decorativa
  doc.setDrawColor(accentColor);
  doc.setLineWidth(0.5);
  doc.line(20, currentY + 5, 190, currentY + 5);

  // Información de la cotización
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text(`N° ${quotation.id}`, 190, currentY + 15, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(68, 68, 68);
  doc.text(`Fecha: ${formatDate(quotation.date)}`, 190, currentY + 21, { align: "right" });
  doc.text(`Válido hasta: ${formatDate(quotation.validUntil)}`, 190, currentY + 27, { align: "right" });
  
  currentY += 40;

  // Información del cliente
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text("CLIENTE", 20, currentY);
  
  doc.setLineWidth(0.3);
  doc.line(20, currentY + 2, 40, currentY + 2);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(68, 68, 68);
  doc.text(`Nombre: ${quotation.clientName}`, 20, currentY + 8);
  if (quotation.clientRut) doc.text(`RUT: ${quotation.clientRut}`, 20, currentY + 14);
  if (quotation.clientEmail) doc.text(`Email: ${quotation.clientEmail}`, 20, currentY + 20);
  if (quotation.clientPhone) doc.text(`Teléfono: ${quotation.clientPhone}`, 20, currentY + 26);

  // Status de la cotización
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    quotation.status === "accepted" ? "#2E7D32" :
    quotation.status === "rejected" ? "#D32F2F" :
    quotation.status === "sent" ? "#1976D2" : "#757575"
  );
  const statusText = 
    quotation.status === "accepted" ? "ACEPTADA" :
    quotation.status === "rejected" ? "RECHAZADA" :
    quotation.status === "sent" ? "ENVIADA" : "BORRADOR";
  doc.text(`Estado: ${statusText}`, 190, currentY, { align: "right" });

  currentY += 35;

  // Tabla de productos
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text("DETALLE DE PRODUCTOS Y SERVICIOS", 105, currentY, { align: "center" });
  
  currentY += 10;

  const tableColumn = ["Descripción", "Precio Unitario", "Cantidad", "Descuento", "Total"];
  const tableRows = quotation.items.map((item: QuotationItem) => {
    const itemTotal = item.unitPrice * item.quantity * (1 - item.discount / 100);
    return [
      {
        content: item.description ? `${item.name}\n${item.description}` : item.name,
        styles: { cellWidth: 'auto', fontSize: 9 }
      },
      { content: formatCLP(item.unitPrice), styles: { halign: 'right' } },
      { content: item.quantity.toString(), styles: { halign: 'right' } },
      { content: `${item.discount}%`, styles: { halign: 'right' } },
      { content: formatCLP(itemTotal), styles: { halign: 'right', fontStyle: 'bold' } }
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [tableColumn],
    body: tableRows as any[],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
    },
  });

  // Resumen financiero
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(68, 68, 68);
  doc.text("Subtotal:", 150, finalY);
  doc.text(formatCLP(quotation.subtotal), 190, finalY, { align: "right" });
  
  if (quotation.discount > 0) {
    doc.setTextColor(accentColor);
    doc.text("Descuento:", 150, finalY + 6);
    doc.text(`-${formatCLP(quotation.discount)}`, 190, finalY + 6, { align: "right" });
    doc.setTextColor(68, 68, 68);
  }
  
  doc.text("IVA (19%):", 150, finalY + 12);
  doc.text(formatCLP(quotation.tax), 190, finalY + 12, { align: "right" });
  
  // Línea separadora
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(150, finalY + 14, 190, finalY + 14);
  
  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.text("TOTAL:", 150, finalY + 20);
  doc.text(formatCLP(quotation.total), 190, finalY + 20, { align: "right" });
  
  // Notas
  if (quotation.notes) {
    const notesY = finalY + 30;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text("NOTAS:", 20, notesY);
    doc.setLineWidth(0.3);
    doc.line(20, notesY + 2, 45, notesY + 2);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(68, 68, 68);
    
    const splitNotes = doc.splitTextToSize(quotation.notes, 170);
    doc.text(splitNotes, 20, notesY + 8);
  }
  
  // Pie de página
  const pageHeight = doc.internal.pageSize.height;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Cotización generada por CotiPro Chile", 105, pageHeight - 10, { align: "center" });

  // Retornar como Blob para descarga o compartir
  return doc.output('blob');
};

// Función para compartir PDF via WhatsApp
export const shareQuotationPDF = async (
  quotation: Quotation,
  company: Company | null
): Promise<void> => {
  try {
    // Generar el PDF
    const pdfBlob = await exportQuotationToPDF(quotation, company);
    
    // Crear un archivo a partir del blob
    const pdfFile = new File([pdfBlob], `Cotizacion_${quotation.id}.pdf`, { 
      type: 'application/pdf' 
    });
    
    // Preparar mensaje para WhatsApp
    const messageText = `Cotización ${quotation.id} para ${quotation.clientName}. Total: ${formatCLP(quotation.total)}`;
    
    // Verificar si podemos compartir archivos
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      // Usar la API Web Share para compartir el PDF y texto
      await navigator.share({
        files: [pdfFile],
        title: `Cotización ${quotation.id}`,
        text: messageText
      });
      return;
    }
    
    // Alternativa para navegadores que no soportan compartir archivos
    const encodedMessage = encodeURIComponent(messageText);
    window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
  } catch (error) {
    console.error("Error al compartir PDF via WhatsApp:", error);
    throw error;
  }
};

// Nueva función para compartir PDF por correo electrónico
export const shareQuotationByEmail = async (
  quotation: Quotation,
  company: Company | null
): Promise<void> => {
  try {
    // Generar el PDF
    const pdfBlob = await exportQuotationToPDF(quotation, company);
    
    // Crear un URL para el blob
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Construir el asunto del correo
    const subject = encodeURIComponent(`Cotización ${quotation.id} - ${company?.name || 'CotiPro'}`);
    
    // Construir el cuerpo del correo
    const bodyText = `Estimado/a ${quotation.clientName},\n\n` +
      `Adjunto encontrará la cotización ${quotation.id} por un total de ${formatCLP(quotation.total)}.\n` +
      `Esta cotización es válida hasta el ${formatDate(quotation.validUntil)}.\n\n` +
      `Atentamente,\n` +
      `${company?.name || 'CotiPro'}`;
    const body = encodeURIComponent(bodyText);
    
    // Preparar el destinatario si existe
    const to = quotation.clientEmail ? encodeURIComponent(quotation.clientEmail) : '';
    
    // Crear un enlace de descarga temporal para el PDF
    const link = document.createElement('a');
    document.body.appendChild(link); // Necesario para Firefox
    link.href = pdfUrl;
    link.download = `Cotizacion_${quotation.id}.pdf`;
    
    // Primero descargar el PDF (ya que no podemos adjuntarlo directamente)
    link.click();
    
    // Luego abrir el cliente de correo con los campos prellenados
    setTimeout(() => {
      window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');
      // Liberar el URL object
      URL.revokeObjectURL(pdfUrl);
      document.body.removeChild(link);
    }, 100);
    
  } catch (error) {
    console.error("Error al compartir PDF por correo:", error);
    throw error;
  }
};
