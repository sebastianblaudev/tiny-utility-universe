import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchBar } from '@/components/SearchBar';
import { ShoppingCart, Minus, Plus, CreditCard, Banknote, Send, ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/utils/currencyFormat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { saveMixedPaymentMethods } from '@/lib/supabase-helpers';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, tenantId } = useAuth();
  const { printReceiptDirectly } = usePrintReceipt();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Global barcode scanner event listener
  useEffect(() => {
    let barcodeBuffer = '';
    let timeout: NodeJS.Timeout | null = null;

    const handleGlobalKeyPress = (e: Event) => {
      const keyboardEvent = e as globalThis.KeyboardEvent;
      
      // Ignore if user is typing in input fields, textareas, or content editable elements
      const target = keyboardEvent.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.isContentEditable
      ) {
        return;
      }

      // Clear previous timeout
      if (timeout) {
        clearTimeout(timeout);
      }

      // Handle Enter key - process barcode
      if (keyboardEvent.key === 'Enter' && barcodeBuffer.trim().length > 0) {
        keyboardEvent.preventDefault();
        const scannedCode = barcodeBuffer.trim();
        
        // Search product by barcode and add to cart immediately
        handleBarcodeScanned(scannedCode);
        
        barcodeBuffer = '';
        return;
      }

      // Add character to buffer (only alphanumeric and some special chars)
      if (keyboardEvent.key.length === 1 && /[a-zA-Z0-9\-_]/.test(keyboardEvent.key)) {
        keyboardEvent.preventDefault();
        barcodeBuffer += keyboardEvent.key;
        
        // Set timeout to clear buffer if no more input comes
        timeout = setTimeout(() => {
          barcodeBuffer = '';
        }, 1000);
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
  }, [tenantId]);

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

  const handleBarcodeScanned = async (scannedCode: string) => {
    if (!tenantId) return;

    try {
      // Search for product by barcode
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, code, stock, is_by_weight, unit')
        .eq('tenant_id', tenantId)
        .eq('code', scannedCode)
        .single();

      if (error || !data) {
        toast.error("Código no encontrado", {
          description: `No se encontró un producto con el código: ${scannedCode}`
        });
        return;
      }

      // Add product to cart immediately
      addToCart(data);
      toast.success(`Producto agregado: ${data.name}`);
      
    } catch (error) {
      console.error('Error scanning barcode:', error);
      toast.error('Error al procesar código de barras');
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(items =>
        items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        )
      );
    } else {
      setCartItems(items => [
        ...items,
        { ...product, quantity: 1, subtotal: product.price }
      ]);
    }
    
    // Clear search results and refocus
    setSearchResults([]);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(items => items.filter(item => item.id !== productId));
    } else {
      setCartItems(items =>
        items.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.price }
            : item
        )
      );
    }
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const processPayment = async (paymentMethod: 'cash' | 'card' | 'transfer') => {
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setIsProcessing(true);
    try {
      const total = getTotal();
      
      // Create sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          total,
          payment_method: paymentMethod,
          status: 'completed',
          tenant_id: tenantId,
          cashier_name: user?.email?.split('@')[0] || 'FastPOS'
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Add sale items
      const saleItems = cartItems.map(item => ({
        sale_id: saleData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        tenant_id: tenantId
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update stock
      for (const item of cartItems) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.id)
            .eq('tenant_id', tenantId);

          if (stockError) console.error('Error updating stock:', stockError);
        }
      }

      // Print receipt immediately (NO kitchen command)
      await printReceiptDirectly(saleData.id);

      // Clear cart
      setCartItems([]);
      
      toast.success(`Venta completada: ${formatPrice(total)}`);
      
      // Refocus search
      setTimeout(() => searchInputRef.current?.focus(), 100);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
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
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};