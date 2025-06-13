
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { BarberCommission } from '@/types/financial';

export const useSupabaseCommissions = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [barberCommissions, setBarberCommissions] = useState<BarberCommission[]>([]);

  // Función helper para manejar errores
  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Error en ${operation}:`, error);
    toast({
      title: "Error",
      description: `Error en ${operation}: ${error.message}`,
      variant: "destructive",
    });
  }, [toast]);

  // Convertir datos de Supabase a formato local
  const convertSupabaseToLocal = (data: any): BarberCommission => ({
    id: data.id,
    barberId: data.barber_id,
    barberName: data.barber_name,
    percentage: parseFloat(data.percentage) || 0,
    serviceId: data.service_id,
    categoryId: data.category_id
  });

  // Convertir datos locales a formato Supabase
  const convertLocalToSupabase = (data: Omit<BarberCommission, 'id'>) => ({
    user_id: user?.id,
    barber_id: data.barberId,
    barber_name: data.barberName,
    percentage: data.percentage,
    service_id: data.serviceId,
    category_id: data.categoryId
  });

  // Cargar comisiones desde Supabase
  const loadCommissions = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🔄 Cargando comisiones desde Supabase...');
      
      const { data, error } = await supabase
        .from('barber_commissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        handleError(error, 'cargar comisiones');
      } else {
        setBarberCommissions(data?.map(convertSupabaseToLocal) || []);
        console.log('✅ Comisiones cargadas desde Supabase:', data?.length || 0);
      }
    } catch (error) {
      handleError(error, 'cargar comisiones');
    } finally {
      setLoading(false);
    }
  }, [user?.id, handleError]);

  // Añadir comisión
  const addBarberCommission = async (commission: Omit<BarberCommission, 'id'>) => {
    if (!user?.id) return;

    try {
      const supabaseData = convertLocalToSupabase(commission);
      
      const { data, error } = await supabase
        .from('barber_commissions')
        .insert([supabaseData])
        .select()
        .single();

      if (error) {
        handleError(error, 'añadir comisión');
        return;
      }

      const newCommission = convertSupabaseToLocal(data);
      setBarberCommissions(prev => [...prev, newCommission]);
      
      toast({
        title: "Comisión añadida",
        description: `Se ha añadido una nueva comisión para el barbero ${newCommission.barberName || newCommission.barberId}`
      });
    } catch (error) {
      handleError(error, 'añadir comisión');
    }
  };

  // Actualizar comisión
  const updateBarberCommission = async (commission: BarberCommission) => {
    if (!user?.id) return;

    try {
      const supabaseData = convertLocalToSupabase(commission);
      
      const { data, error } = await supabase
        .from('barber_commissions')
        .update(supabaseData)
        .eq('id', commission.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        handleError(error, 'actualizar comisión');
        return;
      }

      const updatedCommission = convertSupabaseToLocal(data);
      setBarberCommissions(prev => 
        prev.map(c => c.id === commission.id ? updatedCommission : c)
      );
      
      toast({
        title: "Comisión actualizada",
        description: `Se ha actualizado la comisión para el barbero ${updatedCommission.barberName || updatedCommission.barberId}`
      });
    } catch (error) {
      handleError(error, 'actualizar comisión');
    }
  };

  // Eliminar comisión
  const deleteBarberCommission = async (id: string) => {
    if (!user?.id) return;

    try {
      const commissionToDelete = barberCommissions.find(c => c.id === id);
      
      const { error } = await supabase
        .from('barber_commissions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        handleError(error, 'eliminar comisión');
        return;
      }

      setBarberCommissions(prev => prev.filter(c => c.id !== id));
      
      if (commissionToDelete) {
        toast({
          title: "Comisión eliminada",
          description: `Se ha eliminado la comisión para el barbero ${commissionToDelete.barberName || commissionToDelete.barberId}`
        });
      }
    } catch (error) {
      handleError(error, 'eliminar comisión');
    }
  };

  // Obtener tasa de comisión para un barbero
  const getBarberCommissionRate = (barberId: string, serviceId?: string, categoryId?: string): number => {
    if (serviceId) {
      const serviceCommission = barberCommissions.find(c => 
        c.barberId === barberId && c.serviceId === serviceId
      );
      
      if (serviceCommission) {
        return serviceCommission.percentage;
      }
    }
    
    if (categoryId) {
      const categoryCommission = barberCommissions.find(c => 
        c.barberId === barberId && c.categoryId === categoryId
      );
      
      if (categoryCommission) {
        return categoryCommission.percentage;
      }
    }
    
    const defaultCommission = barberCommissions.find(c => 
      c.barberId === barberId && !c.serviceId && !c.categoryId
    );
    
    if (defaultCommission) {
      return defaultCommission.percentage;
    }
    
    return 50; // Default 50%
  };

  // Cargar comisiones al inicializar
  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  return {
    loading,
    barberCommissions,
    addBarberCommission,
    updateBarberCommission,
    deleteBarberCommission,
    getBarberCommissionRate,
    loadCommissions
  };
};
