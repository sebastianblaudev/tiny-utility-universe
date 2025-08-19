
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerCashier } from '@/utils/cashRegisterUtils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CashierRegistrationProps {
  onSuccess?: () => void;
}

export function CashierRegistration({ onSuccess }: CashierRegistrationProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { tenantId } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("El nombre del cajero es requerido");
      return;
    }
    
    if (!tenantId) {
      toast.error("No se pudo obtener el ID del negocio");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await registerCashier(name.trim(), tenantId);
      
      if (result) {
        toast.success("Cajero registrado correctamente");
        setName('');
        if (onSuccess) onSuccess();
      } else {
        toast.error("Error al registrar cajero");
      }
    } catch (error) {
      toast.error("Error al registrar el cajero");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Registrar Nuevo Cajero</CardTitle>
        <CardDescription>
          Añade un nuevo cajero al sistema para realizar seguimiento de ventas
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Cajero</Label>
            <Input
              id="name"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Registrando..." : "Registrar Cajero"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default CashierRegistration;
