import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Mesa {
  id: string;
  numero: number;
  nombre?: string | null;
  capacidad: number;
  estado: 'disponible' | 'ocupada' | 'reservada' | 'fuera_servicio';
  ubicacion?: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface PedidoMesa {
  id: string;
  mesa_id: string;
  numero_pedido: number;
  estado: 'activo' | 'enviado_cocina' | 'completado' | 'cancelado';
  subtotal: number;
  total: number;
  notas?: string | null;
  mesero_nombre?: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface PedidoMesaItem {
  id: string;
  pedido_mesa_id: string;
  product_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string | null;
  estado: 'pendiente' | 'enviado_cocina' | 'preparando' | 'listo' | 'servido';
  enviado_cocina_at?: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export function useMesas() {
  const { tenantId } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMesas = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('numero');

      if (error) throw error;
      setMesas(data as Mesa[] || []);
    } catch (error) {
      console.error('Error loading mesas:', error);
      toast.error('Error al cargar las mesas');
    } finally {
      setLoading(false);
    }
  };

  const createMesa = async (mesa: Omit<Mesa, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
    if (!tenantId) return null;

    try {
      const { data, error } = await supabase
        .from('mesas')
        .insert([{ ...mesa, tenant_id: tenantId }])
        .select()
        .single();

      if (error) throw error;
      
      setMesas(prev => [...prev, data as Mesa]);
      toast.success('Mesa creada exitosamente');
      return data;
    } catch (error) {
      console.error('Error creating mesa:', error);
      toast.error('Error al crear la mesa');
      return null;
    }
  };

  const updateMesa = async (id: string, updates: Partial<Mesa>) => {
    try {
      const { data, error } = await supabase
        .from('mesas')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      
      setMesas(prev => prev.map(mesa => mesa.id === id ? data as Mesa : mesa));
      toast.success('Mesa actualizada');
      return data;
    } catch (error) {
      console.error('Error updating mesa:', error);
      toast.error('Error al actualizar la mesa');
      return null;
    }
  };

  const deleteMesa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mesas')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      setMesas(prev => prev.filter(mesa => mesa.id !== id));
      toast.success('Mesa eliminada');
      return true;
    } catch (error) {
      console.error('Error deleting mesa:', error);
      toast.error('Error al eliminar la mesa');
      return false;
    }
  };

  const ocuparMesa = async (id: string) => {
    return updateMesa(id, { estado: 'ocupada' });
  };

  const liberarMesa = async (id: string) => {
    return updateMesa(id, { estado: 'disponible' });
  };

  useEffect(() => {
    loadMesas();
  }, [tenantId]);

  return {
    mesas,
    loading,
    loadMesas,
    createMesa,
    updateMesa,
    deleteMesa,
    ocuparMesa,
    liberarMesa
  };
}