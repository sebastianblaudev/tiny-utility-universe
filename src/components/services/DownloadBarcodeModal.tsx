import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useBarber } from '@/contexts/BarberContext';
import { Download, X } from 'lucide-react';
import { Service, BarcodeMapping } from '@/types';
import { useToast } from '@/hooks/use-toast';
import JsBarcode from 'jsbarcode';

interface DownloadBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
}

interface BarcodeItem {
  serviceName: string;
  serviceId: string;
  servicePrice: number;
  barberName: string;
  barberId: string;
  barcode: string;
  isGeneral?: boolean;
}

const DownloadBarcodeModal = ({ isOpen, onClose, services }: DownloadBarcodeModalProps) => {
  const { barbers } = useBarber();
  const { toast } = useToast();
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');

  const generateBarcodeList = (): BarcodeItem[] => {
    const barcodeItems: BarcodeItem[] = [];

    services.forEach((service) => {
      if (selectedBarberId === 'all') {
        // Código general
        if (service.barcode) {
          barcodeItems.push({
            serviceName: service.name,
            serviceId: service.id,
            servicePrice: service.price,
            barberName: 'Código General',
            barberId: 'general',
            barcode: service.barcode,
            isGeneral: true
          });
        }

        // Códigos de barberos
        if (service.barberBarcodes && service.barberBarcodes.length > 0) {
          service.barberBarcodes.forEach((barberCode: BarcodeMapping) => {
            const barber = barbers.find(b => b.id === barberCode.barberId);
            if (barber && barberCode.barcode) {
              barcodeItems.push({
                serviceName: service.name,
                serviceId: service.id,
                servicePrice: service.price,
                barberName: barber.name,
                barberId: barber.id,
                barcode: barberCode.barcode,
                isGeneral: false
              });
            }
          });
        }
      } else {
        // Solo códigos del barbero seleccionado
        if (service.barberBarcodes && service.barberBarcodes.length > 0) {
          const barberCode = service.barberBarcodes.find(bc => bc.barberId === selectedBarberId);
          if (barberCode && barberCode.barcode) {
            const barber = barbers.find(b => b.id === selectedBarberId);
            if (barber) {
              barcodeItems.push({
                serviceName: service.name,
                serviceId: service.id,
                servicePrice: service.price,
                barberName: barber.name,
                barberId: barber.id,
                barcode: barberCode.barcode,
                isGeneral: false
              });
            }
          }
        }
      }
    });

    return barcodeItems;
  };

  const barcodeList = generateBarcodeList();

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

  const generatePrintableHTML = (items: BarcodeItem[]): string => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Códigos de Barras HD - Impresora 80mm</title>
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

    items.forEach((item) => {
      const barcodeDataURL = generateHighQualityBarcodeDataURL(item.barcode);
      
      if (barcodeDataURL) {
        html += `
          <div class="barcode-container">
            <div class="service-name">${item.serviceName}</div>
            <div class="barber-name">${item.isGeneral ? 'Código General' : `Barbero: ${item.barberName}`}</div>
            <img src="${barcodeDataURL}" alt="${item.barcode}" class="barcode-image" />
            <div class="price">$${item.servicePrice.toFixed(2)}</div>
            <div class="barcode-text">${item.barcode}</div>
          </div>
        `;
      }
    });

    html += `
      </body>
      </html>
    `;

    return html;
  };

  const handleDownload = () => {
    if (barcodeList.length === 0) {
      toast({
        title: "No hay códigos para descargar",
        description: "Selecciona servicios con códigos válidos",
        variant: "destructive",
      });
      return;
    }

    const htmlContent = generatePrintableHTML(barcodeList);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `codigos-HD-${selectedBarberId === 'all' ? 'todos' : 'barbero'}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Códigos HD descargados",
      description: `Se descargaron ${barcodeList.length} códigos en alta definición`,
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Descargar Códigos HD (80mm)
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Filtro de barbero */}
          <div className="space-y-2">
            <Label htmlFor="barber-select">Filtrar por Barbero</Label>
            <Select 
              value={selectedBarberId} 
              onValueChange={setSelectedBarberId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar barbero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los barberos</SelectItem>
                {barbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {barcodeList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay códigos de barras disponibles para descargar</p>
              <p className="text-sm text-muted-foreground mt-2">
                Asegúrate de que los servicios tengan códigos de barras generados
              </p>
            </div>
          ) : (
            <>
              {/* Vista previa */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold mb-3">Vista Previa HD ({barcodeList.length} códigos)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                  {barcodeList.slice(0, 4).map((item, index) => (
                    <div key={index} className="border rounded p-3 bg-background">
                      <div className="text-sm font-medium">{item.serviceName}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.isGeneral ? 'Código General HD' : `${item.barberName} HD`}
                      </div>
                      <div className="text-xs font-mono mt-1">{item.barcode}</div>
                      <div className="text-sm font-semibold">${item.servicePrice.toFixed(2)}</div>
                      <div className="text-xs text-green-600">✓ Optimizado para nitidez</div>
                    </div>
                  ))}
                </div>
                {barcodeList.length > 4 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ... y {barcodeList.length - 4} códigos más en HD
                  </p>
                )}
              </div>

              {/* Botón de descarga */}
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Download className="h-4 w-4" />
                  Descargar Códigos HD para 80mm
                </Button>
              </div>
              
              <div className="text-xs text-center text-muted-foreground bg-blue-50 p-3 rounded">
                📌 Los códigos están optimizados para máxima nitidez en impresoras térmicas de 80mm
                <br />
                🖨️ Usa configuración de alta calidad en tu impresora para mejores resultados
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadBarcodeModal;
