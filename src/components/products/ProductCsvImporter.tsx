
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { initDB } from '@/lib/db';
import { toast } from 'sonner';

export function ProductCsvImporter({ onImportComplete }: { onImportComplete: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate example CSV file content
  const generateExampleCsv = () => {
    const headers = "name,price,category,barcode\n";
    const exampleRows = [
      "Pizza Margarita,12000,cat_pizza,2001234567893",
      "Refresco Cola,3000,cat_bebidas,2007654321098",
      "Pan de Ajo,4500,cat_extras,2009876543210",
      "Pizza Hawaiana,13000,cat_pizza,2001472583691"
    ];
    
    return headers + exampleRows.join('\n');
  };
  
  // Handle download of example CSV
  const handleDownloadExample = () => {
    const csvContent = generateExampleCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'productos_ejemplo.csv');
    document.body.appendChild(link);
    
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Archivo de ejemplo descargado");
  };

  // Handle the CSV file upload and processing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const rows = text.split('\n');
      
      // Validate the CSV structure
      const headers = rows[0].toLowerCase().split(',');
      const requiredHeaders = ['name', 'price', 'category'];
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Faltan encabezados obligatorios: ${missingHeaders.join(', ')}`);
      }
      
      // Process each row
      const db = await initDB();
      let importedCount = 0;
      let errorCount = 0;
      
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue; // Skip empty rows
        
        const values = row.split(',');
        if (values.length < 3) {
          console.error(`Fila ${i + 1} mal formateada: ${row}`);
          errorCount++;
          continue;
        }
        
        // Map CSV data to product object
        const nameIndex = headers.indexOf('name');
        const priceIndex = headers.indexOf('price');
        const categoryIndex = headers.indexOf('category');
        const barcodeIndex = headers.indexOf('barcode');
        
        try {
          const id = `p${Date.now()}-${i}`;
          const price = parseFloat(values[priceIndex]);
          
          let sizes;
          if (values[categoryIndex].includes('pizza')) {
            sizes = {
              personal: price,
              mediana: price * 1.5,
              familiar: price * 2
            };
          }
          
          await db.add('products', {
            id,
            name: values[nameIndex],
            price: isNaN(price) ? 0 : price,
            category: values[categoryIndex],
            barcode: barcodeIndex >= 0 ? values[barcodeIndex] : null,
            sizes
          });
          
          importedCount++;
        } catch (error) {
          console.error(`Error al importar fila ${i + 1}:`, error);
          errorCount++;
        }
      }
      
      if (importedCount > 0) {
        toast.success(`Importación completada`, {
          description: `${importedCount} productos importados, ${errorCount} errores.`
        });
        onImportComplete();
      } else if (errorCount > 0) {
        toast.error(`No se importaron productos`, {
          description: `Se encontraron ${errorCount} errores.`
        });
      } else {
        toast.warning("No se encontraron productos para importar");
      }
      
      // Reset the file input
      e.target.value = '';
      
    } catch (error) {
      console.error("Error al procesar el archivo CSV:", error);
      setError(error instanceof Error ? error.message : 'Error desconocido al procesar el archivo');
      toast.error("Error al procesar el archivo CSV", {
        description: error instanceof Error ? error.message : undefined
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-wide text-white">
          Importar Productos por CSV
        </CardTitle>
        <CardDescription className="text-gray-400">
          Importa varios productos a la vez con un archivo CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap md:flex-nowrap gap-4">
          <Button 
            onClick={handleDownloadExample}
            className="bg-purple-800 hover:bg-purple-700 text-white flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar CSV de Ejemplo
          </Button>
          
          <div className="relative flex-1">
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button 
              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white w-full"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Archivo CSV
                </>
              )}
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-md p-3 flex items-start text-sm text-red-200">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-neutral-800 border border-neutral-700 rounded-md p-4 text-sm text-gray-300">
          <h4 className="font-semibold mb-2 text-white flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2 text-purple-400" />
            Formato requerido:
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>El archivo debe ser CSV (valores separados por comas)</li>
            <li>La primera fila debe contener los encabezados: name, price, category</li>
            <li>Encabezados opcionales: barcode</li>
            <li>El separador debe ser una coma (,)</li>
            <li>Para productos de categoría pizza, se crearán tamaños automáticamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
