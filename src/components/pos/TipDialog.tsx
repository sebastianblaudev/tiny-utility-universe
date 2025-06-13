import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBarber } from '@/contexts/BarberContext';
import { PaymentMethod } from '@/types';
import { Check, Printer } from 'lucide-react';
import { tipService, Tip } from '@/services/TipService';
import { useToast } from '@/hooks/use-toast';

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  barberId: string;
  paymentMethod: PaymentMethod;
  onConfirm: (tip: Tip) => void;
}

const TipDialog: React.FC<TipDialogProps> = ({
  open,
  onOpenChange,
  total,
  barberId,
  paymentMethod,
  onConfirm,
}) => {
  const { barbers } = useBarber();
  const { toast } = useToast();
  const [tipAmount, setTipAmount] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const barber = barbers.find(b => b.id === barberId);
  
  const handleConfirm = async () => {
    const amount = tipAmount ? parseFloat(tipAmount) : 0;
    if (amount >= 0) {
      setIsLoading(true);
      try {
        console.log("Creating tip with amount:", amount);
        const newTip = await tipService.addTip({
          amount,
          barberId,
          barberName: barber?.name || 'Unknown',
          paymentMethod: paymentMethod,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        });
        
        console.log("Tip created successfully:", newTip);
        
        // Call onConfirm with the tip
        onConfirm(newTip);
        
        // Reset state
        setTipAmount('');
        setShowSuccess(false);
        
        toast({
          title: "Propina registrada",
          description: `Se ha registrado una propina de $${amount} para ${barber?.name || 'el barbero'}`
        });
        
      } catch (error) {
        console.error('Error adding tip:', error);
        toast({
          title: "Error",
          description: "No se pudo registrar la propina",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // If no tip amount, just call onConfirm with empty tip
      const emptyTip: Tip = {
        id: '',
        amount: 0,
        barberId,
        barberName: barber?.name || 'Unknown',
        paymentMethod,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      onConfirm(emptyTip);
      setTipAmount('');
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setTipAmount('');
    onOpenChange(false);
  };

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setShowSuccess(false);
      setTipAmount('');
      setIsLoading(false);
    }
  }, [open]);

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Propina Registrada
            </DialogTitle>
            <DialogDescription>
              La propina de ${tipAmount} se ha registrado exitosamente para {barber?.name}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Propina</DialogTitle>
          <DialogDescription>
            Agregar propina para {barber?.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="tip-amount" className="text-sm font-medium">
              Monto de la propina:
            </label>
            <Input
              id="tip-amount"
              type="number"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              placeholder="0.00"
              className="text-lg"
              min="0"
              step="0.01"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : `Confirmar $${tipAmount || '0.00'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TipDialog;
