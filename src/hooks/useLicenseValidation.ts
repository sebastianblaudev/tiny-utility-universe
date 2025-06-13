
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useLicenseValidation = () => {
  const { user, session } = useSupabaseAuth();
  const [isLicenseValid, setIsLicenseValid] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  const validateLicense = useCallback(async () => {
    if (!user || !session) {
      setIsLicenseValid(true); // Si no hay usuario, no mostramos el mensaje
      return;
    }

    setIsChecking(true);
    
    try {
      // Verificar si el usuario está activo en Supabase Auth
      const { data: authUser, error } = await supabase.auth.getUser();
      
      if (error || !authUser.user) {
        console.log('Usuario no encontrado o error en auth:', error);
        setIsLicenseValid(false);
        setIsChecking(false);
        return;
      }

      // Verificar el perfil del usuario para validar si está baneado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('Error al obtener perfil:', profileError);
        setIsLicenseValid(false);
        setIsChecking(false);
        return;
      }

      // Si el usuario existe y tiene perfil, la licencia es válida
      setIsLicenseValid(true);
      setLastCheckTime(new Date());
      
    } catch (error) {
      console.error('Error validando licencia:', error);
      setIsLicenseValid(false);
    } finally {
      setIsChecking(false);
    }
  }, [user, session]);

  // Ejecutar validación cada 10 minutos
  useEffect(() => {
    if (!user) return;

    // Validación inicial
    validateLicense();

    // Configurar intervalo de 10 minutos (600,000 ms)
    const interval = setInterval(() => {
      validateLicense();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, validateLicense]);

  return {
    isLicenseValid,
    isChecking,
    lastCheckTime,
    validateLicense
  };
};
