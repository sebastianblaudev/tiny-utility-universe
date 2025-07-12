import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { MixedPaymentType, saveMixedPaymentMethods } from '@/integrations/supabase/client';
import PaymentMethodDialog from './PaymentMethodDialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { sendSaleToSII } from '@/utils/siiChileUtils';

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
  const [siiStatus, setSiiStatus] = useState<{
    sending: boolean;
    success?: boolean;
    message?: string;
    folio?: string;
  }>({ sending: false });
  
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
  
  const handleCompleteSale = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Seleccione un método de pago');
      return;
    }
    
    if (!tenantId) {
      toast.error('Error: No se pudo determinar el ID del negocio');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Complete the sale with the original function
      const saleId = await onSaleComplete(
        isMixedPayment ? 'mixed' : selectedPaymentMethod!,
        isMixedPayment
      );
      
      // If it's a mixed payment and we have a sale ID, save the payment methods
      if (isMixedPayment && mixedPaymentMethods && saleId) {
        const success = await saveMixedPaymentMethods(saleId, mixedPaymentMethods);
        if (!success) {
          toast.error('Error al guardar los métodos de pago mixto');
        }
      }

      // If we have a valid sale ID, send to SII
      if (saleId) {
        const cartItems = window.cartItemsForSII || [];
        
        // Send to SII with only 2 parameters (saleId and tenantId)
        setSiiStatus({ sending: true });
        const siiResult = await sendSaleToSII(saleId, tenantId);
        
        if (siiResult.success) {
          setSiiStatus({ 
            sending: false, 
            success: true, 
            message: siiResult.message,
            folio: siiResult.folio
          });
          
          toast.success(`Venta enviada a SII. Folio: ${siiResult.folio}`);
        } else {
          setSiiStatus({ 
            sending: false, 
            success: false, 
            message: siiResult.message 
          });
          
          toast.error(siiResult.message || 'Error enviando venta a SII');
        }
      }
      
      // Reset the state
      setSelectedPaymentMethod(null);
      setMixedPaymentMethods(null);
      setIsMixedPayment(false);
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error('Error al completar la venta');
      setSiiStatus({ 
        sending: false, 
        success: false, 
        message: `Error: ${(error as Error).message}` 
      });
    } finally {
      setIsProcessing(false);
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
            
            {siiStatus.message && (
              <div className={`border rounded-md p-3 mt-2 ${
                siiStatus.success ? 'bg-green-50 border-green-200' : 
                                    'bg-red-50 border-red-200'
              }`}>
                <Label className={`text-sm mb-2 block ${
                  siiStatus.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  Estado SII:
                </Label>
                <p className="text-sm">{siiStatus.message}</p>
                {siiStatus.folio && (
                  <p className="text-sm font-medium mt-1">
                    Folio: {siiStatus.folio}
                  </p>
                )}
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
