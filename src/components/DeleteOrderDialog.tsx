
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { Auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface DeleteOrderDialogProps {
  orderId: string;
  onDelete: () => void;
}

export function DeleteOrderDialog({ orderId, onDelete }: DeleteOrderDialogProps) {
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const auth = Auth.getInstance();

  const handleDelete = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para realizar esta acción",
          variant: "destructive",
        });
        return;
      }

      // Solo administradores pueden eliminar ventas
      if (!auth.isAdmin()) {
        toast({
          title: "Error",
          description: "No tienes permisos para eliminar ventas",
          variant: "destructive",
        });
        return;
      }

      const isValid = await auth.login(currentUser.username, password);
      if (isValid) {
        onDelete();
        setIsOpen(false);
        setPassword("");
        toast({
          title: "Éxito",
          description: "La venta ha sido eliminada correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: "La contraseña es incorrecta",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al verificar credenciales",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333]"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-[#1A1A1A] border-[#333333]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Confirmar eliminación</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Esta acción no se puede deshacer. Para confirmar, ingresa tu contraseña de administrador.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#252525] border-[#333333] text-white"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-[#252525] text-white hover:bg-[#333333] border-[#333333]">
            Cancelar
          </AlertDialogCancel>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
