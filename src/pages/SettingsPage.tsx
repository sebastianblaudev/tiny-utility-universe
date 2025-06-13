
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useBarber } from "@/contexts/BarberContext";
import { Settings, Save, Database, Receipt } from "lucide-react";
import DataBackupComponent from "@/components/settings/DataBackupComponent";
import SimpleSupabaseBackupComponent from "@/components/settings/SimpleSupabaseBackupComponent";
import ReceiptSettingsComponent from "@/components/settings/ReceiptSettingsComponent";

const SettingsPage = () => {
  const { toast } = useToast();
  const { appSettings, updateAppSettings } = useBarber();
  
  const [settings, setSettings] = useState({
    branchName: appSettings.branchName || '',
    address: appSettings.address || '',
    phone: appSettings.phone || ''
  });

  // Actualizar estado local cuando cambien las configuraciones
  React.useEffect(() => {
    console.log('App settings updated:', appSettings);
    setSettings({
      branchName: appSettings.branchName || '',
      address: appSettings.address || '',
      phone: appSettings.phone || ''
    });
  }, [appSettings]);

  const handleSaveSettings = async () => {
    console.log('Attempting to save settings:', settings);
    
    try {
      // Validar que los campos no estén vacíos
      if (!settings.branchName.trim()) {
        toast({
          title: "Error",
          description: "El nombre de la sucursal es requerido",
          variant: "destructive"
        });
        return;
      }

      // Usar la función updateAppSettings del contexto
      await updateAppSettings(settings);
      
      console.log('Settings saved successfully');
      
      toast({
        title: "Configuración guardada",
        description: "La configuración se ha actualizado correctamente",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: keyof typeof settings, value: string) => {
    console.log(`Updating ${field} to:`, value);
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Administra la configuración de tu barbería</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="receipts">Recibos</TabsTrigger>
          <TabsTrigger value="backup">Datos</TabsTrigger>
          <TabsTrigger value="export">Exportar/Importar</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Barbería</CardTitle>
              <CardDescription>
                Configura la información básica de tu barbería
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branchName">Nombre de la Sucursal</Label>
                  <Input
                    id="branchName"
                    value={settings.branchName}
                    onChange={(e) => handleInputChange('branchName', e.target.value)}
                    placeholder="Ej: Barbería Central"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Ej: +1 234 567 8900"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Ej: Calle Principal 123, Ciudad"
                />
              </div>
              <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                <Save size={16} />
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6">
          <ReceiptSettingsComponent />
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <SimpleSupabaseBackupComponent />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <DataBackupComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
