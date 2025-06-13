import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBarber } from '@/contexts/BarberContext';
import { Download, X } from 'lucide-react';
import { Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import JsBarcode from 'jsbarcode';

interface DownloadSingleBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

const DownloadSingleBarcodeModal = ({ isOpen, onClose, service }: DownloadSingleBarcodeModalProps) => {
  const { barbers } = useBarber();
  const { toast } = useToast();

  const getBarberName = (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    return barber ? barber.name : 'Barbero no encontrado';
  };

  const generateHighQualityBarcodeDataURL = (value: string): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    try {
      // Configuración para alta calidad y nitidez
      JsBarcode(canvas, value, {
        format: 'CODE128',
        width: 3,
        height: 80,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
        fontOptions: 'bold',
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 8,
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10
      });
      
      return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      console.error('Error generating barcode:', error);
      return '';
    }
  };

  const generatePrintableHTML = (): string => {
    if (!service) return '';

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Códigos de Barras - ${service.name}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 3mm;
          }
          
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
            line-height: 1.3;
            font-size: 12px;
          }
          
          .barcode-container {
            width: 74mm;
            margin: 0 auto 12mm auto;
            text-align: center;
            page-break-inside: avoid;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 8mm;
            background: white;
          }
          
          .service-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4mm;
            word-wrap: break-word;
            color: #000;
          }
          
          .barber-name {
            font-size: 13px;
            color: #333;
            margin-bottom: 4mm;
            font-weight: 600;
          }
          
          .barcode-image {
            width: 70mm;
            height: auto;
            margin: 4mm 0;
            display: block;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            image-rendering: pixelated;
            -ms-interpolation-mode: nearest-neighbor;
          }
          
          .price {
            font-size: 18px;
            font-weight: bold;
            margin: 4mm 0;
            color: #000;
          }
          
          .barcode-text {
            font-size: 11px;
            color: #666;
            font-family: 'Courier New', monospace;
            margin-top: 3mm;
            letter-spacing: 1px;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .barcode-container { 
              page-break-inside: avoid;
            }
            .barcode-image {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
    `;

    // Código general del servicio
    if (service.barcode) {
      const barcodeDataURL = generateHighQualityBarcodeDataURL(service.barcode);
      if (barcodeDataURL) {
        html += `
          <div class="barcode-container">
            <div class="service-name">${service.name}</div>
            <div class="barber-name">Código General</div>
            <img src="${barcodeDataURL}" alt="${service.barcode}" class="barcode-image" />
            <div class="price">$${service.price.toFixed(2)}</div>
            <div class="barcode-text">${service.barcode}</div>
          </div>
        `;
      }
    }

    // Códigos de barberos
    if (service.barberBarcodes && service.barberBarcodes.length > 0) {
      service.barberBarcodes.forEach((barberCode) => {
        const barcodeDataURL = generateHighQualityBarcodeDataURL(barberCode.barcode);
        if (barcodeDataURL) {
          html += `
            <div class="barcode-container">
              <div class="service-name">${service.name}</div>
              <div class="barber-name">Barbero: ${getBarberName(barberCode.barberId)}</div>
              <img src="${barcodeDataURL}" alt="${barberCode.barcode}" class="barcode-image" />
              <div class="price">$${service.price.toFixed(2)}</div>
              <div class="barcode-text">${barberCode.barcode}</div>
            </div>
          `;
        }
      });
    }

    html += `
      </body>
      </html>
    `;

    return html;
  };

  const handleDownload = () => {
    if (!service) {
      toast({
        title: "No hay servicio para descargar",
        description: "Selecciona un servicio válido",
        variant: "destructive",
      });
      return;
    }

    const htmlContent = generatePrintableHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `codigos-HD-${service.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Códigos HD descargados",
      description: `Códigos de ${service.name} descargados en alta definición`,
    });
  };

  if (!isOpen || !service) return null;

  const totalCodes = (service.barcode ? 1 : 0) + (service.barberBarcodes?.length || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Descargar Códigos HD - {service.name}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalCodes}</div>
            <div className="text-sm text-muted-foreground">
              códigos en alta definición
            </div>
          </div>

          <div className="space-y-2">
            {service.barcode && (
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                <span className="text-sm">Código General HD</span>
                <span className="text-xs text-green-600">✓ Nítido</span>
              </div>
            )}
            
            {service.barberBarcodes && service.barberBarcodes.length > 0 && (
              <div className="space-y-1">
                {service.barberBarcodes.map((barberCode, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                    <span className="text-sm">{getBarberName(barberCode.barberId)} HD</span>
                    <span className="text-xs text-green-600">✓ Nítido</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={handleDownload}
              className="flex items-center gap-2"
              size="lg"
              disabled={totalCodes === 0}
            >
              <Download className="h-4 w-4" />
              Descargar HD para 80mm
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground bg-blue-50 p-2 rounded">
            📌 Códigos optimizados para máxima nitidez en impresoras térmicas de 80mm
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadSingleBarcodeModal;
