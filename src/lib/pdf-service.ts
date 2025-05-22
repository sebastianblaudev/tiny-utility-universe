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

  // Preparar el documento
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.setFontSize(20);

  // Logo y encabezado
  if (company) {
    doc.text("COTIZACIÓN", 105, 20, { align: "center" });
    doc.setFontSize(22);
    doc.text(company.name.toUpperCase(), 105, 30, { align: "center" });

    // Agregar línea decorativa
    doc.setDrawColor(accentColor);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Información de la empresa
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(68, 68, 68);
    doc.text(`RUT: ${company.rut}`, 20, 42);
    doc.text(`Dirección: ${company.address}`, 20, 48);
    doc.text(`Email: ${company.email}`, 20, 54);
    doc.text(`Teléfono: ${company.phone}`, 20, 60);

    // Información de la cotización
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text(`N° ${quotation.id}`, 190, 42, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(68, 68, 68);
    doc.text(`Fecha: ${formatDate(quotation.date)}`, 190, 48, { align: "right" });
    doc.text(`Válido hasta: ${formatDate(quotation.validUntil)}`, 190, 54, { align: "right" });
  } else {
    // Encabezado simple si no hay info de empresa
    doc.text(`COTIZACIÓN N° ${quotation.id}`, 105, 30, { align: "center" });
    
    // Agregar línea decorativa
    doc.setDrawColor(accentColor);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(68, 68, 68);
    doc.text(`Fecha: ${formatDate(quotation.date)}`, 20, 42);
    doc.text(`Válido hasta: ${formatDate(quotation.validUntil)}`, 20, 48);
  }

  // Información del cliente
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text("CLIENTE", 20, 70);
  
  doc.setLineWidth(0.3);
  doc.line(20, 72, 40, 72);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(68, 68, 68);
  doc.text(`Nombre: ${quotation.clientName}`, 20, 78);
  if (quotation.clientRut) doc.text(`RUT: ${quotation.clientRut}`, 20, 84);
  if (quotation.clientEmail) doc.text(`Email: ${quotation.clientEmail}`, 20, 90);
  if (quotation.clientPhone) doc.text(`Teléfono: ${quotation.clientPhone}`, 20, 96);

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
  doc.text(`Estado: ${statusText}`, 190, 70, { align: "right" });

  // Tabla de productos
  const startY = 105;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text("DETALLE DE PRODUCTOS Y SERVICIOS", 105, startY - 5, { align: "center" });
  
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
    startY,
    head: [tableColumn],
    body: tableRows as any[], // Type assertion to avoid TypeScript errors
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
