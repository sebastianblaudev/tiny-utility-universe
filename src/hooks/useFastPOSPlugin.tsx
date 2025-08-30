import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useFastPOSPlugin = () => {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const { tenantId } = useAuth();

  useEffect(() => {
    checkPluginStatus();
  }, [tenantId]);

  const checkPluginStatus = async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('plugin_configurations')
        .select('is_active')
        .eq('tenant_id', tenantId)
        .eq('plugin_key', 'fast_pos_performance')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Fast POS plugin status:', error);
      }

      setIsActive(data?.is_active || false);
    } catch (error) {
      console.error('Error checking Fast POS plugin:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlugin = async () => {
    if (!tenantId) return false;

    try {
      const { data: existing } = await supabase
        .from('plugin_configurations')
        .select('id, is_active')
        .eq('tenant_id', tenantId)
        .eq('plugin_key', 'fast_pos_performance')
        .maybeSingle();

      if (existing) {
        // Update existing plugin
        const { error } = await supabase
          .from('plugin_configurations')
          .update({ is_active: !existing.is_active })
          .eq('id', existing.id);

        if (error) throw error;
        setIsActive(!existing.is_active);
      } else {
        // Create new plugin activation
        const { error } = await supabase
          .from('plugin_configurations')
          .insert({
            tenant_id: tenantId,
            plugin_key: 'fast_pos_performance',
            is_active: true,
            configuration: {}
          });

        if (error) throw error;
        setIsActive(true);
      }

      return true;
    } catch (error) {
      console.error('Error toggling Fast POS plugin:', error);
      return false;
    }
  };

  const shouldAutoActivate = async (productCount: number): Promise<boolean> => {
    // Auto-activate if over 1000 products and not manually disabled
    if (productCount > 1000 && !isActive) {
      const activated = await togglePlugin();
      return activated;
    }
    return isActive;
  };

  return {
    isActive,
    loading,
    togglePlugin,
    shouldAutoActivate,
    checkPluginStatus
  };
};