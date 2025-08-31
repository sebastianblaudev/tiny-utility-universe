import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Minus, Plus, CreditCard, Banknote, Send, ArrowLeft, Calculator, CreditCard as MixedIcon } from 'lucide-react';
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

interface FastPOSViewProps {
  onClose: () => void;
}

export const FastPOSView: React.FC<FastPOSViewProps> = ({ onClose }) => {
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showMixedPaymentModal, setShowMixedPaymentModal] = useState(false);
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
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Error al buscar productos');
    }
  };

  const addToCart = useCallback((product: Product) => {
    console.log('📦 Agregando al carrito:', product.name, 'Carrito actual:', cartItems.length);
    const updatedItems = addItemToCart(cartItems, product as any, 1);
    setCartItems(updatedItems as CartItem[]);
    console.log('📦 Carrito actualizado:', updatedItems.length);
    
    // Clear search results and refocus
    setSearchResults([]);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [cartItems]);

  const handleBarcodeScanned = useCallback(async (scannedCode: string) => {
    if (!tenantId) return;

    console.log('🔍 Escaneando código:', scannedCode, 'Carrito actual:', cartItems.length);

    try {
      // Search for product by barcode (try exact match first, then partial)
      let { data, error } = await supabase
        .from('products')
        .select('id, name, price, code, stock, is_by_weight, unit')
        .eq('tenant_id', tenantId)
        .eq('code', scannedCode)
        .maybeSingle();

      // If no exact match, try partial match (some barcodes might have variations)
      if (!data && !error) {
        const { data: partialData, error: partialError } = await supabase
          .from('products')
          .select('id, name, price, code, stock, is_by_weight, unit')
          .eq('tenant_id', tenantId)
          .ilike('code', `%${scannedCode}%`)
          .limit(1)
          .maybeSingle();
        
        data = partialData;
        error = partialError;
      }

      if (error || !data) {
        console.log('❌ Producto no encontrado para código:', scannedCode);
        toast.error("Código no encontrado", {
          description: `No se encontró un producto con el código: ${scannedCode}`
        });
        return;
      }

      console.log('✅ Producto encontrado:', data.name);
      
      // Add product to cart immediately
      addToCart(data);
      toast.success(`✅ Agregado: ${data.name}`, {
        description: `Precio: ${formatPrice(data.price)}`
      });
      
    } catch (error) {
      console.error('Error scanning barcode:', error);
      toast.error('Error al procesar código de barras');
    }
  }, [tenantId, cartItems, addToCart]);

  // Global barcode scanner event listener - improved logic
  useEffect(() => {
    let barcodeBuffer = '';
    let timeout: NodeJS.Timeout | null = null;
    let lastKeyTime = 0;

    const handleGlobalKeyPress = (e: Event) => {
      const keyboardEvent = e as globalThis.KeyboardEvent;
      const currentTime = Date.now();
      
      // Enhanced context detection to prevent interference with forms
      const target = keyboardEvent.target as HTMLElement;
      
      // Check if we're in a context where the scanner should be disabled
      const isInModalDialog = document.querySelector('[data-state="open"][role="dialog"]') !== null;
      const isInProductsPage = window.location.hash.includes('/productos');
      const isInFormElement = target.tagName === 'INPUT' || 
                             target.tagName === 'TEXTAREA' || 
                             target.tagName === 'SELECT' ||
                             target.contentEditable === 'true' ||
                             target.isContentEditable;
      const isInAriaModal = document.querySelector('[aria-modal="true"]') !== null;
      const isInDropdown = document.querySelector('[data-state="open"][role="listbox"]') !== null;
      
      // Disable scanner if any of these conditions are true
      if (isInModalDialog || isInProductsPage || isInFormElement || isInAriaModal || isInDropdown) {
        return;
      }
      
      // Clear previous timeout
      if (timeout) {
        clearTimeout(timeout);
      }

      // Reset buffer if too much time passed between keys (typical for manual typing)
      if (currentTime - lastKeyTime > 200) {
        barcodeBuffer = '';
      }
      lastKeyTime = currentTime;

      // Handle Enter key - process barcode only if we have a decent length code
      if (keyboardEvent.key === 'Enter' && barcodeBuffer.trim().length >= 3) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        const scannedCode = barcodeBuffer.trim();
        
        // Search product by barcode and add to cart immediately
        handleBarcodeScanned(scannedCode);
        
        barcodeBuffer = '';
        
        // Clear search input if it contains the barcode
        if (searchInputRef.current && searchInputRef.current.value === scannedCode) {
          searchInputRef.current.value = '';
          setSearchResults([]);
        }
        return;
      }

      // Add character to buffer (alphanumeric and common barcode chars)
      if (keyboardEvent.key.length === 1 && /[a-zA-Z0-9\-_.]/.test(keyboardEvent.key)) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        barcodeBuffer += keyboardEvent.key;
        
        // Set timeout to clear buffer if no more input comes
        timeout = setTimeout(() => {
          barcodeBuffer = '';
        }, 1500);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleGlobalKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPress);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [handleBarcodeScanned]);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const updatedItems = removeItemFromCart(cartItems as any, productId);
      setCartItems(updatedItems as CartItem[]);
    } else {
      const updatedItems = updateItemQuantity(cartItems as any, productId, newQuantity);
      setCartItems(updatedItems as CartItem[]);
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

    // If mixed payment, show mixed payment modal
    if (paymentMethod === 'mixed') {
      setShowMixedPaymentModal(true);
      return;
    }

    // If cash payment, show modal for change calculation
    if (paymentMethod === 'cash') {
      setShowCashModal(true);
      setTimeout(() => cashInputRef.current?.focus(), 100);
      return;
    }

    await processPaymentFinal(paymentMethod, null);
  };

  const processPaymentFinal = async (paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed', cashAmount?: number, mixedPayments?: Array<{type: string, amount: number}>) => {
    try {
      const total = getTotal();
      
      // Prepare sale data for the optimized processing
      const saleData = {
        total,
        paymentMethod,
        customerId: null,
        saleType: 'Normal',
        cashierName: user?.email?.split('@')[0] || 'FastPOS',
        turnoId: null,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          product: { stock: item.stock }
        }))
      };

      // Use the optimized offline/online processing
      const success = await processOfflineSale(saleData);
      
      if (success) {
        // Print receipt immediately (voucher only, no kitchen command)
        // This will only print the customer receipt, not a kitchen order
        setTimeout(async () => {
          try {
            // Find the latest sale to get the ID for printing
            const { data: latestSale } = await supabase
              .from('sales')
              .select('id')
              .eq('tenant_id', tenantId)
              .order('date', { ascending: false })
              .limit(1)
              .single();
            
            if (latestSale) {
              await printReceiptDirectly(latestSale.id);
            }
          } catch (printError) {
            console.warn('Print warning:', printError);
          }
        }, 500);

        // Clear cart and close modals
        setCartItems([]);
        setShowCashModal(false);
        setShowMixedPaymentModal(false);
        setCashReceived('');
        
        // Show success message with change if applicable
        if (paymentMethod === 'cash' && cashAmount) {
          const change = cashAmount - total;
          if (change > 0) {
            toast.success(`Venta completada: ${formatPrice(total)} | Cambio: ${formatPrice(change)}`);
          } else {
            toast.success(`Venta completada: ${formatPrice(total)}`);
          }
        } else {
          toast.success(`Venta completada: ${formatPrice(total)}`);
        }
        
        // Refocus search
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        toast.error('Error al procesar el pago');
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

  const handleMixedPaymentComplete = async (paymentMethods: Array<{type: string, amount: number}>) => {
    await processPaymentFinal('mixed', undefined, paymentMethods);
  };

  const getChange = () => {
    const total = getTotal();
    const received = parseFloat(cashReceived) || 0;
    return Math.max(0, received - total);
  };

  const total = getTotal();

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al POS Normal
        </Button>
        <h1 className="text-2xl font-bold">POS Rápido</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Section */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Buscar Producto</h2>
              
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  placeholder="Buscar por nombre o código de barras..."
                  className="text-lg p-6"
                  onChange={(e) => searchProducts(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((product) => (
                    <Card
                      key={product.id}
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Código: {product.code} | Stock: {product.stock}
                          </p>
                        </div>
                        <div className="text-lg font-bold">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Carrito ({cartItems.length})</h2>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.price)} c/u
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {cartItems.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Carrito vacío
                </p>
              )}
            </div>
          </Card>

          {/* Total and Payment */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => processPayment('cash')}
                  disabled={cartItems.length === 0 || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Efectivo
                </Button>
                
                <Button
                  onClick={() => processPayment('card')}
                  disabled={cartItems.length === 0 || isProcessing}
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Tarjeta
                </Button>
                
                <Button
                  onClick={() => processPayment('transfer')}
                  disabled={cartItems.length === 0 || isProcessing}
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Transferencia
                </Button>
                
                <Button
                  onClick={() => processPayment('mixed')}
                  disabled={cartItems.length === 0 || isProcessing}
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  <MixedIcon className="h-4 w-4 mr-2" />
                  Pago Dividido
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Cash Payment Modal */}
      <Dialog open={showCashModal} onOpenChange={setShowCashModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Pago en Efectivo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Total a pagar:</div>
              <div className="text-2xl font-bold">{formatPrice(getTotal())}</div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Dinero recibido:</label>
              <Input
                ref={cashInputRef}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="text-lg text-center"
              />
            </div>
            
            {cashReceived && parseFloat(cashReceived) >= getTotal() && (
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-700 mb-1">Cambio a devolver:</div>
                <div className="text-xl font-bold text-green-800">
                  {formatPrice(getChange())}
                </div>
              </div>
            )}
            
            {cashReceived && parseFloat(cashReceived) < getTotal() && (
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm text-red-700 mb-1">Falta:</div>
                <div className="text-xl font-bold text-red-800">
                  {formatPrice(getTotal() - parseFloat(cashReceived))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCashModal(false);
                  setCashReceived('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCashPayment}
                disabled={!cashReceived || parseFloat(cashReceived) < getTotal() || isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Procesando...' : 'Completar Pago'}
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
        onComplete={handleMixedPaymentComplete}
      />
    </div>
  );
};