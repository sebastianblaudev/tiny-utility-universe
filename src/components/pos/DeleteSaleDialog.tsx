
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
import { Sale } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface DeleteSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  onConfirmDelete: () => void;
}

const DeleteSaleDialog = ({
  open,
  onOpenChange,
  sale,
  onConfirmDelete,
}: DeleteSaleDialogProps) => {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleDelete = async () => {
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
      console.log('🔍 Verificando PIN para eliminación de venta:', pin);
      
      // Verificar directamente en la base de datos de Supabase
      const { data: systemUsers, error: systemUsersError } = await supabase
        .from('system_users')
        .select('*')
        .eq('role', 'owner')
        .eq('pin', pin);

      if (systemUsersError) {
        console.error('Error consultando usuarios del sistema:', systemUsersError);
        toast({
          title: "Error",
          description: "Error al verificar el PIN",
          variant: "destructive",
        });
        return;
      }

      console.log('👑 Usuarios propietarios encontrados con PIN:', systemUsers);

      // También verificar en la tabla de perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'owner')
        .eq('pin', pin);

      if (profilesError) {
        console.error('Error consultando perfiles:', profilesError);
      }

      console.log('👑 Perfiles propietarios encontrados con PIN:', profiles);

      const hasOwnerWithPin = (systemUsers && systemUsers.length > 0) || 
                              (profiles && profiles.length > 0);

      if (hasOwnerWithPin) {
        console.log('🎉 PIN verificado correctamente, procediendo con la eliminación');
        onConfirmDelete();
        onOpenChange(false);
        setPin("");
        toast({
          title: "Venta eliminada",
          description: "La venta ha sido eliminada correctamente",
        });
      } else {
        console.log('❌ PIN incorrecto o usuario no es propietario');
        console.log('🔍 PIN ingresado:', pin);
        
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

  const handleClose = () => {
    onOpenChange(false);
    setPin("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar venta</DialogTitle>
          <DialogDescription>
            Esta acción es irreversible. Por favor, introduce el PIN del propietario para confirmar la eliminación.
          </DialogDescription>
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
                  handleDelete();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Verificando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSaleDialog;
