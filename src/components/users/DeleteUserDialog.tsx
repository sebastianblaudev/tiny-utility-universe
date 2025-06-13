
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  userName: string;
  isTestUser?: boolean;
}

const DeleteUserDialog = ({
  isOpen,
  onClose,
  onDelete,
  userName,
  isTestUser = false,
}: DeleteUserDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará al usuario <strong>{userName}</strong> permanentemente
            y no se puede deshacer.
            {isTestUser && (
              <span className="font-semibold text-red-600 block mt-2">
                Este usuario parece ser de prueba. Al eliminarlo, también se bloqueará la creación futura de usuarios con nombres similares.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserDialog;
