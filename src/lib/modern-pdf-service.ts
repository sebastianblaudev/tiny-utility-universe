
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

// Obtiene los colores según el esquema seleccionado
const getColorScheme = (scheme: PDFThemeConfig['colorScheme']) => {
  const schemes = {
    blue: {
      primary: [41, 87, 141] as [number, number, number],     // Azul corporativo
      accent: [52, 152, 219] as [number, number, number],     // Azul claro
      success: [46, 204, 113] as [number, number, number],    // Verde
    },
    green: {
      primary: [39, 174, 96] as [number, number, number],     // Verde principal
      accent: [46, 204, 113] as [number, number, number],     // Verde claro
      success: [39, 174, 96] as [number, number, number],     // Verde igual al primario
    },
    purple: {
      primary: [142, 68, 173] as [number, number, number],    // Púrpura
      accent: [155, 89, 182] as [number, number, number],     // Lila
      success: [46, 204, 113] as [number, number, number],    // Verde
    },
    orange: {
      primary: [211, 84, 0] as [number, number, number],      // Naranja oscuro
      accent: [230, 126, 34] as [number, number, number],     // Naranja claro
      success: [46, 204, 113] as [number, number, number],    // Verde
    },
    gray: {
      primary: [44, 62, 80] as [number, number, number],      // Gris oscuro
      accent: [127, 140, 141] as [number, number, number],    // Gris medio
      success: [44, 62, 80] as [number, number, number],      // Gris oscuro
    }
  };

  return {
    primary: schemes[scheme].primary,
    accent: schemes[scheme].accent,
    success: schemes[scheme].success,
    dark: [44, 62, 80] as [number, number, number],         // Gris oscuro
    medium: [127, 140, 141] as [number, number, number],    // Gris medio
    light: [236, 240, 241] as [number, number, number],     // Gris claro
    white: [255, 255, 255] as [number, number, number],     // Blanco
    divider: [189, 195, 199] as [number, number, number]    // Divisor
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

  // ========== HEADER SUPERIOR ==========
  // Fondo degradado simulado con rectángulos de diferentes tonos
  const headerHeight = 45;
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  
  // Agregar un efecto de gradiente con múltiples rectángulos
  for (let i = 0; i < 15; i++) {
    const lightness = Math.floor(colors.primary[0] + (i * 3));
    doc.setFillColor(lightness, colors.primary[1] + (i * 2), colors.primary[2] + (i * 2));
    doc.rect(0, headerHeight - 15 + i, pageWidth, 1, 'F');
  }

  // Logo y datos de empresa (lado izquierdo)
  if (config.showLogo && company?.logo) {
    try {
      doc.addImage(company.logo, 'JPEG', margin, 12, 30, 22);
      
      // Información de empresa junto al logo
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFontSize(14);
      doc.setFont(config.fontFamily, 'bold');
      doc.text(company.name || 'Empresa', margin + 35, 20);
      
      doc.setFontSize(8);
      doc.setFont(config.fontFamily, 'normal');
      let infoY = 25;
      if (company.rut) {
        doc.text(`RUT: ${company.rut}`, margin + 35, infoY);
        infoY += 3.5;
      }
      if (company.phone) {
        doc.text(`Tel: ${company.phone}`, margin + 35, infoY);
        infoY += 3.5;
      }
      if (company.email) {
        doc.text(company.email, margin + 35, infoY);
      }
      
    } catch (error) {
      console.error('Error adding logo:', error);
      // Fallback sin logo
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFontSize(16);
      doc.setFont(config.fontFamily, 'bold');
      doc.text(company?.name || 'EMPRESA', margin, 25);
    }
  } else {
    // Sin logo
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(16);
    doc.setFont(config.fontFamily, 'bold');
    doc.text(company?.name || 'EMPRESA', margin, 25);
    
    if (company) {
      doc.setFontSize(8);
      doc.setFont(config.fontFamily, 'normal');
      let infoY = 30;
      if (company.rut) {
        doc.text(`RUT: ${company.rut}`, margin, infoY);
        infoY += 4;
      }
      if (company.phone) {
        doc.text(`Tel: ${company.phone}`, margin, infoY);
      }
    }
  }

  // Información de cotización (lado derecho)
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(12);
  doc.setFont(config.fontFamily, 'bold');
  doc.text('COTIZACIÓN', pageWidth - margin, 18, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont(config.fontFamily, 'normal');
  doc.text(`N° ${data.quotationNumber}`, pageWidth - margin, 24, { align: 'right' });
  
  doc.setFontSize(8);
  doc.text(`Fecha: ${data.date}`, pageWidth - margin, 30, { align: 'right' });
  doc.text(`Válido hasta: ${data.validUntil}`, pageWidth - margin, 35, { align: 'right' });

  currentY = headerHeight + 25;

  // ========== TÍTULO PRINCIPAL ==========
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(24);
  doc.setFont(config.fontFamily, 'bold');
  doc.text('PROPUESTA COMERCIAL', pageWidth / 2, currentY, { align: 'center' });
  
  // Línea decorativa
  doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.setLineWidth(2);
  doc.line(margin, currentY + 5, pageWidth - margin, currentY + 5);

  currentY += 20;

  // ========== INFORMACIÓN DEL CLIENTE ==========
  if (config.showClientCard) {
    // Card con sombra simulada (rectángulos desplazados)
    const clientCardY = currentY;
    const clientCardHeight = 35;
    
    // Sombra simulada con rectángulos grises
    doc.setFillColor(200, 200, 200);
    doc.roundedRect(margin + 2, clientCardY + 2, pageWidth - 2 * margin, clientCardHeight, 3, 3, 'F');
    
    // Card principal
    doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setDrawColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, clientCardY, pageWidth - 2 * margin, clientCardHeight, 3, 3, 'FD');
    
    // Barra superior del card
    doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.roundedRect(margin, clientCardY, pageWidth - 2 * margin, 8, 3, 3, 'F');
    doc.rect(margin, clientCardY + 4, pageWidth - 2 * margin, 4, 'F');
    
    // Título del cliente
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(10);
    doc.setFont(config.fontFamily, 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', margin + 8, clientCardY + 6);
    
    // Datos del cliente
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(12);
    doc.setFont(config.fontFamily, 'bold');
    doc.text(data.clientName, margin + 8, clientCardY + 16);
    
    doc.setFontSize(9);
    doc.setFont(config.fontFamily, 'normal');
    doc.setTextColor(colors.medium[0], colors.medium[1], colors.medium[2]);
    
    let clientY = clientCardY + 22;
    if (data.clientEmail) {
      doc.text(`✉ ${data.clientEmail}`, margin + 8, clientY);
      clientY += 4;
    }
    if (data.clientPhone) {
      doc.text(`📞 ${data.clientPhone}`, margin + 8, clientY);
      clientY += 4;
    }
    if (data.clientAddress) {
      doc.text(`📍 ${data.clientAddress}`, margin + 8, clientY);
    }

    currentY = clientCardY + clientCardHeight + 15;
  } else {
    // Si no se muestra la tarjeta, solo mostrar información básica
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(12);
    doc.setFont(config.fontFamily, 'bold');
    doc.text(`Cliente: ${data.clientName}`, margin, currentY);
    currentY += 10;
  }

  // ========== TABLA DE PRODUCTOS ==========
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(14);
  doc.setFont(config.fontFamily, 'bold');
  doc.text('DETALLE DE PRODUCTOS Y SERVICIOS', margin, currentY);
  
  currentY += 8;

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
      fontSize: 10,
      fontStyle: 'bold',
      cellPadding: { top: 8, bottom: 8, left: 8, right: 8 },
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
      textColor: colors.dark,
      lineColor: colors.divider,
      lineWidth: 0.1
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
      fillColor: [249, 249, 249] as [number, number, number]
    },
    margin: { left: margin, right: margin }
  });

  // ========== RESUMEN FINANCIERO ==========
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // Card de totales
  const totalsX = pageWidth - margin - 70;
  const totalsWidth = 70;
  const totalsHeight = 45;
  
  // Sombra del card simulada
  doc.setFillColor(200, 200, 200);
  doc.roundedRect(totalsX + 2, finalY + 2, totalsWidth, totalsHeight, 4, 4, 'F');
  
  // Card principal
  doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setDrawColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalsX, finalY, totalsWidth, totalsHeight, 4, 4, 'FD');
  
  // Barra superior
  doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.roundedRect(totalsX, finalY, totalsWidth, 8, 4, 4, 'F');
  doc.rect(totalsX, finalY + 4, totalsWidth, 4, 'F');
  
  // Título
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(9);
  doc.setFont(config.fontFamily, 'bold');
  doc.text('RESUMEN', totalsX + totalsWidth/2, finalY + 6, { align: 'center' });
  
  // Líneas de totales
  doc.setTextColor(colors.medium[0], colors.medium[1], colors.medium[2]);
  doc.setFontSize(9);
  doc.setFont(config.fontFamily, 'normal');
  
  let totalsY = finalY + 16;
  doc.text('Subtotal:', totalsX + 5, totalsY);
  doc.text(`$${data.subtotal.toLocaleString('es-CL')}`, totalsX + totalsWidth - 5, totalsY, { align: 'right' });
  
  totalsY += 5;
  doc.text('IVA (19%):', totalsX + 5, totalsY);
  doc.text(`$${data.tax.toLocaleString('es-CL')}`, totalsX + totalsWidth - 5, totalsY, { align: 'right' });
  
  // Línea divisoria
  totalsY += 3;
  doc.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2]);
  doc.setLineWidth(0.5);
  doc.line(totalsX + 5, totalsY, totalsX + totalsWidth - 5, totalsY);
  
  // Total final
  totalsY += 6;
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(11);
  doc.setFont(config.fontFamily, 'bold');
  doc.text('TOTAL:', totalsX + 5, totalsY);
  doc.text(`$${data.total.toLocaleString('es-CL')}`, totalsX + totalsWidth - 5, totalsY, { align: 'right' });

  // ========== OBSERVACIONES ==========
  if (config.showNotes && data.notes && data.notes.trim()) {
    const notesY = finalY + totalsHeight + 15;
    
    // Card de notas
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, notesY, pageWidth - 2 * margin, 30, 3, 3, 'FD');
    
    // Título
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFontSize(10);
    doc.setFont(config.fontFamily, 'bold');
    doc.text('OBSERVACIONES', margin + 8, notesY + 10);
    
    // Contenido
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(9);
    doc.setFont(config.fontFamily, 'normal');
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 2 * margin - 16);
    doc.text(splitNotes, margin + 8, notesY + 18);
  }

  // ========== FOOTER ==========
  const footerY = pageHeight - 25;
  
  // Línea decorativa
  doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.setLineWidth(1);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  // Texto del footer
  doc.setTextColor(colors.medium[0], colors.medium[1], colors.medium[2]);
  doc.setFontSize(8);
  doc.setFont(config.fontFamily, 'italic');
  doc.text('Esta cotización es válida por el período indicado. Precios incluyen IVA.', pageWidth / 2, footerY + 8, { align: 'center' });
  
  // Información adicional
  doc.setFontSize(7);
  doc.text('Documento generado electrónicamente', pageWidth / 2, footerY + 13, { align: 'center' });

  // Guardar el PDF
  doc.save(`cotizacion-${data.quotationNumber}.pdf`);
};

