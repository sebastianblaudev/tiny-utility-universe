
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick: () => void;
}

const RegisterForm = ({ onSuccess, onLoginClick }: RegisterFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Las contraseñas no coinciden",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const auth = Auth.getInstance();
      await auth.register(email, password);
      
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada correctamente",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-center">Crear Cuenta</h2>
        <p className="text-sm text-muted-foreground text-center">
          Ingresa tus datos para crear una nueva cuenta
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creando cuenta..." : "Registrarse"}
        </Button>
      </form>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <button 
            type="button"
            onClick={onLoginClick}
            className="underline text-primary hover:text-primary/90 cursor-pointer"
          >
            Iniciar Sesión
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
