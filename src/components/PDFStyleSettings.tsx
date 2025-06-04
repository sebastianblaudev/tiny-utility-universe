
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PDFThemeConfig, loadThemeConfig, saveThemeConfig } from "@/lib/modern-pdf-service";
import { FileText, Palette, Check } from "lucide-react";

const colorSchemes = [
  { id: 'blue', name: 'Azul', color: 'bg-blue-600' },
  { id: 'green', name: 'Verde', color: 'bg-green-600' },
  { id: 'purple', name: 'Púrpura', color: 'bg-purple-600' },
  { id: 'orange', name: 'Naranja', color: 'bg-orange-600' },
  { id: 'gray', name: 'Gris', color: 'bg-gray-600' },
];

const fontFamilies = [
  { id: 'helvetica', name: 'Helvetica (Sans-serif)' },
  { id: 'courier', name: 'Courier (Monospace)' },
  { id: 'times', name: 'Times (Serif)' },
];

const PDFStyleSettings = () => {
  const [config, setConfig] = useState<PDFThemeConfig>(loadThemeConfig());
  const [activeTab, setActiveTab] = useState<string>('colors');
  
  const handleSave = () => {
    saveThemeConfig(config);
    toast.success("Configuración de PDF guardada correctamente");
  };
  
  const resetToDefaults = () => {
    const defaultConfig: PDFThemeConfig = {
      colorScheme: 'blue',
      showLogo: true,
      showClientCard: true,
      showNotes: true,
      fontFamily: 'helvetica',
    };
    
    setConfig(defaultConfig);
    saveThemeConfig(defaultConfig);
    toast.success("Configuración restablecida a valores predeterminados");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Personalización de PDF
        </CardTitle>
        <CardDescription>
          Personaliza el aspecto de tus cotizaciones en PDF
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span>Colores y Estilo</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Contenido</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="colors" className="pt-4">
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block font-medium">Esquema de colores</Label>
                <RadioGroup 
                  value={config.colorScheme} 
                  onValueChange={(value: PDFThemeConfig['colorScheme']) => 
                    setConfig({...config, colorScheme: value})
                  }
                  className="grid grid-cols-2 sm:grid-cols-5 gap-2"
                >
                  {colorSchemes.map((scheme) => (
                    <div key={scheme.id} className="relative">
                      <RadioGroupItem 
                        value={scheme.id} 
                        id={`color-${scheme.id}`}
                        className="peer sr-only"
                      />
                      <Label 
                        htmlFor={`color-${scheme.id}`}
                        className={`flex flex-col items-center justify-center rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-24`}
                      >
                        <div className={`w-10 h-10 rounded-full ${scheme.color} mb-2`}></div>
                        <span className="text-sm">{scheme.name}</span>
                        {config.colorScheme === scheme.id && (
                          <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div>
                <Label className="mb-3 block font-medium">Tipografía</Label>
                <RadioGroup 
                  value={config.fontFamily} 
                  onValueChange={(value: PDFThemeConfig['fontFamily']) => 
                    setConfig({...config, fontFamily: value})
                  }
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  {fontFamilies.map((font) => (
                    <div key={font.id} className="relative">
                      <RadioGroupItem 
                        value={font.id} 
                        id={`font-${font.id}`}
                        className="peer sr-only"
                      />
                      <Label 
                        htmlFor={`font-${font.id}`}
                        className={`flex flex-col items-center justify-center rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer`}
                      >
                        <span className="text-base">{font.name}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showLogo" 
                  checked={config.showLogo} 
                  onCheckedChange={(checked) => 
                    setConfig({...config, showLogo: checked === true})
                  } 
                />
                <Label htmlFor="showLogo">Mostrar logo de la empresa (si está disponible)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showClientCard" 
                  checked={config.showClientCard} 
                  onCheckedChange={(checked) => 
                    setConfig({...config, showClientCard: checked === true})
                  } 
                />
                <Label htmlFor="showClientCard">Mostrar tarjeta de información del cliente</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showNotes" 
                  checked={config.showNotes} 
                  onCheckedChange={(checked) => 
                    setConfig({...config, showNotes: checked === true})
                  } 
                />
                <Label htmlFor="showNotes">Incluir notas en el PDF (si existen)</Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={resetToDefaults}>
            Restablecer valores
          </Button>
          <Button onClick={handleSave}>
            Guardar configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFStyleSettings;
