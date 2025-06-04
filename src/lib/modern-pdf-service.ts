
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

// Configuración personalizable para el PDF
export interface PDFThemeConfig {
  colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'gray';
  showLogo: boolean;
  showClientCard: boolean;
  showNotes: boolean;
  fontFamily: 'helvetica' | 'courier' | 'times';
}

// Opciones por defecto
const defaultConfig: PDFThemeConfig = {
  colorScheme: 'blue',
  showLogo: true,
  showClientCard: true,
  showNotes: true,
  fontFamily: 'helvetica',
};

// Función para guardar la configuración del tema en localStorage
export const saveThemeConfig = (config: PDFThemeConfig): void => {
  localStorage.setItem('cotipro-pdf-theme', JSON.stringify(config));
};

// Función para cargar la configuración del tema desde localStorage
export const loadThemeConfig = (): PDFThemeConfig => {
  try {
    const savedConfig = localStorage.getItem('cotipro-pdf-theme');
    if (savedConfig) {
      return { ...defaultConfig, ...JSON.parse(savedConfig) };
    }
  } catch (error) {
    console.error('Error loading theme config:', error);
  }
  return defaultConfig;
};

// Obtiene los colores según el esquema seleccionado - diseño plano
const getColorScheme = (scheme: PDFThemeConfig['colorScheme']) => {
  const schemes = {
    blue: {
      primary: [31, 81, 135] as [number, number, number],     // Azul oscuro
      secondary: [69, 90, 100] as [number, number, number],   // Gris azulado
      text: [33, 37, 41] as [number, number, number],         // Gris oscuro
    },
    green: {
      primary: [27, 94, 32] as [number, number, number],      // Verde oscuro
      secondary: [69, 90, 100] as [number, number, number],   // Gris azulado
      text: [33, 37, 41] as [number, number, number],         // Gris oscuro
    },
    purple: {
      primary: [74, 20, 140] as [number, number, number],     // Púrpura oscuro
      secondary: [69, 90, 100] as [number, number, number],   // Gris azulado
      text: [33, 37, 41] as [number, number, number],         // Gris oscuro
    },
    orange: {
      primary: [191, 54, 12] as [number, number, number],     // Naranja oscuro
      secondary: [69, 90, 100] as [number, number, number],   // Gris azulado
      text: [33, 37, 41] as [number, number, number],         // Gris oscuro
    },
    gray: {
      primary: [55, 71, 79] as [number, number, number],      // Gris oscuro
      secondary: [69, 90, 100] as [number, number, number],   // Gris azulado
      text: [33, 37, 41] as [number, number, number],         // Gris oscuro
    }
  };

  return {
    primary: schemes[scheme].primary,
    secondary: schemes[scheme].secondary,
    text: schemes[scheme].text,
    lightGray: [248, 249, 250] as [number, number, number],   // Gris muy claro
    mediumGray: [108, 117, 125] as [number, number, number],  // Gris medio
    border: [206, 212, 218] as [number, number, number],      // Borde gris
    white: [255, 255, 255] as [number, number, number],       // Blanco
  };
};

