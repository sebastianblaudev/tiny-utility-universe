
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, DollarSign, ArrowUpDown, SplitSquareVertical } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import PaymentMethodsMixedDialog from './PaymentMethodsMixedDialog';
import { MixedPaymentType } from '@/integrations/supabase/client';

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentMethodSelected: (method: string) => void;
  onMixedPaymentSelected: (methods: MixedPaymentType[]) => void;
  total: number;
}

const PaymentMethodDialog: React.FC<PaymentMethodDialogProps> = ({
  isOpen,
  onClose,
  onPaymentMethodSelected,
  onMixedPaymentSelected,
  total,
}) => {
  const [enteredAmount, setEnteredAmount] = useState<number | string>('');
  const [showMixedPayment, setShowMixedPayment] = useState(false);
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnteredAmount(e.target.value);
  };

  const calculateChange = (): number => {
    if (!enteredAmount) return 0;
    const amount = typeof enteredAmount === 'string' ? parseFloat(enteredAmount) : enteredAmount;
    return amount - total;
  };

  const handlePaymentMethodSelect = (method: string) => {
    onPaymentMethodSelected(method);
  };
  
  const handleMixedPayment = () => {
    setShowMixedPayment(true);
  };
  
  const handleMixedPaymentComplete = (methods: MixedPaymentType[]) => {
    setShowMixedPayment(false);
    onMixedPaymentSelected(methods);
  };

  return (
    <>
      <Dialog open={isOpen && !showMixedPayment} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Método de Pago</DialogTitle>
            <DialogDescription>
              Seleccione el método de pago para esta venta
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-md">
              <span className="font-semibold">Total a pagar:</span>
              <span className="text-xl font-bold">{formatCurrency(total)}</span>
            </div>
            
            {/* Cash payment with change calculation */}
            <Card className="p-4 hover:border-primary cursor-pointer" onClick={() => handlePaymentMethodSelect('cash')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Efectivo</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="cash-amount">Recibido:</Label>
                <Input
                  id="cash-amount"
                  type="number"
                  min={total}
                  step="0.01"
                  className="flex-1"
                  value={enteredAmount}
                  onChange={handleAmountChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              {calculateChange() > 0 && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-right">
                  <span className="font-medium">Cambio: {formatCurrency(calculateChange())}</span>
                </div>
              )}
            </Card>
            
            {/* Card payment */}
            <Card 
              className="p-4 hover:border-primary cursor-pointer flex items-center justify-between"
              onClick={() => handlePaymentMethodSelect('card')}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Tarjeta</span>
              </div>
            </Card>
            
            {/* Bank transfer */}
            <Card 
              className="p-4 hover:border-primary cursor-pointer flex items-center justify-between"
              onClick={() => handlePaymentMethodSelect('transfer')}
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Transferencia</span>
              </div>
            </Card>
            
            {/* Mixed payment */}
            <Card 
              className="p-4 hover:border-primary cursor-pointer flex items-center justify-between"
              onClick={handleMixedPayment}
            >
              <div className="flex items-center gap-2">
                <SplitSquareVertical className="h-5 w-5 text-amber-600" />
                <span className="font-semibold">Pago Mixto</span>
              </div>
            </Card>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Mixed Payment Dialog */}
      <PaymentMethodsMixedDialog 
        isOpen={showMixedPayment}
        onClose={() => setShowMixedPayment(false)}
        onComplete={handleMixedPaymentComplete}
        total={total}
      />
    </>
  );
};

export default PaymentMethodDialog;
