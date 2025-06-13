
import React from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  options?: {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    text?: string;
    fontSize?: number;
    margin?: number;
    background?: string;
    lineColor?: string;
  };
}

export const Barcode: React.FC<BarcodeProps> = ({ value, options = {} }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (canvasRef.current && value) {
      try {
        setError(null);
        
        const barcodeOptions = {
          format: options.format || 'CODE128',
          width: options.width || 2,
          height: options.height || 80,
          displayValue: options.displayValue !== undefined ? options.displayValue : true,
          text: options.text || value,
          fontSize: options.fontSize || 14,
          margin: options.margin || 10,
          background: options.background || '#ffffff',
          lineColor: options.lineColor || '#000000',
          textColor: '#000000',
          fontOptions: 'bold',
          textAlign: 'center',
          textPosition: 'bottom',
          valid: function(valid: boolean) {
            if (!valid) {
              console.error("Código de barras inválido:", value);
              setError("Código inválido");
            }
          }
        };
        
        console.log(`Generando código de barras: ${value}`);
        JsBarcode(canvasRef.current, value, barcodeOptions);
        
      } catch (error) {
        console.error("Error generating barcode:", error);
        setError(`Error al generar código: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  }, [value, options]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 border border-red-300 rounded bg-red-50">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!value) {
    return (
      <div className="flex items-center justify-center p-4 border border-gray-300 rounded bg-gray-50">
        <p className="text-gray-600 text-sm">No hay código para mostrar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <canvas 
        ref={canvasRef} 
        className="border border-gray-200 rounded bg-white"
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          imageRendering: 'crisp-edges'
        }}
      />
    </div>
  );
};
