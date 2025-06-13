
import React from "react";
import { CashAdvance } from "@/types";
import { useToast } from "@/hooks/use-toast";

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

interface SettleAdvanceDialogProps {
  advance: CashAdvance | null;
  isOpen: boolean;
  onClose: () => void;
  onSettle: (id: string) => void;
}

const SettleAdvanceDialog: React.FC<SettleAdvanceDialogProps> = ({
  advance,
  isOpen,
  onClose,
  onSettle,
}) => {
  const { toast } = useToast();

  const handleSettle = () => {
    if (!advance) return;
    
    try {
      onSettle(advance.id);
      toast({
        title: "Adelanto liquidado",
        description: "El adelanto ha sido marcado como liquidado",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo liquidar el adelanto",
        variant: "destructive",
      });
    }
  };

  // Helper function to safely format date
  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    
    try {
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString();
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  if (!advance) return null;

  const paymentMethodLabel = advance.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Liquidar adelanto</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de querer marcar este adelanto como liquidado? 
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">Barbero</span>
            <span className="font-medium">{advance.barberName}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">Monto</span>
            <span className="font-medium">${advance.amount.toFixed(2)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">Método de pago</span>
            <span className="font-medium">{paymentMethodLabel}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">Fecha</span>
            <span className="font-medium">{formatDate(advance.date)}</span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-sm font-medium text-gray-500">Razón</span>
            <span>{advance.description}</span>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            className="bg-barber-600 hover:bg-barber-700"
            onClick={handleSettle}
          >
            Confirmar Liquidación
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SettleAdvanceDialog;
