
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { MixedPaymentType, saveMixedPaymentMethods } from '@/lib/supabase-helpers';
import PaymentMethodDialog from './PaymentMethodDialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

import { agregarTransaccionTurno } from '@/utils/turnosUtils';

interface CompleteSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleComplete: (paymentMethod: string, isMixedPayment: boolean) => Promise<string | null>;
  total: number;
}

const CompleteSaleModal: React.FC<CompleteSaleModalProps> = ({
  isOpen,
  onClose,
  onSaleComplete,
  total,
}) => {
  const { tenantId } = useAuth();
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [mixedPaymentMethods, setMixedPaymentMethods] = useState<MixedPaymentType[] | null>(null);
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSelectPaymentMethod = () => {
    setShowPaymentMethodDialog(true);
  };
  
  const handlePaymentMethodSelected = (method: string) => {
    setSelectedPaymentMethod(method);
    setIsMixedPayment(false);
    setMixedPaymentMethods(null);
    setShowPaymentMethodDialog(false);
  };
  
  const handleMixedPaymentSelected = (methods: MixedPaymentType[]) => {
    setMixedPaymentMethods(methods);
    setIsMixedPayment(true);
    setSelectedPaymentMethod('mixed');
    setShowPaymentMethodDialog(false);
  };
  
  const getPaymentMethodDisplay = () => {
    if (isMixedPayment) {
      return 'Pago Mixto';
    }
    
    switch (selectedPaymentMethod) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      default: return 'No seleccionado';
    }
  };

  // Optimized function to add mixed payment transactions to turno in background
  const addMixedPaymentTransactionsToTurno = async (saleId: string, methods: MixedPaymentType[]) => {
    if (!tenantId) return;

    try {
      // Use cached turno if available to avoid database call
      const cachedTurno = sessionStorage.getItem(`active_turno_${tenantId}`);
      let activeTurno;
      
      if (cachedTurno) {
        activeTurno = JSON.parse(cachedTurno);
      } else {
        const { getTurnoActivo } = await import('@/utils/turnosUtils');
        activeTurno = await getTurnoActivo(tenantId);
        if (activeTurno) {
          sessionStorage.setItem(`active_turno_${tenantId}`, JSON.stringify(activeTurno));
        }
      }
      
      if (activeTurno) {
        // Process all transactions in parallel for speed
        const transactionPromises = methods.map(method => 
          agregarTransaccionTurno({
            turno_id: activeTurno.id,
            tipo: 'venta' as const,
            monto: method.amount,
            metodo_pago: method.method,
            descripcion: `Venta con pago mixto - ${method.method}`,
            venta_id: saleId,
          })
        );
        
        await Promise.allSettled(transactionPromises);
        console.log('Mixed payment transactions added to turno successfully');
      }
    } catch (error) {
      console.error('Error adding mixed payment transactions to turno:', error);
    }
  };
  
  const handleCompleteSale = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Seleccione un método de pago');
      return;
    }
    
    if (!tenantId) {
      toast.error('Error: No se pudo determinar el ID del negocio');
      return;
    }
    
    try {
      // Immediate UI feedback
      setIsProcessing(true);
      
      // Complete the sale with optimized processing
      const saleId = await onSaleComplete(
        isMixedPayment ? 'mixed' : selectedPaymentMethod!,
        isMixedPayment
      );
      
      // Success feedback and immediate modal close
      toast.success('Venta completada exitosamente');
      
      // Reset state immediately
      setSelectedPaymentMethod(null);
      setMixedPaymentMethods(null);
      setIsMixedPayment(false);
      setIsProcessing(false);
      onClose();
      
      // Background operations - run asynchronously without blocking UI
      if (isMixedPayment && mixedPaymentMethods && saleId) {
        // Use setTimeout to ensure these run after the modal closes
        setTimeout(() => {
          saveMixedPaymentMethods(saleId, mixedPaymentMethods)
            .then(success => {
              if (success) {
                addMixedPaymentTransactionsToTurno(saleId, mixedPaymentMethods)
                  .catch(error => console.warn('Background turno update failed:', error));
              }
            })
            .catch(error => console.warn('Background mixed payment save failed:', error));
        }, 0);
      }
      
    } catch (error) {
      setIsProcessing(false);
      console.error('Error completing sale:', error);
      toast.error('Error al completar la venta');
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Completar Venta</DialogTitle>
            <DialogDescription>
              Confirme los detalles de la venta antes de finalizar
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-md mb-2">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold">{formatCurrency(total)}</span>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-method" className="text-right">
                Método de Pago:
              </Label>
              <div className="col-span-3">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={handleSelectPaymentMethod}
                >
                  {selectedPaymentMethod 
                    ? getPaymentMethodDisplay()
                    : 'Seleccionar método de pago'}
                </Button>
              </div>
            </div>
            
            {/* Display mixed payment details if applicable */}
            {isMixedPayment && mixedPaymentMethods && (
              <div className="border rounded-md p-3 mt-2">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Detalles de Pago Mixto:
                </Label>
                {mixedPaymentMethods.map((method, index) => (
                  <div key={index} className="flex justify-between text-sm mb-1">
                    <span>
                      {method.method === 'cash' ? 'Efectivo' : 
                       method.method === 'card' ? 'Tarjeta' : 
                       method.method === 'transfer' ? 'Transferencia' : 
                       method.method}:
                    </span>
                    <span className="font-medium">{formatCurrency(method.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCompleteSale} 
              disabled={!selectedPaymentMethod || isProcessing}
              className="ml-2"
            >
              {isProcessing ? 'Procesando...' : 'Completar Venta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <PaymentMethodDialog
        isOpen={showPaymentMethodDialog}
        onClose={() => setShowPaymentMethodDialog(false)}
        onPaymentMethodSelected={handlePaymentMethodSelected}
        onMixedPaymentSelected={handleMixedPaymentSelected}
        total={total}
      />
    </>
  );
};

export default CompleteSaleModal;
