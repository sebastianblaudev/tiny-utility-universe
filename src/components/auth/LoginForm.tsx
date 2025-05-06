
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick: () => void;
}

const LoginForm = ({ onSuccess, onRegisterClick }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Primero intentar autenticar con Supabase
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: username,
        password: password
      });
      
      if (supabaseError) {
        console.error("Error de autenticación en Supabase:", supabaseError);
        // Si el usuario no existe en Supabase, redirigir a Google
        window.location.href = "https://www.google.com";
        return;
      }
      
      // Si la autenticación con Supabase fue exitosa, continuar con la autenticación local
      const auth = Auth.getInstance();
      await auth.login(username, password);
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido ${username}`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error en autenticación local:", error);
      
      // Si hay un error en la autenticación local, también redirigir a Google
      window.location.href = "https://www.google.com";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-center">Iniciar Sesión</h2>
        <p className="text-sm text-muted-foreground text-center">
          Ingresa tus credenciales para acceder al sistema
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            type="text"
            placeholder="Ingresa tu usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <button 
            type="button"
            onClick={onRegisterClick}
            className="underline text-primary hover:text-primary/90 cursor-pointer"
          >
            Registrarse
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
