import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseCSV, validateProductsData, generateProductCSVTemplate } from '@/utils/csvUtils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { FileUp, FileDown, AlertCircle, Check, Info } from 'lucide-react';
import { Skeleton, LoadingIndicator } from '@/components/ui/skeleton';

interface ProductCSVImportProps {
  onImportComplete: () => void;
  userId: string;
}

const ProductCSVImport: React.FC<ProductCSVImportProps> = ({ onImportComplete, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ row: number, message: string }[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Actualizados los campos para el CSV, incluyendo image_url
  const productFields = ['name', 'category', 'price', 'cost_price', 'stock', 'code', 'is_weight_based', 'image_url'];

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo CSV válido",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsLoading(true);
    
    try {
      const data = await parseCSV(selectedFile, productFields);
      
      // Show preview of first 5 rows
      setPreviewData(data.slice(0, 5));
      
      // Validate all data
      const { errors } = validateProductsData(data);
      setValidationErrors(errors);
      
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo CSV. Verifique el formato.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateProductCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_productos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Éxito",
      description: "Plantilla de CSV descargada correctamente",
    });
  };

  const importProducts = async () => {
    if (!file || !userId) return;
    
    setIsProcessing(true);
    setProgress(0);
    setSuccessCount(0);
    setErrorCount(0);
    
    try {
      // Get current user's tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user?.user_metadata?.tenant_id || localStorage.getItem('current_tenant_id');
      
      if (!tenantId) {
        toast({
          title: "Error",
          description: "No se pudo obtener la información del tenant. Por favor, inicie sesión nuevamente.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      const data = await parseCSV(file, productFields);
      console.log('Parsed CSV data:', data);
      
      const { validProducts, errors } = validateProductsData(data);
      console.log('Validation result:', { validProducts, errors });
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        setIsProcessing(false);
        toast({
          title: "Advertencia",
          description: `Se encontraron ${errors.length} errores en el archivo CSV. Corrija los errores antes de importar.`,
          variant: "destructive",
        });
        return;
      }
      
      // Check for existing product codes in database
      const productCodes = validProducts.map(p => p.code).filter(Boolean);
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('code')
        .eq('tenant_id', tenantId)
        .in('code', productCodes);
        
      if (checkError) {
        console.error('Error checking existing codes:', checkError);
        toast({
          title: "Error",
          description: "Error al verificar códigos existentes en la base de datos.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      const existingCodes = new Set(existingProducts?.map(p => p.code) || []);
      console.log('Existing codes in database:', existingCodes);
      
      // Generate new codes for products with existing codes
      const processedProducts = validProducts.map(product => {
        if (existingCodes.has(product.code)) {
          // Generate new unique code
          const namePrefix = product.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
          const timestamp = Date.now().toString().slice(-4);
          const newCode = `${namePrefix}${timestamp}`;
          console.log(`Code ${product.code} already exists, generating new code: ${newCode}`);
          return { ...product, code: newCode };
        }
        return product;
      });
      
      // Process products in batches
      const batchSize = 5;
      const totalProducts = processedProducts.length;
      let processedCount = 0;
      let localSuccessCount = 0;
      let localErrorCount = 0;
      
      for (let i = 0; i < totalProducts; i += batchSize) {
        const batch = processedProducts.slice(i, i + batchSize);
        
        // Add user_id and tenant_id to each product
        const productsWithMetadata = batch.map(product => ({
          ...product,
          user_id: userId,
          tenant_id: tenantId,
        }));
        
        console.log('Inserting batch:', productsWithMetadata);
        
        const { data: insertedData, error } = await supabase
          .from('products')
          .insert(productsWithMetadata)
          .select();
        
        if (error) {
          console.error('Error inserting products batch:', error);
          localErrorCount += batch.length;
        } else {
          console.log('Successfully inserted batch:', insertedData);
          localSuccessCount += batch.length;
        }
        
        processedCount += batch.length;
        setSuccessCount(localSuccessCount);
        setErrorCount(localErrorCount);
        setProgress(Math.round((processedCount / totalProducts) * 100));
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (errorCount === 0) {
        toast({
          title: "Éxito",
          description: `Se importaron ${successCount} productos correctamente`,
        });
        setIsOpen(false);
        onImportComplete();
      } else {
        toast({
          title: "Importación completada con errores",
          description: `Se importaron ${successCount} productos, con ${errorCount} errores`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error importing products:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error durante la importación de productos",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setProgress(0);
    setSuccessCount(0);
    setErrorCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileUp size={16} />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Importar productos desde CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Importe múltiples productos utilizando un archivo CSV. Descargue la plantilla para asegurarse de que el formato sea correcto.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleDownloadTemplate}
            >
              <FileDown size={16} />
              Plantilla
            </Button>
          </div>

          {!isProcessing ? (
            <div className="border-2 border-dashed rounded-md p-6 text-center">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange} 
                ref={fileInputRef}
              />
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium">
                    <FileUp size={18} className="text-primary" />
                    <span>{file.name}</span>
                    <span className="text-muted-foreground">({Math.round(file.size / 1024)} KB)</span>
                  </div>

                  {isLoading ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <LoadingIndicator />
                        <p className="text-sm text-muted-foreground">Analizando archivo...</p>
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                      </div>
                    </div>
                  ) : (
                    <>
                      {previewData.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Vista previa:</h4>
                          <div className="max-h-40 overflow-y-auto bg-muted/50 rounded-md text-left">
                            <table className="w-full text-xs">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="p-2 text-left">Nombre</th>
                                  <th className="p-2 text-left">Categoría</th>
                                  <th className="p-2 text-left">Precio</th>
                                  <th className="p-2 text-left">Stock</th>
                                  <th className="p-2 text-left">Código</th>
                                </tr>
                              </thead>
                              <tbody>
                                {previewData.map((row, idx) => (
                                  <tr key={idx} className="border-t border-border/40">
                                    <td className="p-2">{row.name}</td>
                                    <td className="p-2">{row.category || "-"}</td>
                                    <td className="p-2">{row.price}</td>
                                    <td className="p-2">{row.stock || "0"}</td>
                                    <td className="p-2">{row.code || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {validationErrors.length > 0 && (
                        <Alert variant="destructive" className="text-left">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="text-sm font-medium mb-1">Se encontraron {validationErrors.length} errores:</div>
                            <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                              {validationErrors.slice(0, 5).map((error, idx) => (
                                <div key={idx}>{error.message}</div>
                              ))}
                              {validationErrors.length > 5 && (
                                <div>Y {validationErrors.length - 5} más...</div>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={resetImport}
                          size="sm"
                        >
                          Cambiar archivo
                        </Button>
                        <Button 
                          onClick={importProducts}
                          disabled={isLoading || validationErrors.length > 0}
                          size="sm"
                        >
                          Importar {previewData.length > 0 ? `(${previewData.length})` : ''}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div 
                  className="cursor-pointer" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp size={36} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Haga clic para seleccionar un archivo CSV</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    o arrastre y suelte aquí
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso de importación</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <LoadingIndicator />
                <span className="text-sm">Procesando productos...</span>
              </div>
              
              {(successCount > 0 || errorCount > 0) && (
                <div className="space-y-1">
                  {successCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                      <Check size={14} />
                      <span>{successCount} productos importados correctamente</span>
                    </div>
                  )}
                  {errorCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle size={14} />
                      <span>{errorCount} productos con error</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <Alert variant="default" className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs text-muted-foreground">
              <p><strong>Formato esperado:</strong> Nombre, Categoría, Precio, Precio de Costo, Stock, Código, URL de Imagen</p>
              <p><strong>Campos obligatorios:</strong> Nombre, Precio</p>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCSVImport;
