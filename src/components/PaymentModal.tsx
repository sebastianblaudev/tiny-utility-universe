import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, Wallet, Check, X, Printer, Split } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { openDB } from 'idb';
import { OrderReceipt } from "./OrderReceipt";
import { printElement } from "@/lib/utils";
import { createRoot } from 'react-dom/client';
import { updateIngredientsStock } from "@/pages/Products";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onPaymentComplete: () => void;
  cart: any[];
  orderType: "mesa" | "delivery" | "takeaway";
  activeTable: string | null;
  selectedCustomer: any | null;
}

interface SplitPaymentItem {
  method: 'efectivo' | 'tarjeta' | 'transferencia';
  amount: string;
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  total, 
  onPaymentComplete,
  cart,
  orderType,
  activeTable,
  selectedCustomer
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "transferencia" | "dividido" | null>(null);
  const [amount, setAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPaymentItem[]>([]);
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const { toast } = useToast();
  const [taxSettings, setTaxSettings] = useState<{taxEnabled: boolean, taxPercentage: string}>({
    taxEnabled: true,
    taxPercentage: "16"
  });

  useEffect(() => {
    try {
      const savedTaxSettings = localStorage.getItem("taxSettings");
      if (savedTaxSettings) {
        setTaxSettings(JSON.parse(savedTaxSettings));
      }
    } catch (error) {
      console.error("Error loading tax settings:", error);
    }
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  const calculateTipAmount = () => {
    if (customTip !== '') {
      return parseFloat(customTip);
    }
    return (total * (tipPercentage / 100));
  };

  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => {
      let extrasTotal = 0;
      if (item.extras && Array.isArray(item.extras) && item.extras.length > 0) {
        extrasTotal = item.extras.reduce((s: number, ext: any) => s + (ext.price ? ext.price : 0), 0);
      }
      const unitary = item.price + extrasTotal;
      return sum + unitary * item.quantity;
    }, 0);
  };

  const cartTotal = calculateCartTotal();
  const taxPercentage = taxSettings.taxEnabled ? parseFloat(taxSettings.taxPercentage) / 100 : 0;
  const subtotal = cartTotal;
  const taxAmount = subtotal * taxPercentage;
  const finalTotal = subtotal + taxAmount + calculateTipAmount();

  const handleSplitPaymentAdd = () => {
    setSplitPayments([...splitPayments, { method: 'efectivo', amount: '' }]);
  };

  const updateSplitPayment = (index: number, field: keyof SplitPaymentItem, value: string) => {
    const newSplitPayments = [...splitPayments];
    if (field === 'method') {
      newSplitPayments[index].method = value as 'efectivo' | 'tarjeta' | 'transferencia';
    } else {
      newSplitPayments[index].amount = value;
    }
    setSplitPayments(newSplitPayments);
  };

  const validateSplitPayments = () => {
    const totalPaid = splitPayments.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
    return Math.abs(totalPaid - total) < 0.01; // Check if total matches within a small margin
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    
    try {
      const orderId = `order-${Date.now()}`;
      const tipAmount = calculateTipAmount();
      
      const newOrder = {
        id: orderId,
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || null,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          size: item.size || null
        })),
        total: finalTotal,
        subtotal: subtotal,
        taxPercentage: taxSettings.taxEnabled ? parseFloat(taxSettings.taxPercentage) : 0,
        tip: tipAmount,
        orderType: orderType,
        tableNumber: orderType === 'mesa' ? activeTable : undefined,
        status: 'completed',
        createdAt: new Date(),
        paymentMethod: paymentMethod,
        ...(paymentMethod === 'dividido' && {
          paymentSplits: splitPayments.map(split => ({
            method: split.method,
            amount: parseFloat(split.amount)
          }))
        })
      };

      const db = await openDB('pizzaPos', 4);
      if (!db) {
        console.error("No se pudo abrir la base de datos");
        toast({
          title: "Error",
          description: "No se pudo procesar el pago. Error en la base de datos.",
          variant: "destructive"
        });
        setProcessingPayment(false);
        return;
      }
      await db.add('orders', newOrder);

      const stockUpdatePromises = cart.map(async (item) => {
        console.log(`Procesando producto: ${item.name} (${item.id}), cantidad: ${item.quantity}`);
        const result = await updateIngredientsStock(item.id, item.quantity);
        if (!result) {
          console.warn(`No se pudo actualizar el stock para producto: ${item.name}`);
        }
        return result;
      });
      
