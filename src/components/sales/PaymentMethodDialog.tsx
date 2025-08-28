
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, ArrowUpDown, SplitSquareVertical, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import PaymentMethodsMixedDialog from './PaymentMethodsMixedDialog';
import { MixedPaymentType } from '@/lib/supabase-helpers';
import cashDrawerService from '@/services/CashDrawerService';
import { useMercadoPagoIntegration } from '@/hooks/useMercadoPagoIntegration';

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
  const [processingMercadoPago, setProcessingMercadoPago] = useState(false);
  const { isConfigured, processPayment, isPaymentMethodEnabled } = useMercadoPagoIntegration();
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnteredAmount(e.target.value);
  };

  const calculateChange = (): number => {
    if (!enteredAmount) return 0;
    const amount = typeof enteredAmount === 'string' ? parseFloat(enteredAmount) : enteredAmount;
    return amount - total;
  };

  const handlePaymentMethodSelect = async (method: string) => {
    // Check if Mercado Pago is configured and this payment method should use it
    if (isConfigured && isPaymentMethodEnabled(method)) {
      await handleMercadoPagoPayment(method);
      return;
    }

    // Si es pago en efectivo, abrir gaveta de dinero
    if (method === 'cash') {
      await cashDrawerService.openCashDrawer();
    }
    
    onPaymentMethodSelected(method);
    // Don't close immediately - let CompleteSaleModal handle the flow
  };

  const handleMercadoPagoPayment = async (method: string) => {
    setProcessingMercadoPago(true);
    try {
      const result = await processPayment({
        amount: total,
        paymentMethod: method,
        description: `Venta POS - ${method}`,
        saleId: `SALE_${Date.now()}`
      });

      if (result.success) {
        onPaymentMethodSelected(`${method}_mp`);
      } else {
        // Fallback to normal payment if MP fails
        if (method === 'cash') {
          await cashDrawerService.openCashDrawer();
        }
        onPaymentMethodSelected(method);
      }
    } catch (error) {
      console.error('Error processing Mercado Pago payment:', error);
      // Fallback to normal payment
      if (method === 'cash') {
        await cashDrawerService.openCashDrawer();
      }
      onPaymentMethodSelected(method);
    } finally {
      setProcessingMercadoPago(false);
    }
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
            <Card className="p-4 hover:border-primary/50 transition-colors relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Efectivo</span>
                  {isConfigured && isPaymentMethodEnabled('cash') && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      MP
                    </Badge>
                  )}
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
                  placeholder={`Mínimo: ${formatCurrency(total)}`}
                />
              </div>
              
              {enteredAmount && calculateChange() >= 0 && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-right">
                  <span className="font-medium">Cambio: {formatCurrency(calculateChange())}</span>
                </div>
              )}
              
              {enteredAmount && calculateChange() < 0 && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-right">
                  <span className="font-medium text-red-600">Cantidad insuficiente</span>
                </div>
              )}
              
              <Button 
                className="w-full mt-3" 
                disabled={!enteredAmount || calculateChange() < 0 || processingMercadoPago}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePaymentMethodSelect('cash');
                }}
              >
                {processingMercadoPago ? 'Procesando...' : 'Confirmar Pago en Efectivo'}
              </Button>
            </Card>
            
            {/* Card payment */}
            <Button 
              variant="outline"
              className="p-4 h-auto justify-start hover:bg-primary/5 relative"
              onClick={() => handlePaymentMethodSelect('card')}
              disabled={processingMercadoPago}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Tarjeta</span>
                {isConfigured && isPaymentMethodEnabled('card') && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    MP
                  </Badge>
                )}
              </div>
            </Button>
            
            {/* Bank transfer */}
            <Button 
              variant="outline"
              className="p-4 h-auto justify-start hover:bg-primary/5 relative"
              onClick={() => handlePaymentMethodSelect('transfer')}
              disabled={processingMercadoPago}
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Transferencia</span>
                {isConfigured && isPaymentMethodEnabled('transfer') && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    MP
                  </Badge>
                )}
              </div>
            </Button>

            {isConfigured && (
              <div className="text-center py-2">
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Integración Mercado Pago Activa
                </Badge>
              </div>
            )}

            {processingMercadoPago && (
              <div className="text-center text-sm text-muted-foreground">
                Procesando pago con Mercado Pago...
              </div>
            )}
            
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
