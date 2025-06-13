import React, { useState, useEffect, useMemo } from 'react';
import { useBarber } from '@/contexts/BarberContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import ProductCardItem from '@/components/pos/ProductCardItem';
import ServiceCardItem from '@/components/pos/ServiceCardItem';
import PrintReceiptDialog from '@/components/pos/PrintReceiptDialog';
import AssignBarberModal from '@/components/pos/AssignBarberModal';
import TipDialog from '@/components/pos/TipDialog';
import DiscountDialog from '@/components/pos/DiscountDialog';
import MixedPaymentDialog from '@/components/pos/MixedPaymentDialog';
import DeleteSaleDialog from '@/components/pos/DeleteSaleDialog';
import PromotionsDialog from '@/components/pos/PromotionsDialog';
import { Service, Product, CartItem, Sale, Barber } from '@/types';
import { Search, ShoppingCart, Trash2, Calculator, Receipt, Gift, CreditCard, DollarSign, Percent, User, Users, Package, Sparkles, X, Plus, Minus } from 'lucide-react';
import { useLanguageCurrency } from '@/hooks/useLanguageCurrency';

const POSPage = () => {
  const { barbers, addBarber } = useBarber();
  const { services, products, sales, addSale, deleteSale, updateProductStock, promotions } = useBarber();
  const { formatCurrency, getText } = useLanguageCurrency();

  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tip, setTip] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed'>('cash');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<any | null>(null);

  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showAssignBarberModal, setShowAssignBarberModal] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showMixedPaymentDialog, setShowMixedPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPromotionsDialog, setShowPromotionsDialog] = useState(false);

  const [selectedItemForBarber, setSelectedItemForBarber] = useState<Service | Product | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  const totalWithTipAndDiscount = useMemo(() => {
    return subtotal + tip - discount;
  }, [subtotal, tip, discount]);

  const filteredServices = useMemo(() => {
    return services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const addToCart = (item: Service | Product) => {
    const isService = 'duration' in item;
    
    if (isService && !item.barberId) {
      setSelectedItemForBarber(item);
      setShowAssignBarberModal(true);
      return;
    }

    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.id === item.id && cartItem.type === (isService ? 'service' : 'product')
    );

    if (existingItemIndex !== -1) {
      setCart(prev => prev.map((cartItem, index) => 
        index === existingItemIndex 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      const cartItem: CartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        type: isService ? 'service' : 'product',
        barberId: isService ? item.barberId : undefined,
        duration: isService ? item.duration : undefined,
        stock: isService ? undefined : (item as Product).stock,
        category: item.category
      };
      setCart(prev => [...prev, cartItem]);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: newQuantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedPromotion(null);
    setDiscount(0);
    setTip(0);
  };

  const processPayment = (paymentData: any) => {
    if (cart.length === 0) return;

    const newSale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      total: totalWithTipAndDiscount,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        type: item.type,
        barberId: item.barberId,
        duration: item.duration
      })),
      paymentMethod: paymentData.method,
      tip: tip,
      discount: discount,
      promotion: selectedPromotion,
      customerId: undefined,
      notes: paymentData.notes || '',
      cashAmount: paymentData.cashAmount,
      cardAmount: paymentData.cardAmount,
      changeAmount: paymentData.changeAmount
    };

    addSale(newSale);

    // Update product stock
    cart.forEach(item => {
      if (item.type === 'product') {
        updateProductStock(item.id, item.quantity);
      }
    });

    setLastSale(newSale);
    setShowPrintDialog(true);
    clearCart();
  };

  const handleBarberAssignment = (barberId: string) => {
    if (selectedItemForBarber) {
      const updatedItem = { ...selectedItemForBarber, barberId };
      addToCart(updatedItem);
      setSelectedItemForBarber(null);
    }
    setShowAssignBarberModal(false);
  };

  const handlePromotionSelect = (promotion: any) => {
    setSelectedPromotion(promotion);
    
    if (promotion.discountType === 'percentage') {
      setDiscount(subtotal * (promotion.discountValue / 100));
    } else {
      setDiscount(promotion.discountValue);
    }
    
    setShowPromotionsDialog(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Product/Service Selection Panel */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 h-full flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {getText("Punto de Venta", "Point of Sale")}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Users className="h-3 w-3 mr-1" />
                  {barbers.length} {getText("Barberos", "Barbers")}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {services.length} {getText("Servicios", "Services")}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Package className="h-3 w-3 mr-1" />
                  {products.length} {getText("Productos", "Products")}
                </Badge>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={getText("Buscar servicios o productos...", "Search services or products...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Tabs for Services and Products */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mx-6 mt-4 bg-gray-100/50">
                <TabsTrigger value="services" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {getText("Servicios", "Services")}
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {getText("Productos", "Products")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="flex-1 px-6 pb-6">
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4">
                    {filteredServices.map((service) => (
                      <ServiceCardItem
                        key={service.id}
                        service={service}
                        onAddToCart={addToCart}
                        onBarberSelect={(service) => {
                          setSelectedItemForBarber(service);
                          setShowAssignBarberModal(true);
                        }}
                        selected={cart.some(item => item.id === service.id && item.type === 'service')}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="products" className="flex-1 px-6 pb-6">
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4">
                    {filteredProducts.map((product) => (
                      <ProductCardItem
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        selected={cart.some(item => item.id === product.id && item.type === 'product')}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-96 p-6 border-l border-gray-200 bg-white/50 backdrop-blur-sm">
        <Card className="h-full flex flex-col bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl">
              <span className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                {getText("Carrito", "Cart")}
              </span>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{getText("Carrito vacío", "Empty cart")}</p>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-600">
                              {formatCurrency(item.price)} {item.type === 'service' && item.duration && `• ${item.duration} min`}
                            </p>
                            {item.barberId && (
                              <p className="text-xs text-blue-600">
                                <User className="h-3 w-3 inline mr-1" />
                                {barbers.find(b => b.id === item.barberId)?.name}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(index)}
                            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-semibold text-sm">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Cart Summary and Actions */}
                <div className="space-y-4">
                  <Separator />
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPromotionsDialog(true)}
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      <Gift className="h-4 w-4 mr-1" />
                      {getText("Promoción", "Promotion")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDiscountDialog(true)}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <Percent className="h-4 w-4 mr-1" />
                      {getText("Descuento", "Discount")}
                    </Button>
                  </div>

                  {/* Tip Button */}
                  <Button
                    variant="outline"
                    onClick={() => setShowTipDialog(true)}
                    className="w-full text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {getText("Propina", "Tip")}: {formatCurrency(tip)}
                  </Button>

                  {/* Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{getText("Subtotal:", "Subtotal:")}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>{getText("Descuento:", "Discount:")}</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    {tip > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{getText("Propina:", "Tip:")}</span>
                        <span>+{formatCurrency(tip)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>{getText("Total:", "Total:")}</span>
                      <span className="text-emerald-600">{formatCurrency(totalWithTipAndDiscount)}</span>
                    </div>
                  </div>

                  {/* Payment Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        setPaymentMethod('cash');
                        processPayment({ method: 'cash' });
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {getText("Pagar en Efectivo", "Pay Cash")}
                    </Button>
                    <Button
                      onClick={() => {
                        setPaymentMethod('card');
                        processPayment({ method: 'card' });
                      }}
                      variant="outline"
                      className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {getText("Pagar con Tarjeta", "Pay with Card")}
                    </Button>
                    <Button
                      onClick={() => setShowMixedPaymentDialog(true)}
                      variant="outline"
                      className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      {getText("Pago Mixto", "Mixed Payment")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showPrintDialog && lastSale && (
        <PrintReceiptDialog
          sale={lastSale}
          onClose={() => setShowPrintDialog(false)}
        />
      )}

      {showAssignBarberModal && (
        <AssignBarberModal
          barbers={barbers}
          onAssign={handleBarberAssignment}
          onClose={() => {
            setShowAssignBarberModal(false);
            setSelectedItemForBarber(null);
          }}
        />
      )}

      <TipDialog
        isOpen={showTipDialog}
        onClose={() => setShowTipDialog(false)}
        onTipSet={setTip}
        currentTip={tip}
        subtotal={subtotal}
      />

      <DiscountDialog
        isOpen={showDiscountDialog}
        onClose={() => setShowDiscountDialog(false)}
        onDiscountSet={setDiscount}
        currentDiscount={discount}
        subtotal={subtotal}
      />

      <MixedPaymentDialog
        isOpen={showMixedPaymentDialog}
        onClose={() => setShowMixedPaymentDialog(false)}
        onPaymentComplete={processPayment}
        total={totalWithTipAndDiscount}
      />

      <DeleteSaleDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          if (saleToDelete) {
            deleteSale(saleToDelete);
            setSaleToDelete(null);
          }
          setShowDeleteDialog(false);
        }}
      />

      <PromotionsDialog
        isOpen={showPromotionsDialog}
        onClose={() => setShowPromotionsDialog(false)}
        onPromotionSelect={handlePromotionSelect}
        promotions={promotions}
        cartItems={cart}
      />
    </div>
  );
};

export default POSPage;