      await Promise.allSettled(stockUpdatePromises);

      if (orderType === 'mesa' && activeTable) {
        const tableTx = db.transaction('tables', 'readwrite');
        const tableStore = tableTx.objectStore('tables');
        const table = await tableStore.get(activeTable);
        
        if (table) {
          table.status = 'free';
          table.currentOrderId = null;
          await tableStore.put(table);
        }
      }

      if (selectedCustomer) {
        const customerTx = db.transaction('customers', 'readwrite');
        const customerStore = customerTx.objectStore('customers');
        const customer = await customerStore.get(selectedCustomer.id);
        
        if (customer) {
          customer.orders = [...customer.orders, orderId];
          await customerStore.put(customer);
        }
      }

      let printerSettings = { receiptPrinter: "", kitchenPrinter: "" };
      try {
        const savedSettings = localStorage.getItem("receiptSettings");
        if (savedSettings) {
          printerSettings = JSON.parse(savedSettings);
        }
      } catch (error) {
        console.error("Error loading printer settings:", error);
      }

      if (printerSettings.receiptPrinter) {
        console.log(`Enviando recibo a impresora: ${printerSettings.receiptPrinter}`);
      }
      if (printerSettings.kitchenPrinter) {
        console.log(`Enviando comanda a impresora: ${printerSettings.kitchenPrinter}`);
      }
      
