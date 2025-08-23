import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { PedidoMesa, PedidoMesaItem } from './useMesas';

export interface Product {
  id: string;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  is_by_weight: boolean;
  category?: string | null;
  image_url?: string | null;
}

export interface PedidoMesaDetalle extends PedidoMesa {
  mesa: {
    numero: number;
    nombre?: string | null;
  };
  items: (PedidoMesaItem & {
    product: Product;
  })[];
}

export function usePedidosMesa() {
  const { tenantId } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoMesaDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPedidos = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('pedidos_mesa')
        .select(`
          *,
          mesa:mesas(numero, nombre),
          items:pedido_mesa_items(
            *,
            product:products(id, name, price, cost_price, stock, is_by_weight, category, image_url)
          )
        `)
        .eq('tenant_id', tenantId)
        .in('estado', ['activo', 'enviado_cocina'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos(data as any || []);
    } catch (error) {
      console.error('Error loading pedidos:', error);
      toast.error('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getPedidoActivoByMesa = async (mesaId: string): Promise<PedidoMesaDetalle | null> => {
    if (!tenantId) return null;

    try {
      const { data, error } = await supabase
        .from('pedidos_mesa')
        .select(`
          *,
          mesa:mesas(numero, nombre),
          items:pedido_mesa_items(
            *,
            product:products(id, name, price, cost_price, stock, is_by_weight, category, image_url)
          )
        `)
        .eq('mesa_id', mesaId)
        .eq('tenant_id', tenantId)
        .in('estado', ['activo', 'enviado_cocina'])
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as any || null;
    } catch (error) {
      console.error('Error getting pedido activo:', error);
      return null;
    }
  };

  const createPedidoMesa = async (mesaId: string, meseroNombre?: string) => {
    if (!tenantId) return null;

    try {
      // Verificar si ya hay un pedido activo
      const pedidoExistente = await getPedidoActivoByMesa(mesaId);
      if (pedidoExistente) {
        return pedidoExistente;
      }

      // Generar número de pedido
      const { data: ultimoPedido } = await supabase
        .from('pedidos_mesa')
        .select('numero_pedido')
        .eq('tenant_id', tenantId)
        .order('numero_pedido', { ascending: false })
        .limit(1)
        .single();

      const numeroPedido = (ultimoPedido?.numero_pedido || 0) + 1;

      const { data, error } = await supabase
        .from('pedidos_mesa')
        .insert([{
          mesa_id: mesaId,
          numero_pedido: numeroPedido,
          mesero_nombre: meseroNombre,
          tenant_id: tenantId
        }])
        .select(`
          *,
          mesa:mesas(numero, nombre)
        `)
        .single();

      if (error) throw error;
      
      const nuevoPedido = { ...data, items: [] } as PedidoMesaDetalle;
      setPedidos(prev => [nuevoPedido, ...prev]);
      toast.success('Pedido creado');
      return nuevoPedido;
    } catch (error) {
      console.error('Error creating pedido:', error);
      toast.error('Error al crear el pedido');
      return null;
    }
  };

  const addItemToPedido = async (
    pedidoId: string, 
    productId: string, 
    cantidad: number, 
    precio: number,
    notas?: string
  ) => {
    if (!tenantId) return null;

    try {
      const subtotal = cantidad * precio;

      const { data, error } = await supabase
        .from('pedido_mesa_items')
        .insert([{
          pedido_mesa_id: pedidoId,
          product_id: productId,
          cantidad,
          precio_unitario: precio,
          subtotal,
          notas,
          tenant_id: tenantId
        }])
        .select(`
          *,
          product:products(id, name, price, cost_price, stock, is_by_weight, category, image_url)
        `)
        .single();

      if (error) throw error;

      // Actualizar totales del pedido
      const { data: items } = await supabase
        .from('pedido_mesa_items')
        .select('subtotal')
        .eq('pedido_mesa_id', pedidoId);

      const nuevoTotal = (items || []).reduce((sum, item) => sum + item.subtotal, 0) + subtotal;

      await supabase
        .from('pedidos_mesa')
        .update({ 
          subtotal: nuevoTotal,
          total: nuevoTotal 
        })
        .eq('id', pedidoId);

      // Actualizar estado local
      setPedidos(prev => prev.map(pedido => {
        if (pedido.id === pedidoId) {
          return {
            ...pedido,
            items: [...pedido.items, data as any],
            subtotal: nuevoTotal,
            total: nuevoTotal
          };
        }
        return pedido;
      }));

      toast.success('Producto agregado al pedido');
      return data;
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Error al agregar producto');
      return null;
    }
  };

  const removeItemFromPedido = async (itemId: string, pedidoId: string) => {
    try {
      const { error } = await supabase
        .from('pedido_mesa_items')
        .delete()
        .eq('id', itemId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Recalcular totales
      const { data: items } = await supabase
        .from('pedido_mesa_items')
        .select('subtotal')
        .eq('pedido_mesa_id', pedidoId);

      const nuevoTotal = (items || []).reduce((sum, item) => sum + item.subtotal, 0);

      await supabase
        .from('pedidos_mesa')
        .update({ 
          subtotal: nuevoTotal,
          total: nuevoTotal 
        })
        .eq('id', pedidoId);

      // Actualizar estado local
      setPedidos(prev => prev.map(pedido => {
        if (pedido.id === pedidoId) {
          return {
            ...pedido,
            items: pedido.items.filter(item => item.id !== itemId),
            subtotal: nuevoTotal,
            total: nuevoTotal
          };
        }
        return pedido;
      }));

      toast.success('Producto eliminado');
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Error al eliminar producto');
      return false;
    }
  };

  const enviarACocina = async (pedidoId: string) => {
    try {
      // Marcar items como enviados a cocina
      const { error: itemsError } = await supabase
        .from('pedido_mesa_items')
        .update({ 
          estado: 'enviado_cocina',
          enviado_cocina_at: new Date().toISOString()
        })
        .eq('pedido_mesa_id', pedidoId)
        .eq('estado', 'pendiente');

      if (itemsError) throw itemsError;

      // Actualizar estado del pedido
      const { error: pedidoError } = await supabase
        .from('pedidos_mesa')
        .update({ estado: 'enviado_cocina' })
        .eq('id', pedidoId);

      if (pedidoError) throw pedidoError;

      // Actualizar estado local
      setPedidos(prev => prev.map(pedido => {
        if (pedido.id === pedidoId) {
          return {
            ...pedido,
            estado: 'enviado_cocina' as const,
            items: pedido.items.map(item => ({
              ...item,
              estado: item.estado === 'pendiente' ? 'enviado_cocina' as const : item.estado,
              enviado_cocina_at: item.estado === 'pendiente' ? new Date().toISOString() : item.enviado_cocina_at
            }))
          };
        }
        return pedido;
      }));

      toast.success('Pedido enviado a cocina');
      return true;
    } catch (error) {
      console.error('Error sending to kitchen:', error);
      toast.error('Error al enviar a cocina');
      return false;
    }
  };

  const completarPedido = async (pedidoId: string) => {
    try {
      const { error } = await supabase
        .from('pedidos_mesa')
        .update({ estado: 'completado' })
        .eq('id', pedidoId);

      if (error) throw error;

      setPedidos(prev => prev.filter(pedido => pedido.id !== pedidoId));
      toast.success('Pedido completado');
      return true;
    } catch (error) {
      console.error('Error completing pedido:', error);
      toast.error('Error al completar pedido');
      return false;
    }
  };

  useEffect(() => {
    loadPedidos();
  }, [tenantId]);

  return {
    pedidos,
    loading,
    loadPedidos,
    getPedidoActivoByMesa,
    createPedidoMesa,
    addItemToPedido,
    removeItemFromPedido,
    enviarACocina,
    completarPedido
  };
}