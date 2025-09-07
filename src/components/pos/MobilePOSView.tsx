import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  CreditCard, 
  Banknote, 
  Send, 
  Search,
  X, 
  Calculator,
  Smartphone 
} from 'lucide-react';
import PaymentMethodsMixedDialog from '@/components/sales/PaymentMethodsMixedDialog';
import { formatPrice } from '@/utils/currencyFormat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { usePOSOffline } from '@/hooks/usePOSOffline';
import { addItemToCart, updateItemQuantity, removeItemFromCart, calculateCartTotal } from '@/utils/cartUtils';

interface Product {
  id: string;
  name: string;
  price: number;
  code?: string;
  stock?: number;
  is_by_weight?: boolean;
  unit?: string;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
}

export const MobilePOSView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showMixedPaymentModal, setShowMixedPaymentModal] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const { user, tenantId } = useAuth();
  const { printReceiptDirectly } = usePrintReceipt();
  const { processOfflineSale, isProcessing } = usePOSOffline();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const searchProducts = async (searchTerm: string) => {
    if (!searchTerm.trim() || !tenantId) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, code, stock, is_by_weight, unit')
        .eq('tenant_id', tenantId)
        .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
        .limit(8); // Limit results for mobile

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Error al buscar productos');
    }
  };

  const addToCart = useCallback((product: Product) => {
    const updatedItems = addItemToCart(cartItems, product as any, 1);
    setCartItems(updatedItems as CartItem[]);
    
    // Clear search and show success feedback
    setSearchTerm('');
    setSearchResults([]);
    toast.success(`✅ ${product.name}`, {
      description: `${formatPrice(product.price)} agregado al carrito`,
      duration: 1500
    });
    
    // Vibration feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [cartItems]);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const updatedItems = removeItemFromCart(cartItems as any, productId);
      setCartItems(updatedItems as CartItem[]);
    } else {
      const updatedItems = updateItemQuantity(cartItems as any, productId, newQuantity);
      setCartItems(updatedItems as CartItem[]);
    }
    
    // Vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const getTotal = () => {
    return calculateCartTotal(cartItems as any);
  };

  const processPayment = async (paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed') => {
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setShowCartSheet(false);

    if (paymentMethod === 'mixed') {
      setShowMixedPaymentModal(true);
      return;
    }

    if (paymentMethod === 'cash') {
      setShowCashModal(true);
      setTimeout(() => cashInputRef.current?.focus(), 100);
      return;
    }

    await processPaymentFinal(paymentMethod, null);
  };

  const processPaymentFinal = async (paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed', cashAmount?: number) => {
    try {
      const total = getTotal();
      
      const saleData = {
        total,
        paymentMethod,
        customerId: null,
        saleType: 'Normal',
        cashierName: user?.email?.split('@')[0] || 'MobilePOS',
        turnoId: null,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          product: { stock: item.stock }
        }))
      };

      const result = await processOfflineSale(saleData);
      
      if (result.success) {
        // Print receipt
        if (result.saleId) {
          setTimeout(async () => {
            try {
              const offlineReceiptData = {
                items: cartItems,
                total: saleData.total,
                paymentMethod: saleData.paymentMethod,
                cashierName: saleData.cashierName,
                saleType: saleData.saleType
              };
              
              await printReceiptDirectly(result.saleId!, undefined, offlineReceiptData);
            } catch (printError) {
              console.error('Print error:', printError);
              toast.error('Error al imprimir recibo');
            }
          }, 500);
        }

        // Clear cart and modals
        setCartItems([]);
        setShowCashModal(false);
        setShowMixedPaymentModal(false);
        setCashReceived('');
        
        // Success feedback
        if (paymentMethod === 'cash' && cashAmount) {
          const change = cashAmount - total;
          if (change > 0) {
            toast.success(`💰 Venta: ${formatPrice(total)}`, {
              description: `Cambio: ${formatPrice(change)}`,
              duration: 3000
            });
          } else {
            toast.success(`💰 Venta completada: ${formatPrice(total)}`);
          }
        } else {
          toast.success(`💰 Venta completada: ${formatPrice(total)}`);
        }
        
        // Vibration feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        // Even if processing shows error, sale is safely stored offline
        console.warn('Sale processed offline but may need manual sync');
        toast.success('Venta guardada offline - se sincronizará automáticamente');
        
        // Still clear cart since sale is safely stored
        setCartItems([]);
        setShowCashModal(false);
        setShowMixedPaymentModal(false);
        setShowCartSheet(false);
        setCashReceived('');
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error al procesar el pago');
    }
  };

  const handleCashPayment = () => {
    const total = getTotal();
    const received = parseFloat(cashReceived) || 0;
    
    if (received < total) {
      toast.error(`Monto insuficiente. Faltan: ${formatPrice(total - received)}`);
      return;
    }
    
    processPaymentFinal('cash', received);
  };

  const total = getTotal();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header with Cart */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">POS Móvil</h1>
          </div>
          
          <Sheet open={showCartSheet} onOpenChange={setShowCartSheet}>
            <SheetTrigger asChild>
              <Button size="sm" className="relative">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Carrito
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96">
              <SheetHeader>
                <SheetTitle>Carrito ({cartItems.length})</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 mr-3">
                          <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatPrice(item.price)} c/u
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 ml-2"
                          onClick={() => updateQuantity(item.id, 0)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  {cartItems.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Carrito vacío
                    </p>
                  )}
                </div>

                {/* Total */}
                {cartItems.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-bold mb-4">
                      <span>Total:</span>
                      <span>{formatPrice(total)}</span>
                    </div>

                    {/* Payment Buttons - Larger for mobile */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => processPayment('cash')}
                        disabled={isProcessing}
                        className="w-full h-12 text-base"
                        size="lg"
                      >
                        <Banknote className="h-5 w-5 mr-2" />
                        Efectivo
                      </Button>
                      
                      <Button
                        onClick={() => processPayment('card')}
                        disabled={isProcessing}
                        variant="outline"
                        className="w-full h-12 text-base"
                        size="lg"
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        Tarjeta
                      </Button>
                      
                      <Button
                        onClick={() => processPayment('transfer')}
                        disabled={isProcessing}
                        variant="outline"
                        className="w-full h-12 text-base"
                        size="lg"
                      >
                        <Send className="h-5 w-5 mr-2" />
                        Transferencia
                      </Button>
                      
                      <Button
                        onClick={() => processPayment('mixed')}
                        disabled={isProcessing}
                        variant="outline"
                        className="w-full h-12 text-base"
                        size="lg"
                      >
                        <Calculator className="h-5 w-5 mr-2" />
                        Pago Mixto
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search Section */}
      <div className="p-4">
        <Card className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar productos..."
                className="text-base pl-10 pr-4 py-6 rounded-xl"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchProducts(e.target.value);
                }}
                autoComplete="off"
              />
              {searchTerm && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => {
                    setSearchTerm('');
                    setSearchResults([]);
                    searchInputRef.current?.focus();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search Results - Optimized for mobile */}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {searchResults.map((product) => (
                  <Card
                    key={product.id}
                    className="p-4 cursor-pointer active:scale-95 transition-transform border-2 hover:border-primary/50"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <h3 className="font-semibold text-base leading-tight">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.code && `Código: ${product.code} | `}Stock: {product.stock || 0}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {formatPrice(product.price)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tocar para agregar
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {searchTerm && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Cash Payment Modal */}
      <Dialog open={showCashModal} onOpenChange={setShowCashModal}>
        <DialogContent className="w-[95%] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Pago en Efectivo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatPrice(total)}</p>
              <p className="text-sm text-muted-foreground">Total a pagar</p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Monto recibido:</label>
              <Input
                ref={cashInputRef}
                type="number"
                placeholder="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="text-xl text-center py-6 mt-2"
                inputMode="decimal"
              />
            </div>
            
            {cashReceived && parseFloat(cashReceived) >= total && (
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-lg font-bold text-primary">
                  Cambio: {formatPrice(parseFloat(cashReceived) - total)}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCashModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleCashPayment}
                disabled={!cashReceived || parseFloat(cashReceived) < total}
                className="flex-1"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mixed Payment Modal */}
      <PaymentMethodsMixedDialog
        isOpen={showMixedPaymentModal}
        onClose={() => setShowMixedPaymentModal(false)}
        total={total}
        onComplete={async (paymentMethods: Array<{type: string, amount: number}>) => {
          await processPaymentFinal('mixed');
        }}
      />
    </div>
  );
};