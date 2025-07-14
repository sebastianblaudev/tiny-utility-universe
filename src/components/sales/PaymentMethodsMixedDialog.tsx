
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { DollarSign, CreditCard, ArrowUpDown, X, CheckCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MixedPaymentType, PaymentMethodType } from '@/integrations/supabase/client';

interface PaymentMethodsMixedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (methods: MixedPaymentType[]) => void;
  total: number;
}

const PaymentMethodsMixedDialog: React.FC<PaymentMethodsMixedDialogProps> = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  total 
}) => {
  const [paymentMethods, setPaymentMethods] = useState<MixedPaymentType[]>([
    { method: 'cash', amount: 0 },
  ]);
  const [remainingAmount, setRemainingAmount] = useState(total);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setPaymentMethods([{ method: 'cash', amount: total }]);
      setRemainingAmount(0);
    }
  }, [isOpen, total]);

  const handleAddPaymentMethod = (type: PaymentMethodType) => {
    // Check if this payment method already exists
    if (paymentMethods.some(pm => pm.method === type)) {
      toast.error(`El método de pago ${type} ya está agregado`);
      return;
    }

    setPaymentMethods([...paymentMethods, { method: type, amount: 0 }]);
  };

  const handleRemovePaymentMethod = (index: number) => {
    const newMethods = [...paymentMethods];
    const removedAmount = newMethods[index].amount;
    newMethods.splice(index, 1);
    
    // Update remaining amount
    setRemainingAmount(prev => prev + removedAmount);
    
    // Make sure we always have at least one payment method
    if (newMethods.length === 0) {
      newMethods.push({ method: 'cash', amount: 0 });
    }
    
    setPaymentMethods(newMethods);
  };

  const handleAmountChange = (index: number, amount: number) => {
    const newMethods = [...paymentMethods];
    const previousAmount = newMethods[index].amount;
    newMethods[index].amount = amount;
    
    // Calculate new remaining amount
    let newRemainingAmount = remainingAmount - (amount - previousAmount);
    
    // If this is the only payment method, adjust it to match the total
    if (newMethods.length === 1) {
      newMethods[index].amount = total;
      newRemainingAmount = 0;
    }
    
    setPaymentMethods(newMethods);
    setRemainingAmount(newRemainingAmount);
  };

  const handleComplete = () => {
    if (remainingAmount > 0) {
      toast.error(`Falta por cubrir: ${formatCurrency(remainingAmount)}`);
      return;
    }
    
    if (remainingAmount < 0) {
      toast.error(`El monto excede al total por: ${formatCurrency(Math.abs(remainingAmount))}`);
      return;
    }
    
    onComplete(paymentMethods);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method as PaymentMethodType) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'transfer':
        return <ArrowUpDown className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentMethodName = (method: string): string => {
    switch (method as PaymentMethodType) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      default: return method;
    }
  };

  const getTotalPaid = () => {
    return paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Métodos de Pago Mixto</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-muted p-3 rounded-md">
            <span className="font-semibold">Total a Pagar:</span>
            <span className="text-lg font-bold">{formatCurrency(total)}</span>
          </div>
          
          {paymentMethods.map((method, index) => (
            <Card key={index} className="p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(method.method)}
                  <span className="font-medium">{getPaymentMethodName(method.method)}</span>
                </div>
                {paymentMethods.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemovePaymentMethod(index)}
                    className="h-7 w-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`amount-${index}`} className="w-20">Monto:</Label>
                <Input
                  id={`amount-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={method.amount}
                  onChange={(e) => handleAmountChange(index, parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
              </div>
            </Card>
          ))}
          
          <div className="flex justify-center gap-2">
            {!paymentMethods.some(m => m.method === 'cash') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAddPaymentMethod('cash')}
                className="flex items-center gap-1"
              >
                <DollarSign className="h-4 w-4" />
                Efectivo
              </Button>
            )}
            
            {!paymentMethods.some(m => m.method === 'card') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAddPaymentMethod('card')}
                className="flex items-center gap-1"
              >
                <CreditCard className="h-4 w-4" />
                Tarjeta
              </Button>
            )}
            
            {!paymentMethods.some(m => m.method === 'transfer') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAddPaymentMethod('transfer')}
                className="flex items-center gap-1"
              >
                <ArrowUpDown className="h-4 w-4" />
                Transferencia
              </Button>
            )}
          </div>
          
          {remainingAmount !== 0 && (
            <Alert variant={remainingAmount > 0 ? "destructive" : "default"}>
              <AlertDescription>
                {remainingAmount > 0 
                  ? `Falta por cubrir: ${formatCurrency(remainingAmount)}` 
                  : `Sobrepasa el total por: ${formatCurrency(Math.abs(remainingAmount))}`}
              </AlertDescription>
            </Alert>
          )}
          
          <div className={cn(
            "flex justify-between items-center p-3 rounded-md",
            remainingAmount === 0 ? "bg-green-100 dark:bg-green-900/20" : "bg-muted"
          )}>
            <div className="flex items-center gap-2">
              {remainingAmount === 0 && <CheckCircle className="h-4 w-4 text-green-600" />}
              <span className="font-semibold">Total Pagado:</span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              remainingAmount === 0 ? "text-green-600" : ""
            )}>
              {formatCurrency(getTotalPaid())}
            </span>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleComplete} 
            disabled={remainingAmount !== 0}
          >
            Confirmar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodsMixedDialog;
