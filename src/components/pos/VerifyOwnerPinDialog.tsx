
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface VerifyOwnerPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPinVerified: () => void;
  title?: string;
  description?: string;
}

const VerifyOwnerPinDialog = ({
  open,
  onOpenChange,
  onPinVerified,
  title = "Verificación requerida",
  description = "Esta acción requiere verificación del propietario. Por favor, introduce el PIN del propietario para continuar.",
}: VerifyOwnerPinDialogProps) => {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { getAllUsers } = useAuth();
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!pin) {
      toast({
        title: "Error",
        description: "Por favor, introduce el PIN del propietario",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Verificando PIN del propietario:', pin);
      
      // Verificar si el PIN corresponde a un propietario
      const users = getAllUsers();
      console.log('👥 Usuarios disponibles:', users);
      
      const ownerUsers = users.filter(user => user.role === "owner");
      console.log('👑 Usuarios propietarios encontrados:', ownerUsers);
      
      const ownerUser = ownerUsers.find(user => user.pin === pin);
      console.log('✅ Usuario propietario con PIN coincidente:', ownerUser);

      if (ownerUser) {
        console.log('🎉 PIN del propietario verificado correctamente');
        onPinVerified();
        onOpenChange(false);
        setPin("");
        toast({
          title: "PIN verificado",
          description: "Verificación exitosa",
        });
      } else {
        console.log('❌ PIN incorrecto o usuario no es propietario');
        console.log('🔍 PIN ingresado:', pin);
        console.log('🔍 PINs de propietarios:', ownerUsers.map(u => ({ name: u.name, pin: u.pin })));
        
        toast({
          title: "PIN incorrecto",
          description: "El PIN no corresponde a una cuenta de propietario",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Error al verificar el PIN:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al verificar el PIN",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) setPin("");
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <div className="grid flex-1 gap-2">
            <Input
              type="password"
              placeholder="PIN del propietario"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerify();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? "Verificando..." : "Verificar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyOwnerPinDialog;
