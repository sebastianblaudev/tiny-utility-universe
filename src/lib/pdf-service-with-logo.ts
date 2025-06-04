
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { companyService } from './company-service';

export interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuotationData {
  quotationNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  date: string;
  validUntil: string;
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

export const generateQuotationPDF = async (data: QuotationData): Promise<void> => {
  const doc = new jsPDF();
  
  // Obtener datos de la empresa
  const company = await companyService.getCompany();
  
  // Colores exactos del diseño
  const primaryBlue = [41, 87, 141] as [number, number, number];
  const white = [255, 255, 255] as [number, number, number];
  const darkText = [51, 51, 51] as [number, number, number];
  const lightGrayBg = [248, 249, 250] as [number, number, number];
  const borderColor = [220, 220, 220] as [number, number, number];

  let currentY = 15;
  
  // === HEADER AZUL COMPLETO ===
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Logo e información de la empresa (lado izquierdo del header)
  if (company?.logo) {
    try {
      doc.addImage(company.logo, 'JPEG', 15, 8, 25, 18);
      
      // Información de la empresa junto al logo
      doc.setTextColor(white[0], white[1], white[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(company.name || 'Empresa', 45, 16);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let companyY = 20;
      if (company.rut) {
        doc.text(`RUT: ${company.rut}`, 45, companyY);
        companyY += 3;
      }
      if (company.address) {
        doc.text(company.address, 45, companyY);
        companyY += 3;
      }
      if (company.phone) {
        doc.text(company.phone, 45, companyY);
        companyY += 3;
      }
      if (company.email) {
        doc.text(company.email, 45, companyY);
      }
      
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      // Sin logo - información centrada
      doc.setTextColor(white[0], white[1], white[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(company?.name || 'Empresa', 105, 18, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      let textY = 24;
      if (company?.rut) {
        doc.text(`RUT: ${company.rut}`, 105, textY, { align: 'center' });
        textY += 4;
      }
      if (company?.address) {
        doc.text(company.address, 105, textY, { align: 'center' });
        textY += 4;
      }
      if (company?.phone) {
        doc.text(company.phone, 105, textY, { align: 'center' });
        textY += 4;
      }
      if (company?.email) {
        doc.text(company.email, 105, textY, { align: 'center' });
      }
    }
  } else {
    // Sin logo - información centrada
    doc.setTextColor(white[0], white[1], white[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name || 'Empresa', 105, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let textY = 26;
    if (company?.rut) {
      doc.text(`RUT: ${company.rut}`, 105, textY, { align: 'center' });
      textY += 4;
    }
    if (company?.address) {
      doc.text(company.address, 105, textY, { align: 'center' });
      textY += 4;
    }
    if (company?.phone) {
      doc.text(company.phone, 105, textY, { align: 'center' });
      textY += 4;
    }
    if (company?.email) {
      doc.text(company.email, 105, textY, { align: 'center' });
    }
  }

  // === INFORMACIÓN DE COTIZACIÓN EN ESQUINA SUPERIOR DERECHA ===
  doc.setTextColor(white[0], white[1], white[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`N° ${data.quotationNumber}`, 195, 14, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${data.date}`, 195, 20, { align: 'right' });
  doc.text(`Válido hasta: ${data.validUntil}`, 195, 26, { align: 'right' });

  currentY = 65;

  // === TÍTULO COTIZACIÓN (SOLO UNA VEZ) ===
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', 105, currentY, { align: 'center' });
  
  // Línea decorativa debajo del título
  doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.setLineWidth(1);
  doc.line(15, currentY + 5, 195, currentY + 5);

  currentY += 15;

  // === INFORMACIÓN DEL CLIENTE ===
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(15, currentY, 180, 28, 'FD');
  
  // Título del cliente
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL CLIENTE', 20, currentY + 8);
  
  // Información del cliente
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.clientName, 20, currentY + 16);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let clientInfoY = currentY + 22;
  
  // Email y teléfono en la misma línea
  if (data.clientEmail && data.clientPhone) {
    doc.text(`Email: ${data.clientEmail}`, 20, clientInfoY);
    doc.text(`Tel: ${data.clientPhone}`, 115, clientInfoY);
  } else if (data.clientEmail) {
    doc.text(`Email: ${data.clientEmail}`, 20, clientInfoY);
  } else if (data.clientPhone) {
    doc.text(`Tel: ${data.clientPhone}`, 20, clientInfoY);
  }
  
  if (data.clientAddress) {
    doc.text(`Dirección: ${data.clientAddress}`, 20, clientInfoY + 4);
  }
  
  currentY += 42;

  // === TABLA DE PRODUCTOS ===
  const tableData = data.items.map(item => [
    item.description,
    item.quantity.toString(),
    `$${item.unitPrice.toLocaleString('es-CL')}`,
    `$${item.total.toLocaleString('es-CL')}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Descripción', 'Cant.', 'Precio Unit.', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryBlue,
      textColor: white,
      fontSize: 10,
      fontStyle: 'bold',
      cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
      textColor: darkText,
      lineColor: borderColor,
      lineWidth: 0.3
    },
    columnStyles: {
      0: { 
        cellWidth: 85,
        halign: 'left'
      },
      1: { 
        cellWidth: 20,
        halign: 'center'
      },
      2: { 
        cellWidth: 35,
        halign: 'right'
      },
      3: { 
        cellWidth: 40,
        halign: 'right',
        fontStyle: 'bold'
      }
    },
    tableLineColor: borderColor,
    tableLineWidth: 0.3,
    margin: { left: 15, right: 15 },
    alternateRowStyles: {
      fillColor: [252, 252, 252] as [number, number, number]
    }
  });

  // === TOTALES ===
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  
  // Posición de totales (lado derecho, más estrecho)
  const totalsX = 140;
  const totalsWidth = 55;
  
  // Rectángulo para totales con fondo gris claro
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(totalsX, finalY, totalsWidth, 35, 'FD');
  
  // Contenido de totales
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Subtotal
  doc.text('Subtotal:', totalsX + 4, finalY + 8);
  doc.text(`$${data.subtotal.toLocaleString('es-CL')}`, totalsX + totalsWidth - 4, finalY + 8, { align: 'right' });
  
  // IVA
  doc.text('IVA (19%):', totalsX + 4, finalY + 16);
  doc.text(`$${data.tax.toLocaleString('es-CL')}`, totalsX + totalsWidth - 4, finalY + 16, { align: 'right' });
  
  // Línea separadora
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.line(totalsX + 4, finalY + 22, totalsX + totalsWidth - 4, finalY + 22);
  
  // Total final
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('TOTAL:', totalsX + 4, finalY + 30);
  doc.text(`$${data.total.toLocaleString('es-CL')}`, totalsX + totalsWidth - 4, finalY + 30, { align: 'right' });

  // === OBSERVACIONES (si existen) ===
  if (data.notes && data.notes.trim()) {
    const notesY = finalY + 50;
    
    doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(15, notesY, 180, 25, 'FD');
    
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVACIONES', 20, notesY + 8);
    
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(data.notes, 170);
    doc.text(splitNotes, 20, notesY + 16);
  }

  // === FOOTER ===
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 20;
  
  // Línea decorativa
  doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.setLineWidth(1);
  doc.line(15, footerY, 195, footerY);
  
  // Texto del footer
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Esta cotización es válida por el período indicado. Precios incluyen IVA.', 105, footerY + 8, { align: 'center' });

  // Guardar el PDF
  doc.save(`cotizacion-${data.quotationNumber}.pdf`);
};
