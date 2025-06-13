
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tip } from '@/services/TipService';

export const useTips = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);

  // Función helper para manejar errores
  const handleError = useCallback((error: any, operation: string) => {
    console.error(`❌ Error en ${operation}:`, error);
    toast({
      title: "Error",
      description: `Error en ${operation}: ${error.message}`,
      variant: "destructive",
    });
  }, [toast]);

  // Cargar tips desde Supabase (simulado con localStorage por ahora)
  const loadTips = useCallback(async () => {
    if (!user?.id) {
      setTips([]);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Cargando propinas para usuario:', user.id);
      
      // Por ahora mantenemos localStorage hasta crear tabla de tips
      const storedTips = localStorage.getItem(`barberpos_tips_${user.id}`);
      const tipsData = storedTips ? JSON.parse(storedTips) : [];
      
      setTips(tipsData);
      console.log('✅ Propinas cargadas:', tipsData.length);
    } catch (error) {
      handleError(error, 'cargar propinas');
      setTips([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, handleError]);

  // Agregar tip
  const addTip = useCallback(async (tip: Omit<Tip, 'id' | 'createdAt'>) => {
    if (!user?.id) return;

    try {
      const newTip: Tip = {
        ...tip,
        id: `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      const updatedTips = [...tips, newTip];
      setTips(updatedTips);
      
      // Guardar en localStorage por usuario
      localStorage.setItem(`barberpos_tips_${user.id}`, JSON.stringify(updatedTips));
      
      console.log('✅ Propina agregada:', newTip.id);
      return newTip;
    } catch (error) {
      handleError(error, 'agregar propina');
      throw error;
    }
  }, [user?.id, tips, handleError]);

  // Obtener tips por barbero
  const getTipsByBarber = useCallback((barberId: string) => {
    return tips.filter(tip => tip.barberId === barberId);
  }, [tips]);

  // Obtener tips por fecha
  const getTipsByDate = useCallback((date: string) => {
    return tips.filter(tip => tip.date === date);
  }, [tips]);

  // Cargar tips cuando cambie el usuario
  useEffect(() => {
    loadTips();
  }, [loadTips]);

  return {
    tips,
    loading,
    addTip,
    loadTips,
    getTipsByBarber,
    getTipsByDate
  };
};