export const generateModernQuotationPDF = async (data: QuotationData, customConfig?: Partial<PDFThemeConfig>): Promise<void> => {
  // Cargar configuración guardada y combinarla con la pasada como parámetro
  const savedConfig = loadThemeConfig();
  const config: PDFThemeConfig = { ...savedConfig, ...customConfig };
  
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Establecer la fuente elegida
  doc.setFont(config.fontFamily, 'normal');
  
  // Obtener datos de la empresa
  const company = await companyService.getCompany();
  
  // Paleta de colores según configuración
  const colors = getColorScheme(config.colorScheme);

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  let currentY = 20;

  // ========== HEADER SUPERIOR - DISEÑO PLANO ==========
  const headerHeight = 40;
  
  // Fondo sólido sin gradientes
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Logo y datos de empresa (lado izquierdo)
  if (config.showLogo && company?.logo) {
    try {
      doc.addImage(company.logo, 'JPEG', margin, 8, 25, 18);
      
      // Información de empresa junto al logo
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFontSize(12);
      doc.setFont(config.fontFamily, 'bold');
      doc.text(company.name || 'Empresa', margin + 30, 16);
      
      doc.setFontSize(8);
      doc.setFont(config.fontFamily, 'normal');
      let infoY = 20;
      if (company.rut) {
        doc.text(`RUT: ${company.rut}`, margin + 30, infoY);
        infoY += 3;
      }
      if (company.phone) {
        doc.text(`Tel: ${company.phone}`, margin + 30, infoY);
        infoY += 3;
      }
      if (company.email) {
        doc.text(company.email, margin + 30, infoY);
      }
      
    } catch (error) {
      console.error('Error adding logo:', error);
      // Fallback sin logo
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFontSize(14);
      doc.setFont(config.fontFamily, 'bold');
      doc.text(company?.name || 'EMPRESA', margin, 20);
    }
  } else {
    // Sin logo
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(14);
    doc.setFont(config.fontFamily, 'bold');
    doc.text(company?.name || 'EMPRESA', margin, 20);
    
    if (company) {
      doc.setFontSize(8);
      doc.setFont(config.fontFamily, 'normal');
      let infoY = 25;
      if (company.rut) {
        doc.text(`RUT: ${company.rut}`, margin, infoY);
        infoY += 3;
      }
      if (company.phone) {
        doc.text(`Tel: ${company.phone}`, margin, infoY);
      }
    }
  }

  // Información de cotización (lado derecho)
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(11);
  doc.setFont(config.fontFamily, 'bold');
  doc.text('COTIZACIÓN', pageWidth - margin, 15, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont(config.fontFamily, 'normal');
  doc.text(`N° ${data.quotationNumber}`, pageWidth - margin, 20, { align: 'right' });
  
  doc.setFontSize(7);
  doc.text(`Fecha: ${data.date}`, pageWidth - margin, 25, { align: 'right' });
  doc.text(`Válido hasta: ${data.validUntil}`, pageWidth - margin, 29, { align: 'right' });

  currentY = headerHeight + 20;

  // ========== TÍTULO PRINCIPAL - LIMPIO ==========
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(18);
  doc.setFont(config.fontFamily, 'bold');
  doc.text('PROPUESTA COMERCIAL', pageWidth / 2, currentY, { align: 'center' });
  
  // Línea simple
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY + 3, pageWidth - margin, currentY + 3);

  currentY += 15;

  // ========== INFORMACIÓN DEL CLIENTE - DISEÑO PLANO ==========
  if (config.showClientCard) {
    const clientCardY = currentY;
    const clientCardHeight = 30;
    
    // Card simple sin sombras
    doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin, clientCardY, pageWidth - 2 * margin, clientCardHeight, 'FD');
    
    // Barra superior simple
    doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.rect(margin, clientCardY, pageWidth - 2 * margin, 6, 'F');
    
    // Título del cliente
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(8);
    doc.setFont(config.fontFamily, 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', margin + 5, clientCardY + 4);
    
    // Datos del cliente
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFontSize(11);
    doc.setFont(config.fontFamily, 'bold');
    doc.text(data.clientName, margin + 5, clientCardY + 13);
    
    doc.setFontSize(8);
    doc.setFont(config.fontFamily, 'normal');
    doc.setTextColor(colors.mediumGray[0], colors.mediumGray[1], colors.mediumGray[2]);
    
    let clientY = clientCardY + 18;
    if (data.clientEmail) {
      doc.text(`Email: ${data.clientEmail}`, margin + 5, clientY);
      clientY += 3;
    }
    if (data.clientPhone) {
      doc.text(`Teléfono: ${data.clientPhone}`, margin + 5, clientY);
      clientY += 3;
    }
    if (data.clientAddress) {
      doc.text(`Dirección: ${data.clientAddress}`, margin + 5, clientY);
    }

    currentY = clientCardY + clientCardHeight + 12;
  } else {
    // Si no se muestra la tarjeta, solo mostrar información básica
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFontSize(11);
    doc.setFont(config.fontFamily, 'bold');
    doc.text(`Cliente: ${data.clientName}`, margin, currentY);
    currentY += 8;
  }

  // ========== TABLA DE PRODUCTOS - DISEÑO LIMPIO ==========
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(12);
  doc.setFont(config.fontFamily, 'bold');
  doc.text('DETALLE DE PRODUCTOS Y SERVICIOS', margin, currentY);
  
  currentY += 6;

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
    theme: 'plain',
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.white,
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: { top: 6, bottom: 6, left: 6, right: 6 },
      halign: 'left',
      lineWidth: 0
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      textColor: colors.text,
      lineColor: colors.border,
      lineWidth: 0.2
    },
    columnStyles: {
      0: { 
        cellWidth: 90,
        halign: 'left'
      },
      1: { 
        cellWidth: 25,
        halign: 'center'
      },
      2: { 
        cellWidth: 35,
        halign: 'right'
      },
      3: { 
        cellWidth: 40,
        halign: 'right',
        fontStyle: 'bold',
        textColor: colors.primary
      }
    },
    alternateRowStyles: {
      fillColor: colors.lightGray
    },
    margin: { left: margin, right: margin }
  });

  // ========== RESUMEN FINANCIERO - DISEÑO PLANO ==========
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  
  // Card de totales simple
  const totalsX = pageWidth - margin - 65;
  const totalsWidth = 65;
  const totalsHeight = 35;
  
  // Card principal sin sombras
  doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.5);
  doc.rect(totalsX, finalY, totalsWidth, totalsHeight, 'FD');
  
  // Barra superior simple
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(totalsX, finalY, totalsWidth, 6, 'F');
  
  // Título
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(8);
  doc.setFont(config.fontFamily, 'bold');
  doc.text('RESUMEN', totalsX + totalsWidth/2, finalY + 4, { align: 'center' });
  
  // Líneas de totales
  doc.setTextColor(colors.mediumGray[0], colors.mediumGray[1], colors.mediumGray[2]);
  doc.setFontSize(8);
  doc.setFont(config.fontFamily, 'normal');
  
  let totalsY = finalY + 12;
  doc.text('Subtotal:', totalsX + 4, totalsY);
  doc.text(`$${data.subtotal.toLocaleString('es-CL')}`, totalsX + totalsWidth - 4, totalsY, { align: 'right' });
  
  totalsY += 4;
  doc.text('IVA (19%):', totalsX + 4, totalsY);
  doc.text(`$${data.tax.toLocaleString('es-CL')}`, totalsX + totalsWidth - 4, totalsY, { align: 'right' });
  
  // Línea divisoria simple
  totalsY += 2;
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.3);
  doc.line(totalsX + 4, totalsY, totalsX + totalsWidth - 4, totalsY);
  
  // Total final
  totalsY += 5;
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(10);
  doc.setFont(config.fontFamily, 'bold');
  doc.text('TOTAL:', totalsX + 4, totalsY);
  doc.text(`$${data.total.toLocaleString('es-CL')}`, totalsX + totalsWidth - 4, totalsY, { align: 'right' });

  // ========== OBSERVACIONES - DISEÑO SIMPLE ==========
  if (config.showNotes && data.notes && data.notes.trim()) {
    const notesY = finalY + totalsHeight + 12;
    
    // Card de notas simple
    doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin, notesY, pageWidth - 2 * margin, 25, 'FD');
    
    // Título
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFontSize(9);
    doc.setFont(config.fontFamily, 'bold');
    doc.text('OBSERVACIONES', margin + 5, notesY + 8);
    
    // Contenido
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFontSize(8);
    doc.setFont(config.fontFamily, 'normal');
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 2 * margin - 10);
    doc.text(splitNotes, margin + 5, notesY + 14);
  }

  // ========== FOOTER SIMPLE ==========
  const footerY = pageHeight - 20;
  
  // Línea simple
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  // Texto del footer
  doc.setTextColor(colors.mediumGray[0], colors.mediumGray[1], colors.mediumGray[2]);
  doc.setFontSize(7);
  doc.setFont(config.fontFamily, 'normal');
  doc.text('Esta cotización es válida por el período indicado. Precios incluyen IVA.', pageWidth / 2, footerY + 6, { align: 'center' });
  
  // Información adicional
  doc.setFontSize(6);
  doc.text('Documento generado electrónicamente', pageWidth / 2, footerY + 10, { align: 'center' });

  // Guardar el PDF
  doc.save(`cotizacion-${data.quotationNumber}.pdf`);
};