      setTimeout(() => {
        const receiptDiv = document.createElement('div');
        const receiptRoot = createRoot(receiptDiv);
        const receiptComponent = <OrderReceipt order={newOrder} receiptType="customer" />;
        receiptRoot.render(receiptComponent);
        
        setTimeout(() => {
          printElement(receiptDiv);
          
          const kitchenDiv = document.createElement('div');
          const kitchenRoot = createRoot(kitchenDiv);
          const kitchenComponent = <OrderReceipt order={newOrder} receiptType="kitchen" />;
          kitchenRoot.render(kitchenComponent);
          
          setTimeout(() => {
            printElement(kitchenDiv);
            
            setProcessingPayment(false);
            setPaymentComplete(true);
            
            toast({
              title: "Pago completado",
              description: "La orden ha sido registrada y el stock actualizado exitosamente.",
            });
            
            setTimeout(() => {
              onPaymentComplete();
              setPaymentComplete(false);
              setPaymentMethod(null);
              setAmount('');
            }, 1500);
          }, 500);
        }, 500);
      }, 1000);
    } catch (error) {
      console.error("Error al guardar la orden:", error);
      setProcessingPayment(false);
      
      toast({
        title: "Error al procesar el pago",
        description: "No se pudo completar la transacción. Intente nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    if (!processingPayment) {
      onClose();
      setPaymentMethod(null);
      setAmount('');
      setPaymentComplete(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#111111] border-[#333333] text-white overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Procesar Pago</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Subtotal: <span className="font-bold text-white">{formatCurrency(cartTotal)}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] max-h-[500px] pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Propina</h3>
              <div className="grid grid-cols-4 gap-2">
                {[0, 10, 15, 20].map((percentage) => (
                  <Button
                    key={percentage}
                    type="button"
                    variant="outline"
                    className={`${
                      tipPercentage === percentage && customTip === ''
                        ? "bg-green-600/20 border-green-500 text-white"
                        : "bg-[#1A1A1A] hover:bg-[#252525] border-[#333333]"
                    }`}
                    onClick={() => {
                      setTipPercentage(percentage);
                      setCustomTip('');
                    }}
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
              <div className="mt-2">
                <label className="text-sm text-gray-400">Propina personalizada</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    $
                  </span>
                  <Input
                    type="number"
                    className="pl-7 bg-[#1A1A1A] border-[#333333] focus:border-orange-500 text-white"
                    placeholder="0.00"
                    value={customTip}
                    onChange={(e) => {
                      setCustomTip(e.target.value);
                      setTipPercentage(0);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[#333333] pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Propina:</span>
                <span>{formatCurrency(calculateTipAmount())}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total Final:</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Método de pago</h3>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full py-6 ${
                      paymentMethod === "efectivo"
                        ? "bg-green-600/20 border-green-500 text-white"
                        : "bg-[#1A1A1A] hover:bg-[#252525] border-[#333333]"
                    }`}
                    onClick={() => {
                      setPaymentMethod("efectivo");
                      setSplitPayments([]);
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <Banknote className="h-5 w-5 mb-1" />
                      <span>Efectivo</span>
                    </div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full py-6 ${
                      paymentMethod === "tarjeta"
                        ? "bg-green-600/20 border-green-500 text-white"
                        : "bg-[#1A1A1A] hover:bg-[#252525] border-[#333333]"
                    }`}
                    onClick={() => {
                      setPaymentMethod("tarjeta");
                      setSplitPayments([]);
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <CreditCard className="h-5 w-5 mb-1" />
                      <span>Tarjeta</span>
                    </div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full py-6 ${
                      paymentMethod === "transferencia"
                        ? "bg-green-600/20 border-green-500 text-white"
                        : "bg-[#1A1A1A] hover:bg-[#252525] border-[#333333]"
                    }`}
                    onClick={() => {
                      setPaymentMethod("transferencia");
                      setSplitPayments([]);
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <Wallet className="h-5 w-5 mb-1" />
                      <span>Transferencia</span>
                    </div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full py-6 ${
                      paymentMethod === "dividido"
                        ? "bg-green-600/20 border-green-500 text-white"
                        : "bg-[#1A1A1A] hover:bg-[#252525] border-[#333333]"
                    }`}
                    onClick={() => {
                      setPaymentMethod("dividido");
                      setAmount('');
                      setSplitPayments([{ method: 'efectivo', amount: '' }]);
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <Split className="h-5 w-5 mb-1" />
                      <span>Pago Dividido</span>
                    </div>
                  </Button>
                </motion.div>
              </div>
            </div>

            {paymentMethod === "efectivo" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Monto recibido</h3>
                  {parseFloat(amount) > 0 && (
                    <Badge
                      className={
                        parseFloat(amount) >= total
                          ? "bg-green-600"
                          : "bg-orange-600"
                      }
                    >
                      Cambio: {formatCurrency(parseFloat(amount) - total)}
                    </Badge>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    $
                  </span>
                  <Input
                    type="number"
                    className="pl-7 bg-[#1A1A1A] border-[#333333] focus:border-orange-500 text-white"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </motion.div>
            )}

            {paymentMethod === "dividido" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {splitPayments.map((split, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      className="flex-1 bg-[#1A1A1A] border-[#333333] rounded-md p-2 text-white"
                      value={split.method}
                      onChange={(e) => updateSplitPayment(index, 'method', e.target.value)}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                    <Input
                      type="number"
                      className="flex-1 bg-[#1A1A1A] border-[#333333] text-white"
                      placeholder="Monto"
                      value={split.amount}
                      onChange={(e) => updateSplitPayment(index, 'amount', e.target.value)}
                    />
                  </div>
                ))}
                
                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSplitPaymentAdd}
                    className="bg-[#1A1A1A] hover:bg-[#252525] border-[#333333]"
                  >
                    Agregar método
                  </Button>
                  <div className="text-sm">
                    Total ingresado: {formatCurrency(splitPayments.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0))}
                  </div>
                </div>
                <div className="text-right text-base font-semibold py-1">
                  <span className={
                    Math.abs(
                      (splitPayments.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0)) - total
                    ) < 0.009
                      ? "text-green-500"
                      : "text-orange-400"
                  }>
                    {(() => {
                      const falta = total - splitPayments.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
                      if (falta > 0.009) {
                        return `Falta por pagar: ${formatCurrency(falta)}`;
                      } else if (falta < -0.009) {
                        return `Exceso ingresado: ${formatCurrency(Math.abs(falta))}`;
                      } else {
                        return `Pago completo`;
                      }
                    })()}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          {!processingPayment && !paymentComplete && (
            <>
              <Button
                variant="outline"
                className="bg-[#1A1A1A] hover:bg-[#252525] border-[#333333]"
                onClick={handleClose}
                disabled={processingPayment}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handlePayment}
                disabled={
                  !paymentMethod ||
                  (paymentMethod === "efectivo" && (!amount || parseFloat(amount) < total)) ||
                  (paymentMethod === "dividido" && !validateSplitPayments()) ||
                  processingPayment
                }
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600"
              >
                {processingPayment ? (
                  <span className="flex items-center">
                    <Printer className="h-4 w-4 mr-2 animate-pulse" />
                    Procesando...
                  </span>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Pago
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
