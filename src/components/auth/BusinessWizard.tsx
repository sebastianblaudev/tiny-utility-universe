import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { initDB } from "@/lib/db";

const BusinessWizard = () => {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { showConfetti } = useConfetti();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, register with Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Wait for session to be established
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error("Failed to establish authentication session");
      }

      // Generate business ID
      const businessId = uuidv4();
      
      // Register business in Supabase - now we're authenticated
      const { error: businessError } = await supabase
        .from('businesses')
        .insert({
          id: businessId,
          name: businessName,
          email: email,
          license_key: uuidv4() // Generate a unique license key
        });

      if (businessError) throw businessError;

      // Register admin user in local storage
      const auth = Auth.getInstance();
      await auth.register(email, password, "admin");

      // Initialize local IndexedDB with business info
      const db = await initDB();
      await db.put("business", {
        id: businessId,
        name: businessName,
        email,
        createdAt: new Date()
      });

      showConfetti();
      
      toast({
        title: "¡Registro exitoso! 🎉",
        description: "Tu negocio ha sido registrado correctamente",
      });

      // Sign out from Supabase (we'll use local auth for the app)
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
      <div className="bg-[#252525] p-8 rounded-lg shadow-xl w-full max-w-md border border-[#333333]">
        <div className="flex justify-center mb-6">
          <Star className="h-12 w-12 text-orange-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-6">
          Configura tu Negocio
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-gray-300">
              Nombre del Negocio
            </Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              placeholder="Pizzería Don Juan"
              className="bg-[#333333] border-[#444444]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Correo Electrónico
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="correo@ejemplo.com"
              className="bg-[#333333] border-[#444444]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="********"
              className="bg-[#333333] border-[#444444]"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={isLoading}
          >
            {isLoading ? "Registrando..." : "Completar Registro"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors duration-300"
            onClick={() => navigate("/login")}
          >
            ¿Ya tienes una cuenta? Iniciar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessWizard;
