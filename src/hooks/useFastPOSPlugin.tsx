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
        .from('tenant_plugins')
        .select('is_enabled')
        .eq('tenant_id', tenantId)
        .eq('plugin_key', 'fast_pos_performance')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Fast POS plugin status:', error);
      }

      setIsActive(data?.is_enabled || false);
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
        .from('tenant_plugins')
        .select('id, is_enabled')
        .eq('tenant_id', tenantId)
        .eq('plugin_key', 'fast_pos_performance')
        .maybeSingle();

      if (existing) {
        // Update existing plugin
        const { error } = await supabase
          .from('tenant_plugins')
          .update({ is_enabled: !existing.is_enabled })
          .eq('id', existing.id);

        if (error) throw error;
        setIsActive(!existing.is_enabled);
      } else {
        // Create new plugin activation
        const { error } = await supabase
          .from('tenant_plugins')
          .insert({
            tenant_id: tenantId,
            plugin_key: 'fast_pos_performance',
            is_enabled: true
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