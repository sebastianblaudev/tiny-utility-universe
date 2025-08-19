import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Banknote, ArrowRightLeft, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import CompleteSaleModal from "./CompleteSaleModal";
import usePrintReceipt from '@/hooks/usePrintReceipt';

type PaymentMethod = 'cash' | 'card' | 'transfer';

interface PaymentMethodDialogProps {
  open: boolean;
  onClose: () => void;
  onPaymentSelect: (method: PaymentMethod) => void;
  total: number;
  saleId?: string;
  printReceipt?: boolean;
}

export function PaymentMethodDialog({ 
  open, 
  onClose, 
  onPaymentSelect,
  total,
  saleId,
  printReceipt = true
}: PaymentMethodDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const { printReceiptDirectly, PrintReceiptModal } = usePrintReceipt();

  useEffect(() => {
    if (!open) {
      setSelectedMethod(null);
    }
  }, [open]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleConfirm = async () => {
    if (selectedMethod) {
      onPaymentSelect(selectedMethod);
      
      // Call onPaymentSelect without success toast
      
      // Print receipt directly if enabled and saleId exists
      if (printReceipt && saleId) {
        try {
          await printReceiptDirectly(saleId);
          onClose(); // Close dialog after printing
        } catch (error) {
          console.error("Error printing receipt:", error);
          // Show the completion modal instead if direct printing fails
          setTimeout(() => {
            setShowCompletedModal(true);
          }, 300);
        }
      } else {
        onClose();
      }
    }
  };

  const handleNewSale = () => {
    // This would typically reset the cart/sale state
    toast.info("Iniciando nueva venta");
    // Any additional reset logic would go here
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              Seleccionar método de pago
            </DialogTitle>
          </DialogHeader>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-2xl sm:text-3xl font-bold text-center my-4 p-3 bg-primary/10 rounded-lg border border-primary/20"
          >
            Total: <span className="text-primary">${total.toLocaleString('es-CL')}</span>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-3 gap-4 py-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Button
                onClick={() => handleMethodSelect('cash')}
                variant={selectedMethod === 'cash' ? 'default' : 'outline'}
                className="flex flex-col items-center justify-center p-4 h-auto transition-all duration-300"
              >
                <Banknote className={`h-8 w-8 mb-2 transition-all duration-300 ${
                  selectedMethod === 'cash' ? 'animate-pulse' : ''
                }`} />
                <span>Efectivo</span>
              </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                onClick={() => handleMethodSelect('card')}
                variant={selectedMethod === 'card' ? 'default' : 'outline'}
                className="flex flex-col items-center justify-center p-4 h-auto transition-all duration-300"
              >
                <CreditCard className={`h-8 w-8 mb-2 transition-all duration-300 ${
                  selectedMethod === 'card' ? 'animate-pulse' : ''
                }`} />
                <span>Tarjeta</span>
              </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                onClick={() => handleMethodSelect('transfer')}
                variant={selectedMethod === 'transfer' ? 'default' : 'outline'}
                className="flex flex-col items-center justify-center p-4 h-auto transition-all duration-300"
              >
                <ArrowRightLeft className={`h-8 w-8 mb-2 transition-all duration-300 ${
                  selectedMethod === 'transfer' ? 'animate-pulse' : ''
                }`} />
                <span>Transferencia</span>
              </Button>
            </motion.div>
          </motion.div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={handleConfirm} 
                disabled={!selectedMethod}
                className={`relative overflow-hidden bg-[#22c55e] hover:bg-[#22c55e]/90 text-white ${!selectedMethod ? 'opacity-50' : 'shadow-md'}`}
              >
                {selectedMethod && (
                  <motion.span 
                    className="absolute inset-0 bg-white/20"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                  />
                )}
                Confirmar pago
                {selectedMethod && <CheckCircle2 className="ml-2 h-4 w-4" />}
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New completion modal */}
      <CompleteSaleModal 
        isOpen={showCompletedModal}
        onClose={() => setShowCompletedModal(false)}
        saleId={saleId}
        onNewSale={handleNewSale}
      />

      {/* Include PrintReceiptModal component */}
      <PrintReceiptModal />
    </>
  );
}
