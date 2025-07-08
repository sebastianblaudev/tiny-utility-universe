import React from 'react';
import { Barcode, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateRandomBarcode } from '@/utils/barcodeUtils';

interface BarcodeButtonProps {
  currentBarcode?: string | null | undefined;
  onGenerate?: (barcode: string) => void;
  disabled?: boolean;
  compact?: boolean;
  onPrint?: () => void;
  productName?: string;
}

const BarcodeButton: React.FC<BarcodeButtonProps> = ({ 
  currentBarcode, 
  onGenerate, 
  disabled = false,
  compact = false,
  onPrint,
  productName = ''
}) => {
  const handleGenerateBarcode = (event: React.MouseEvent) => {
    // Prevent the event from bubbling up to parent components
    event.preventDefault();
    event.stopPropagation();
    
    // Generate a new barcode immediately without confirmation
    const newBarcode = generateRandomBarcode();
    if (onGenerate) {
      onGenerate(newBarcode);
    }
    toast.success("Código de barras generado exitosamente");
  };
  
  const handlePrintBarcode = (event: React.MouseEvent) => {
    // Prevent the event from bubbling up to parent components
    event.preventDefault();
    event.stopPropagation();
    
    if (onPrint) {
      onPrint();
    } else if (currentBarcode) {
      // If no print handler is provided but there's a barcode, use default printing behavior
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Imprimir Código de Barras</title>
              <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; margin: 20px; }
                .barcode-container { margin: 20px auto; }
                .product-name { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                ${productName ? `<div class="product-name">${productName}</div>` : ''}
                <svg id="barcode"></svg>
              </div>
              <script>
                JsBarcode("#barcode", "${currentBarcode}", {
                  format: "CODE128",
                  width: 2,
                  height: 100,
                  displayValue: true
                });
                setTimeout(() => { window.print(); window.close(); }, 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        toast.error("No se pudo abrir la ventana de impresión");
      }
    } else {
      toast.warning("No hay código de barras para imprimir");
    }
  };

  return (
    <div className="flex space-x-1">
      <Button
        type="button"
        variant={compact ? "inlineBarcode" : "barcode"}
        size={compact ? "sm" : "default"}
        onClick={handleGenerateBarcode}
        disabled={disabled}
        title="Generar código de barras"
        aria-label="Generar código de barras"
        className={`${compact ? "px-2 h-8" : ""} backdrop-blur-sm transition-all duration-200`}
      >
        <Barcode size={compact ? 14 : 16} />
        {!compact && <span className="ml-1">Crear</span>}
      </Button>
      
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={handlePrintBarcode}
        disabled={disabled || !currentBarcode}
        title="Imprimir código de barras"
        aria-label="Imprimir código de barras"
        className={`${compact ? "px-2 h-8" : ""} transition-all duration-200`}
      >
        <Printer size={compact ? 14 : 16} />
      </Button>
    </div>
  );
};

export default BarcodeButton;
