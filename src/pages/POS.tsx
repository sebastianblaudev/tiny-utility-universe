import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Package,
  Calculator,
  Receipt,
  User,
  Coffee,
  AlertCircle,
  Scale,
  ScanLine,
  FileText,
  Save,
  Archive,
  RotateCcw,
  MessageSquarePlus,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCartContext } from '@/contexts/CartContext';
import PrintReceiptModal from '@/components/PrintReceiptModal';
import CompleteSaleModal from '@/components/CompleteSaleModal';
import POSActionsBar from '@/components/sales/POSActionsBar';
import CustomerSearchModal from '@/components/CustomerSearchModal';
import POSDraftSales from '@/components/sales/POSDraftSales';
import PaymentMethodDialog from '@/components/sales/PaymentMethodDialog';
import PaymentMethodsMixedDialog from '@/components/sales/PaymentMethodsMixedDialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import CartItemAnimation from '@/components/animations/CartItemAnimation';
import CartItemNote from '@/components/CartItemNote';
import SaleTypeSelector from '@/components/SaleTypeSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SavedDraftsDialog from '@/components/sales/SavedDraftsDialog';

interface Product {
  id: string;
  name: string;
  price: number;
  code?: string;
  cost_price?: number;
  stock?: number;
  image_url?: string;
  category?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  is_weight_based?: boolean;
}

const POS = () => {
  const { user } = useAuth();
  const { cart, addItem, removeItem, updateItemQuantity, clearCart } = useCartContext();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCompleteSaleModal, setShowCompleteSaleModal] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [showPaymentMethodsMixedDialog, setShowPaymentMethodsMixedDialog] = useState(false);
  const [showSavedDraftsDialog, setShowSavedDraftsDialog] = useState(false);
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>('retail');
  const [draftSales, setDraftSales] = useState<any[]>([]);
  const [selectedDraftSale, setSelectedDraftSale] = useState<any | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredProducts(
        products.filter(p => 
          p.name.toLowerCase().includes(lowerSearch) || 
          (p.code && p.code.toLowerCase().includes(lowerSearch))
        )
      );
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debe iniciar sesión para cargar productos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        toast({
          title: "Error",
          description: "No se pudo identificar el negocio",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

      if (error) throw error;

      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: Product, qty: number) => {
    if (qty <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser mayor a cero",
        variant: "destructive",
      });
      return;
    }
    addItem(product, qty);
    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleRemoveFromCart = (productId: string) => {
    removeItem(productId);
  };

  const handleUpdateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
    } else {
      updateItemQuantity(productId, qty);
    }
  };

  const handleClearCart = () => {
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
      clearCart();
    }
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos antes de completar la venta",
        variant: "destructive",
      });
      return;
    }
    setShowCompleteSaleModal(true);
  };

  const handlePrintReceipt = () => {
    setShowPrintModal(true);
  };

  const handleOpenCustomerSearch = () => {
    setShowCustomerSearch(true);
  };

  const handleOpenPaymentMethodDialog = () => {
    setShowPaymentMethodDialog(true);
  };

  const handleOpenPaymentMethodsMixedDialog = () => {
    setShowPaymentMethodsMixedDialog(true);
  };

  const handleSaveDraft = () => {
    // Implementation for saving draft sales
    // This can be expanded as needed
    toast({
      title: "Funcionalidad no implementada",
      description: "Guardar borradores aún no está disponible",
      variant: "default",
    });
  };

  const handleLoadDraft = (draft: any) => {
    setSelectedDraftSale(draft);
    // Load draft into cart or state as needed
    setShowSavedDraftsDialog(false);
  };

  const handleOpenSavedDrafts = () => {
    setShowSavedDraftsDialog(true);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Punto de Venta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input
              ref={searchInputRef}
              placeholder="Buscar productos por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <Button onClick={() => setSearchTerm('')} variant="outline">Limpiar</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <ScrollArea className="h-[400px] border rounded p-2">
                {isLoading ? (
                  <p>Cargando productos...</p>
                ) : filteredProducts.length === 0 ? (
                  <p>No se encontraron productos</p>
                ) : (
                  filteredProducts.map(product => (
                    <Card 
                      key={product.id} 
                      className="mb-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <CardContent className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.code || '-'}</p>
                        </div>
                        <Badge variant="secondary">{product.price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </ScrollArea>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Carrito</CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p>El carrito está vacío</p>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {cart.map(item => (
                          <div key={item.product.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-muted-foreground">{item.product.code || '-'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={16} />
                              </Button>
                              <span>{item.quantity}</span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                              >
                                <Plus size={16} />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleRemoveFromCart(item.product.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>
                      {cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button onClick={handleCompleteSale} disabled={cart.length === 0}>
                      Completar Venta
                    </Button>
                    <Button variant="outline" onClick={handleClearCart} disabled={cart.length === 0}>
                      Vaciar Carrito
                    </Button>
                    <Button variant="outline" onClick={handleOpenSavedDrafts}>
                      Borradores Guardados
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {selectedProduct && (
            <Dialog open={true} onOpenChange={() => setSelectedProduct(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedProduct.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Código: {selectedProduct.code || '-'}</p>
                  <p>Precio: {selectedProduct.price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</p>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="quantity">Cantidad:</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancelar</Button>
                    <Button onClick={() => handleAddToCart(selectedProduct, quantity)}>Agregar al carrito</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <PrintReceiptModal 
            isOpen={showPrintModal} 
            onClose={() => setShowPrintModal(false)} 
            cart={cart} 
          />

          <CompleteSaleModal 
            isOpen={showCompleteSaleModal} 
            onClose={() => setShowCompleteSaleModal(false)} 
            cart={cart} 
            onPrintReceipt={handlePrintReceipt}
            onClearCart={clearCart}
          />

          <CustomerSearchModal 
            isOpen={showCustomerSearch} 
            onClose={() => setShowCustomerSearch(false)} 
          />

          <PaymentMethodDialog 
            isOpen={showPaymentMethodDialog} 
            onClose={() => setShowPaymentMethodDialog(false)} 
          />

          <PaymentMethodsMixedDialog 
            isOpen={showPaymentMethodsMixedDialog} 
            onClose={() => setShowPaymentMethodsMixedDialog(false)} 
          />

          <SavedDraftsDialog 
            isOpen={showSavedDraftsDialog} 
            onClose={() => setShowSavedDraftsDialog(false)} 
            drafts={draftSales} 
            onLoadDraft={handleLoadDraft}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default POS;
