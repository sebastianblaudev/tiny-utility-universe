
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getBusinessInfoForReceipt, clearBusinessInfoCache } from '@/utils/ticketUtils';
import { supabase } from '@/integrations/supabase/client';
import { Save, Building, Receipt, Upload, X, Image } from 'lucide-react';
import { saveBusinessLogo, getBusinessLogo, deleteBusinessLogo, BusinessLogo } from '@/utils/logoStorageUtils';

const Configuracion = () => {
  const { tenantId } = useAuth();
  const [receiptConfig, setReceiptConfig] = useState({
    businessName: '',
    address: '',
    phone: '',
    receiptFooter: 'Gracias por su compra'
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<BusinessLogo | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    const loadConfigs = async () => {
      if (!tenantId) return;
      
      setLoadingConfig(true);
      try {
        // Load receipt config
        const businessInfo = await getBusinessInfoForReceipt();
        setReceiptConfig({
          businessName: businessInfo.businessName || '',
          address: businessInfo.address || '',
          phone: businessInfo.phone || '',
          receiptFooter: businessInfo.receiptFooter || 'Gracias por su compra'
        });

        // Load business logo
        const logo = await getBusinessLogo(tenantId);
        setCurrentLogo(logo);
      } catch (error) {
        console.error("Error loading configs:", error);
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfigs();
  }, [tenantId]);

  const handleSaveReceiptConfig = async () => {
    if (!tenantId) {
      toast.error("No se pudo identificar el negocio");
      return;
    }

    setSavingReceipt(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      // Update user metadata with receipt configuration
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          businessName: receiptConfig.businessName,
          address: receiptConfig.address,
          phone: receiptConfig.phone,
          receiptFooter: receiptConfig.receiptFooter
        }
      });

      if (error) {
        console.error("Error updating user metadata:", error);
        toast.error("Error al guardar la configuración del recibo");
        return;
      }

      // Clear cache to force refresh
      clearBusinessInfoCache();
      
      toast.success("Configuración del recibo guardada correctamente");
    } catch (error) {
      console.error("Error saving receipt config:", error);
      toast.error("Error al guardar la configuración del recibo");
    } finally {
      setSavingReceipt(false);
    }
  };

  const handleReceiptInputChange = (field: string, value: string) => {
    setReceiptConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tenantId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona un archivo de imagen válido");
      return;
    }

    // Validate file size (max 5MB for original file)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo debe ser menor a 5MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const success = await saveBusinessLogo(tenantId, file);
      if (success) {
        const logo = await getBusinessLogo(tenantId);
        setCurrentLogo(logo);
        toast.success("Logo procesado y guardado correctamente (convertido a escala de grises y optimizado)");
      } else {
        toast.error("Error al procesar y guardar el logo");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Error al subir el logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!tenantId) return;

    setUploadingLogo(true);
    try {
      const success = await deleteBusinessLogo(tenantId);
      if (success) {
        setCurrentLogo(null);
        toast.success("Logo eliminado correctamente");
      } else {
        toast.error("Error al eliminar el logo");
      }
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast.error("Error al eliminar el logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loadingConfig) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <p>Cargando configuración...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 h-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Configura los ajustes de tu sistema
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <div className="grid gap-6">
            {/* Receipt Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Configuración de Recibos
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configura el encabezado y pie de página de tus recibos
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Nombre del Negocio
                    </Label>
                    <Input
                      id="businessName"
                      placeholder="Mi Negocio S.A."
                      value={receiptConfig.businessName}
                      onChange={(e) => handleReceiptInputChange('businessName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+56 9 1234 5678"
                      value={receiptConfig.phone}
                      onChange={(e) => handleReceiptInputChange('phone', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">
                      Dirección
                    </Label>
                    <Input
                      id="address"
                      placeholder="Av. Principal 123, Santiago, Chile"
                      value={receiptConfig.address}
                      onChange={(e) => handleReceiptInputChange('address', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="receiptFooter">
                      Pie de Página del Recibo
                    </Label>
                    <Textarea
                      id="receiptFooter"
                      placeholder="Gracias por su compra"
                      value={receiptConfig.receiptFooter}
                      onChange={(e) => handleReceiptInputChange('receiptFooter', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="businessLogo" className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Logo del Negocio
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Sube un logo para mostrarlo en los recibos. El logo será automáticamente convertido a escala de grises y optimizado para reducir su tamaño (máximo 5MB, formatos: JPG, PNG, SVG)
                    </p>
                    
                    {currentLogo && (
                      <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <img 
                          src={currentLogo.data} 
                          alt="Logo actual" 
                          className="h-16 w-16 object-contain border rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{currentLogo.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            Subido: {new Date(currentLogo.lastUpdated).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Procesado automáticamente (escala de grises y optimizado)
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleDeleteLogo}
                          disabled={uploadingLogo}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Input
                        id="businessLogo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('businessLogo')?.click()}
                        disabled={uploadingLogo}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingLogo ? 'Procesando...' : currentLogo ? 'Cambiar Logo' : 'Subir Logo'}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveReceiptConfig} 
                  disabled={savingReceipt}
                  className="w-full md:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingReceipt ? 'Guardando...' : 'Guardar Configuración de Recibos'}
                </Button>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>ID del Negocio:</strong> {tenantId || 'No disponible'}</p>
                  <p><strong>Versión:</strong> 1.0.0</p>
                  <p><strong>Última actualización:</strong> {new Date().toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
};

export default Configuracion;
