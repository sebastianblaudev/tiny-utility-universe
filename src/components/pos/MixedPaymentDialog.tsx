
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentMethod, SplitPayment } from "@/types";
import { DollarSign, CreditCard, ArrowLeftRight, Plus, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguageCurrency } from "@/hooks/useLanguageCurrency";

interface MixedPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (payments: SplitPayment[]) => void;
}

const MixedPaymentDialog = ({ 
  open, 
  onClose, 
  totalAmount, 
  onConfirm 
}: MixedPaymentDialogProps) => {
  const [payments, setPayments] = useState<SplitPayment[]>([]);
  const [remainingAmount, setRemainingAmount] = useState(totalAmount);
  const [currentAmount, setCurrentAmount] = useState<number | "">("");
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod.CASH | PaymentMethod.CARD | PaymentMethod.TRANSFER>(PaymentMethod.CASH);
  const { formatCurrency, getText, config } = useLanguageCurrency();

  // Reset state when dialog opens or total changes
  useEffect(() => {
    if (open) {
      setPayments([]);
      setRemainingAmount(totalAmount);
      setCurrentAmount("");
      setCurrentMethod(PaymentMethod.CASH);
    }
  }, [open, totalAmount]);

  // Helper function to get payment method icon
  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return <DollarSign className="h-5 w-5" />;
      case PaymentMethod.CARD:
        return <CreditCard className="h-5 w-5" />;
      case PaymentMethod.TRANSFER:
        return <ArrowLeftRight className="h-5 w-5" />;
      default:
        return null;
    }
  };

  // Helper function to get payment method name
  const getPaymentName = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return getText("Efectivo", "Cash");
      case PaymentMethod.CARD:
        return getText("Tarjeta", "Card");
      case PaymentMethod.TRANSFER:
        return getText("Transferencia", "Transfer");
      default:
        return getText("Desconocido", "Unknown");
    }
  };

  // Add a payment method to the list
  const addPayment = () => {
    if (currentAmount === "" || Number(currentAmount) <= 0) return;
    
    const amount = Number(currentAmount);
    
    // Don't allow adding more than the remaining amount
    if (amount > remainingAmount) {
      setCurrentAmount(remainingAmount);
      return;
    }
    
    const newPayment: SplitPayment = {
      method: currentMethod,
      amount
    };
    
    setPayments([...payments, newPayment]);
    setRemainingAmount(prev => Number((prev - amount).toFixed(config.decimals)));
    setCurrentAmount("");
  };

  // Remove a payment from the list
  const removePayment = (index: number) => {
    const removed = payments[index];
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
    setRemainingAmount(prev => Number((prev + removed.amount).toFixed(config.decimals)));
  };

  // Handle confirmation - only if all amount has been allocated
  const handleConfirm = () => {
    if (remainingAmount === 0) {
      onConfirm(payments);
      onClose();
    }
  };

  // Use remaining amount for current payment
  const useRemainingAmount = () => {
    setCurrentAmount(remainingAmount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{getText("Pago Mixto", "Mixed Payment")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex justify-between items-center bg-slate-100 p-3 rounded-md">
            <span>{getText("Total a pagar:", "Total to pay:")}</span>
            <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
          </div>
          
          {/* Payments list */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">{getText("Métodos añadidos:", "Added methods:")}</p>
              {payments.map((payment, index) => (
                <Card key={index} className="bg-muted">
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getPaymentIcon(payment.method)}
                      <span>{getPaymentName(payment.method)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removePayment(index)}
                        className="h-8 w-8 rounded-full text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Remaining amount */}
          <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md">
            <span>{getText("Pendiente:", "Pending:")}</span>
            <span className={`font-bold text-lg ${remainingAmount === 0 ? 'text-green-600' : 'text-blue-600'}`}>
              {formatCurrency(remainingAmount)}
            </span>
          </div>
          
          {/* Add new payment method */}
          {remainingAmount > 0 && (
            <div className="border p-3 rounded-md space-y-3">
              <p className="font-medium">{getText("Añadir método de pago:", "Add payment method:")}</p>
              
              {/* Payment method selection */}
              <div className="flex gap-2">
                {[PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.TRANSFER].map((method) => (
                  <Button
                    key={method}
                    variant={currentMethod === method ? "default" : "outline"}
                    className={currentMethod === method ? "bg-barber-600 hover:bg-barber-700" : ""}
                    onClick={() => setCurrentMethod(method as PaymentMethod.CASH | PaymentMethod.CARD | PaymentMethod.TRANSFER)}
                  >
                    {getPaymentIcon(method)}
                    <span className="ml-2">{getPaymentName(method)}</span>
                  </Button>
                ))}
              </div>
              
              {/* Amount input */}
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <DollarSign className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.valueAsNumber || "")}
                    placeholder={getText("Monto", "Amount")}
                    className="pl-8"
                    min={config.decimals === 2 ? "0.01" : "1"}
                    max={remainingAmount}
                    step={config.decimals === 2 ? "0.01" : "1"}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={useRemainingAmount}
                >
                  {getText("Total restante", "Remaining total")}
                </Button>
              </div>
              
              {/* Add payment button */}
              <Button 
                onClick={addPayment}
                disabled={currentAmount === "" || Number(currentAmount) <= 0 || Number(currentAmount) > remainingAmount}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {getText("Añadir Pago", "Add Payment")}
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            {getText("Cancelar", "Cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={remainingAmount > 0}
            className="bg-barber-600 hover:bg-barber-700"
          >
            {getText("Finalizar Pago", "Complete Payment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MixedPaymentDialog;
