import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Mesa {
  id: string;
  numero: number;
  nombre: string;
  estado: 'disponible' | 'ocupada' | 'reservada';
  pedido_activo?: {
    id: string;
    items_count: number;
    total: number;
  };
}

interface PedidoMesaItem {
  id: string;
  product_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
  estado: 'pendiente' | 'enviado_cocina' | 'completado';
  enviado_cocina_at?: string;
  product_name?: string;
}

export const useDelightMesas = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [isPluginActive, setIsPluginActive] = useState(false);
  const { tenantId } = useAuth();
  const { toast } = useToast();

  // Check if plugin is active
  useEffect(() => {
    const checkPluginStatus = async () => {
      if (!tenantId) return;

      const { data } = await supabase
        .from('plugin_configurations')
        .select('is_active')
        .eq('tenant_id', tenantId)
        .eq('plugin_key', 'delight_mesas')
        .single();

      setIsPluginActive(data?.is_active || false);
    };

    checkPluginStatus();
  }, [tenantId]);

  // Load mesas
  const loadMesas = async () => {
    if (!tenantId || !isPluginActive) return;

    setLoading(true);
    try {
      // First ensure mesas exist
      await ensureMesasExist();

      // Load mesas with active orders
      const { data: mesasData, error } = await supabase
        .from('mesas')
        .select(`
          id,
          numero,
          nombre,
          estado,
          pedidos_mesa:pedidos_mesa(
            id,
            total,
            pedido_mesa_items:pedido_mesa_items(id)
          )
        `)
        .eq('tenant_id', tenantId)
        .order('numero');

      if (error) throw error;

      const mesasWithPedidos = mesasData?.map(mesa => ({
        ...mesa,
        pedido_activo: mesa.pedidos_mesa?.[0] ? {
          id: mesa.pedidos_mesa[0].id,
          items_count: mesa.pedidos_mesa[0].pedido_mesa_items?.length || 0,
          total: mesa.pedidos_mesa[0].total
        } : undefined,
        estado: mesa.pedidos_mesa?.[0] ? 'ocupada' as const : 'disponible' as const
      })) || [];

      setMesas(mesasWithPedidos);
    } catch (error) {
      console.error('Error loading mesas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las mesas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Ensure 7 mesas exist for tenant
  const ensureMesasExist = async () => {
    if (!tenantId) return;

    const { data: existingMesas } = await supabase
      .from('mesas')
      .select('numero')
      .eq('tenant_id', tenantId);

    const existingNumbers = existingMesas?.map(m => m.numero) || [];
    const missingNumbers = Array.from({length: 7}, (_, i) => i + 1)
      .filter(num => !existingNumbers.includes(num));

    if (missingNumbers.length > 0) {
      const newMesas = missingNumbers.map(num => ({
        numero: num,
        nombre: `Mesa ${num}`,
        tenant_id: tenantId
      }));

      await supabase.from('mesas').insert(newMesas);
    }
  };

  // Create or get active order for mesa
  const selectMesa = async (mesa: Mesa) => {
    if (!tenantId) return null;

    try {
      let pedidoId = mesa.pedido_activo?.id;

      if (!pedidoId) {
        // Create new order
        const { data: newPedido, error } = await supabase
          .from('pedidos_mesa')
          .insert({
            mesa_id: mesa.id,
            numero_pedido: Math.floor(Math.random() * 10000),
            tenant_id: tenantId
          })
          .select()
          .single();

        if (error) throw error;
        pedidoId = newPedido.id;
      }

      setSelectedMesa(mesa);
      return pedidoId;
    } catch (error) {
      console.error('Error selecting mesa:', error);
      toast({
        title: "Error",
        description: "No se pudo seleccionar la mesa",
        variant: "destructive",
      });
      return null;
    }
  };

  // Add item to mesa order
  const addItemToMesa = async (pedidoId: string, productId: string, quantity: number, price: number, productName: string, notes?: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('pedido_mesa_items')
        .insert({
          pedido_mesa_id: pedidoId,
          product_id: productId,
          cantidad: quantity,
          precio_unitario: price,
          subtotal: quantity * price,
          notas: notes,
          tenant_id: tenantId
        });

      if (error) throw error;

      // Update pedido total
      await updatePedidoTotal(pedidoId);
      
      return true;
    } catch (error) {
      console.error('Error adding item to mesa:', error);
      return false;
    }
  };

  // Update pedido total
  const updatePedidoTotal = async (pedidoId: string) => {
    const { data: items } = await supabase
      .from('pedido_mesa_items')
      .select('subtotal')
      .eq('pedido_mesa_id', pedidoId);

    const total = items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;

    await supabase
      .from('pedidos_mesa')
      .update({ total })
      .eq('id', pedidoId);
  };

  // Get mesa order items
  const getMesaItems = async (pedidoId: string): Promise<PedidoMesaItem[]> => {
    const { data, error } = await supabase
      .from('pedido_mesa_items')
      .select(`
        *,
        products:products(name)
      `)
      .eq('pedido_mesa_id', pedidoId)
      .order('created_at');

    if (error) {
      console.error('Error loading mesa items:', error);
      return [];
    }

    return data?.map(item => ({
      ...item,
      product_name: item.products?.name,
      estado: item.estado as 'pendiente' | 'enviado_cocina' | 'completado'
    })) || [];
  };

  // Send items to kitchen (print comanda)
  const sendToKitchen = async (pedidoId: string) => {
    try {
      // Update pending items as sent to kitchen
      const { error } = await supabase
        .from('pedido_mesa_items')
        .update({ 
          estado: 'enviado_cocina',
          enviado_cocina_at: new Date().toISOString()
        })
        .eq('pedido_mesa_id', pedidoId)
        .eq('estado', 'pendiente');

      if (error) throw error;

      // Here you would trigger the kitchen print
      toast({
        title: "Comanda enviada",
        description: "Los nuevos productos se han enviado a cocina",
      });

      return true;
    } catch (error) {
      console.error('Error sending to kitchen:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la comanda a cocina",
        variant: "destructive",
      });
      return false;
    }
  };

  // Clear mesa selection
  const clearMesaSelection = () => {
    setSelectedMesa(null);
  };

  // Complete mesa order (checkout)
  const completeMesaOrder = async (pedidoId: string) => {
    try {
      const { error } = await supabase
        .from('pedidos_mesa')
        .update({ estado: 'completado' })
        .eq('id', pedidoId);

      if (error) throw error;

      await loadMesas(); // Refresh mesas
      clearMesaSelection();

      toast({
        title: "Mesa cerrada",
        description: "La orden ha sido completada exitosamente",
      });

      return true;
    } catch (error) {
      console.error('Error completing mesa order:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la orden",
        variant: "destructive",
      });
      return false;
    }
  };

  // Load mesas when plugin becomes active
  useEffect(() => {
    if (isPluginActive) {
      loadMesas();
    }
  }, [isPluginActive, tenantId]);

  return {
    mesas,
    loading,
    selectedMesa,
    isPluginActive,
    loadMesas,
    selectMesa,
    addItemToMesa,
    getMesaItems,
    sendToKitchen,
    clearMesaSelection,
    completeMesaOrder
  };
};