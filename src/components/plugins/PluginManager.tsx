import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { getCurrentUserTenantId } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';
import { Settings, CreditCard, Zap } from 'lucide-react';
import { MercadoPagoConfig } from './MercadoPagoConfig';

interface Plugin {
  id: string;
  plugin_key: string;
  name: string;
  description: string;
  version: string;
  price_monthly: number;
  features: any;
  is_active: boolean;
}

interface PluginConfiguration {
  plugin_key: string;
  is_active: boolean;
  configuration: any;
}

export const PluginManager: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [configurations, setConfigurations] = useState<Record<string, PluginConfiguration>>({});
  const [loading, setLoading] = useState(true);
  const [showMercadoPagoConfig, setShowMercadoPagoConfig] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      const tenantId = await getCurrentUserTenantId();
      if (!tenantId) return;

      // Load available plugins
      const { data: pluginsData, error: pluginsError } = await supabase
        .from('plugin_definitions')
        .select('*')
        .eq('is_active', true);

      if (pluginsError) throw pluginsError;

      // Load user's configurations
      const { data: configsData } = await supabase
        .from('plugin_configurations')
        .select('*')
        .eq('tenant_id', tenantId);

      const configMap: Record<string, PluginConfiguration> = {};
      configsData?.forEach(config => {
        configMap[config.plugin_key] = config;
      });

      setPlugins((pluginsData || []).map(plugin => ({
        ...plugin,
        features: Array.isArray(plugin.features) ? plugin.features : []
      })));
      setConfigurations(configMap);
    } catch (error) {
      console.error('Error loading plugins:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los plugins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlugin = async (pluginKey: string, enabled: boolean) => {
    try {
      const tenantId = await getCurrentUserTenantId();
      if (!tenantId) return;

      if (enabled) {
        // Activate plugin
        const { error } = await supabase
          .from('plugin_configurations')
          .upsert({
            tenant_id: tenantId,
            plugin_key: pluginKey,
            is_active: true,
            configuration: {}
          }, {
            onConflict: 'tenant_id,plugin_key'
          });

        if (error) throw error;
      } else {
        // Deactivate plugin
        const { error } = await supabase
          .from('plugin_configurations')
          .update({ is_active: false })
          .eq('tenant_id', tenantId)
          .eq('plugin_key', pluginKey);

        if (error) throw error;
      }

      // Update local state
      setConfigurations(prev => ({
        ...prev,
        [pluginKey]: {
          ...prev[pluginKey],
          plugin_key: pluginKey,
          is_active: enabled,
          configuration: prev[pluginKey]?.configuration || {}
        }
      }));

      toast({
        title: "Plugin actualizado",
        description: `Plugin ${enabled ? 'activado' : 'desactivado'} correctamente`,
      });
    } catch (error) {
      console.error('Error toggling plugin:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el plugin",
        variant: "destructive",
      });
    }
  };

  const isPluginEnabled = (pluginKey: string) => {
    return configurations[pluginKey]?.is_active || false;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando plugins...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Gestión de Plugins</h2>
      </div>

      <div className="grid gap-6">
        {plugins.map((plugin) => (
          <Card key={plugin.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    {plugin.plugin_key === 'mercado_pago_pos' && <CreditCard className="h-5 w-5" />}
                    {plugin.name}
                    <Badge variant="secondary">v{plugin.version}</Badge>
                  </CardTitle>
                  <p className="text-muted-foreground">{plugin.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold">${plugin.price_monthly}/mes</div>
                    <div className="text-sm text-muted-foreground">Facturación mensual</div>
                  </div>
                  <Switch
                    checked={isPluginEnabled(plugin.plugin_key)}
                    onCheckedChange={(checked) => togglePlugin(plugin.plugin_key, checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Características:</h4>
                  <ul className="space-y-1">
                    {plugin.features.map((feature, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {isPluginEnabled(plugin.plugin_key) && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Plugin Activo
                      </Badge>
                      {plugin.plugin_key === 'mercado_pago_pos' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMercadoPagoConfig(true)}
                          className="flex items-center gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Configurar
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showMercadoPagoConfig && (
        <MercadoPagoConfig
          isOpen={showMercadoPagoConfig}
          onClose={() => setShowMercadoPagoConfig(false)}
          onConfigSaved={() => {
            setShowMercadoPagoConfig(false);
            loadPlugins();
          }}
        />
      )}
    </div>
  );
};