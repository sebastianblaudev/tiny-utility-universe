
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/lib/auth";

export function useAuthWithPin() {
  const { loginWithPin } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const authWithPin = async (pin: string) => {
    if (!pin || pin.length !== 4) {
      setError('PIN inválido');
      toast.error('PIN inválido');
      return null;
    }

    setError(null);

    try {
      // Primero obtenemos el usuario asociado al PIN
      const auth = Auth.getInstance();
      const users = auth.getAllUsers();
      const userWithPin = users.find(u => u.pin === pin);
      
      if (!userWithPin) {
        throw new Error('PIN incorrecto o usuario no encontrado');
      }
      
      // Si es un usuario administrador, verificamos que exista en Supabase
      if (userWithPin.role === 'admin') {
        try {
          // Intentamos encontrar el usuario en Supabase por email
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', userWithPin.username)
            .single();
          
          if (error || !data || !data.activo) {
            console.error("Usuario no encontrado en Supabase o inactivo");
            window.location.href = "https://www.google.com";
            return null;
          }
        } catch (supabaseError) {
          console.error("Error al verificar usuario en Supabase:", supabaseError);
          window.location.href = "https://www.google.com";
          return null;
        }
      }

      // Si todo está bien, continuamos con la autenticación local
      const profile = await loginWithPin(pin);
      if (!profile) {
        // Error message is already handled in loginWithPin
        return null;
      }
      return profile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de autenticación';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  };

  return { authWithPin, error };
}
