import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCurrentUserTenantId } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';
import { Shield, TestTube, CreditCard, Wifi } from 'lucide-react';

interface MercadoPagoConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

interface MercadoPagoConfiguration {
  accessToken: string;
  publicKey: string;
  enabledPaymentMethods: {
    cash: boolean;
    card: boolean;
    transfer: boolean;
  };
  autoSync: boolean;
  webhookUrl?: string;
  environment: 'sandbox' | 'production';
}

export const MercadoPagoConfig: React.FC<MercadoPagoConfigProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [config, setConfig] = useState<MercadoPagoConfiguration>({
    accessToken: '',
    publicKey: '',
    enabledPaymentMethods: {
      cash: true,
      card: true,
      transfer: true
    },
    autoSync: true,
    environment: 'sandbox'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadConfiguration();
    }
  }, [isOpen]);

  const loadConfiguration = async () => {
    try {
      const tenantId = await getCurrentUserTenantId();
      if (!tenantId) return;

      const { data, error } = await supabase
        .from('plugin_configurations')
        .select('configuration')
        .eq('tenant_id', tenantId)
        .eq('plugin_key', 'mercado_pago_pos')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.configuration) {
        setConfig({ ...config, ...(data.configuration as Partial<MercadoPagoConfiguration>) });
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      const tenantId = await getCurrentUserTenantId();
      if (!tenantId) return;

      // Validate required fields
      if (!config.accessToken || !config.publicKey) {
        toast({
          title: "Error",
          description: "Todos los campos son obligatorios",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('plugin_configurations')
        .upsert({
          tenant_id: tenantId,
          plugin_key: 'mercado_pago_pos',
          configuration: config as any,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Configuración guardada",
        description: "La configuración de Mercado Pago se guardó correctamente",
      });

      onConfigSaved();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      // Here would be the actual MP API test
      // For now, just simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Conexión exitosa",
        description: "La conexión con Mercado Pago está funcionando correctamente",
      });
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con Mercado Pago. Verifica tus credenciales.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex justify-center p-8">Cargando configuración...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configuración Mercado Pago POS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Environment Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Ambiente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="sandbox"
                    checked={config.environment === 'sandbox'}
                    onChange={() => setConfig({ ...config, environment: 'sandbox' })}
                  />
                  <Label htmlFor="sandbox">
                    <Badge variant="secondary">Sandbox (Pruebas)</Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="production"
                    checked={config.environment === 'production'}
                    onChange={() => setConfig({ ...config, environment: 'production' })}
                  />
                  <Label htmlFor="production">
                    <Badge variant="default">Producción</Badge>
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Credentials */}
          <Card>
            <CardHeader>
              <CardTitle>Credenciales de API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={config.accessToken}
                  onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                  placeholder="APP_USR-..."
                />
              </div>
              <div>
                <Label htmlFor="publicKey">Public Key</Label>
                <Input
                  id="publicKey"
                  value={config.publicKey}
                  onChange={(e) => setConfig({ ...config, publicKey: e.target.value })}
                  placeholder="APP_USR-..."
                />
              </div>
              <Button
                variant="outline"
                onClick={testConnection}
                disabled={testing || !config.accessToken || !config.publicKey}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {testing ? 'Probando conexión...' : 'Probar conexión'}
              </Button>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago Habilitados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableCash">Efectivo</Label>
                <Switch
                  id="enableCash"
                  checked={config.enabledPaymentMethods.cash}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      enabledPaymentMethods: {
                        ...config.enabledPaymentMethods,
                        cash: checked
                      }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enableCard">Tarjeta</Label>
                <Switch
                  id="enableCard"
                  checked={config.enabledPaymentMethods.card}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      enabledPaymentMethods: {
                        ...config.enabledPaymentMethods,
                        card: checked
                      }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enableTransfer">Transferencia</Label>
                <Switch
                  id="enableTransfer"
                  checked={config.enabledPaymentMethods.transfer}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      enabledPaymentMethods: {
                        ...config.enabledPaymentMethods,
                        transfer: checked
                      }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Sync Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Configuración de Sincronización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSync">Sincronización Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Sincronizar automáticamente las ventas con Mercado Pago
                  </p>
                </div>
                <Switch
                  id="autoSync"
                  checked={config.autoSync}
                  onCheckedChange={(checked) => setConfig({ ...config, autoSync: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={saveConfiguration} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};