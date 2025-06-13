
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReceiptSettingsFormValues {
  shopName: string;
  footerText: string;
  paperSize: "58mm" | "80mm";
}

const ReceiptSettingsComponent = () => {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const form = useForm<ReceiptSettingsFormValues>({
    defaultValues: {
      shopName: '',
      footerText: '',
      paperSize: "80mm",
    }
  });
  
  // Cargar configuración guardada
  useEffect(() => {
    const savedShopName = localStorage.getItem('receipt-shop-name');
    const savedFooterText = localStorage.getItem('receipt-footer-text');
    const savedPaperSize = localStorage.getItem('receipt-paper-size') as "58mm" | "80mm" | null;
    const savedLogoUrl = localStorage.getItem('receipt-logo-url');
    
    form.reset({
      shopName: savedShopName || 'Su Barbería',
      footerText: savedFooterText || '¡Gracias por su visita!',
      paperSize: savedPaperSize || "80mm",
    });
    
    if (savedLogoUrl) {
      setLogoPreview(savedLogoUrl);
    }
  }, [form]);
  
  const onSubmit = (data: ReceiptSettingsFormValues) => {
    try {
      localStorage.setItem('receipt-shop-name', data.shopName);
      localStorage.setItem('receipt-footer-text', data.footerText);
      localStorage.setItem('receipt-paper-size', data.paperSize);
      
      // El logo se guarda en el manejador de archivos, no aquí
      
      toast({
        title: "Configuración guardada",
        description: "La configuración del recibo ha sido guardada correctamente."
      });
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive"
      });
    }
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.includes('image/')) {
      toast({
        title: "Formato no válido",
        description: "Por favor, sube una imagen (JPEG, PNG, GIF).",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es 2MB.",
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      localStorage.setItem('receipt-logo-url', result);
      
      toast({
        title: "Logo actualizado",
        description: "El logo se ha actualizado correctamente."
      });
    };
    reader.readAsDataURL(file);
  };
  
  const clearLogo = () => {
    setLogoPreview(null);
    localStorage.removeItem('receipt-logo-url');
    toast({
      title: "Logo eliminado",
      description: "El logo ha sido eliminado del recibo."
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Recibo</CardTitle>
        <CardDescription>
          Personaliza la apariencia de los recibos de venta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Logo de la Barbería</Label>
              <div className="flex flex-col space-y-2">
                {logoPreview ? (
                  <div className="border rounded-md p-2 w-full">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Logo actual:</span>
                      <Button type="button" variant="destructive" size="sm" onClick={clearLogo}>
                        Eliminar
                      </Button>
                    </div>
                    <div className="flex justify-center p-2 bg-gray-50 rounded">
                      <img 
                        src={logoPreview} 
                        alt="Logo de la barbería" 
                        className="max-h-24 object-contain" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-md p-8 w-full flex flex-col items-center justify-center">
                    <Image className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No hay logo configurado</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: JPEG, PNG, GIF. Tamaño máximo: 2MB.
                </p>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="shopName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Negocio</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ingresa el nombre de tu barbería" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="footerText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto del Pie de Página</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Texto que aparecerá al final del recibo" 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paperSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamaño del Papel</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tamaño del papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="58mm">58mm (Térmica pequeña)</SelectItem>
                      <SelectItem value="80mm">80mm (Térmica estándar)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">
              Guardar Configuración
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReceiptSettingsComponent;
