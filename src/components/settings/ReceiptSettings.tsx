import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { ImagePlus, ImageOff } from "lucide-react";

type ReceiptSettings = {
  logoUrl: string | null;
  header: string;
  footer: string;
  printerSize: string;
  receiptPrinter: string;
  kitchenPrinter: string;
};

const defaultSettings: ReceiptSettings = {
  logoUrl: null,
  header: "Pizza Point\nCalle Ejemplo 123\nTel: (123) 456-7890",
  footer: "¡Gracias por su compra!\nConserve este ticket como comprobante",
  printerSize: "58mm",
  receiptPrinter: "",
  kitchenPrinter: "",
};

export const ReceiptSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const { toast } = useToast();
  const form = useForm<ReceiptSettings>({
    defaultValues: defaultSettings
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem("receiptSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        form.reset(settings);
        setPreviewLogo(settings.logoUrl);
      } catch (error) {
        console.error("Error loading receipt settings:", error);
      }
    }
  }, [form]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit
        toast({
          variant: "destructive",
          title: "Error",
          description: "La imagen es demasiado grande. El tamaño máximo es 500KB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue('logoUrl', base64String);
        setPreviewLogo(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    form.setValue('logoUrl', null);
    setPreviewLogo(null);
  };

  const onSubmit = async (data: ReceiptSettings) => {
    setIsLoading(true);
    try {
      localStorage.setItem("receiptSettings", JSON.stringify(data));
      toast({
        title: "Configuración guardada",
        description: "La configuración del recibo se ha actualizado correctamente",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Configuración del Recibo</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="header"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Encabezado del Recibo</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ingrese el encabezado del recibo..."
                    className="min-h-[100px] text-black placeholder:text-gray-500"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="footer"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Pie del Recibo</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ingrese el pie del recibo..."
                    className="min-h-[100px] text-black placeholder:text-gray-500"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel className="text-white">Logo del Recibo</FormLabel>
            <div className="flex flex-col gap-4">
              {previewLogo ? (
                <div className="flex flex-col gap-2">
                  <img 
                    src={previewLogo} 
                    alt="Logo preview" 
                    className="max-w-[200px] h-auto border rounded p-2"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={removeLogo}
                    className="w-fit"
                  >
                    <ImageOff className="h-4 w-4 mr-2" />
                    Eliminar Logo
                  </Button>
                </div>
              ) : (
                <div>
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 border rounded p-4 hover:bg-gray-50 transition-colors">
                      <ImagePlus className="h-6 w-6" />
                      <span>Subir Logo</span>
                    </div>
                    <input
                      id="logo-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <FormField
            control={form.control}
            name="printerSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Tamaño de Impresora</FormLabel>
                <FormControl>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-white"
                    {...field}
                  >
                    <option value="58mm">58mm</option>
                    <option value="80mm">80mm</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar configuración"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
