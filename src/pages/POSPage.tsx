import { useState, useEffect } from "react";
import { useBarber } from "@/contexts/BarberContext";
import { Service, Product, Category, SaleItem, Sale, PaymentMethod, SplitPayment, Discount, Promotion, Tip } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  Scissors,
  Trash,
  DollarSign,
  CreditCard,
  ArrowLeftRight,
  Search,
  Plus,
  Minus,
  X,
  MoreHorizontal,
  Printer,
  List,
  Percent,
  Tag,
  Settings,
  ShoppingCart,
  Clock,
  User,
} from "lucide-react";
import ServiceCardItem from "@/components/pos/ServiceCardItem";
import ProductCardItem from "@/components/pos/ProductCardItem";
import AssignBarberModal from "@/components/pos/AssignBarberModal";
import MixedPaymentDialog from "@/components/pos/MixedPaymentDialog";
import PrintReceiptDialog from "@/components/pos/PrintReceiptDialog";
import DeleteSaleDialog from "@/components/pos/DeleteSaleDialog";
import DiscountDialog from "@/components/pos/DiscountDialog";
import PromotionsDialog from "@/components/pos/PromotionsDialog";
import ManagePromotionsDialog from "@/components/pos/ManagePromotionsDialog";
import VerifyOwnerPinDialog from "@/components/pos/VerifyOwnerPinDialog";
import TipDialog from "@/components/pos/TipDialog";

const POSPage = () => {
  const { toast } = useToast();
  const { currentUser, isOwner } = useAuth();
  const {
    services,
    products,
    categories,
    barbers,
    addSale,
    sales,
    deleteSale,
    promotions = [],
    addPromotion,
    updatePromotion,
    deletePromotion,
  } = useBarber();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  
  // Nuevo estado para el timer del código de barras
  const [barcodeTimer, setBarcodeTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Estado para controlar la vista móvil
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');
  
  const [assignBarberModalOpen, setAssignBarberModalOpen] = useState(false);
  const [serviceToAssign, setServiceToAssign] = useState<Service | null>(null);
  const [mixedPaymentOpen, setMixedPaymentOpen] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    method: PaymentMethod;
    splitPayments?: SplitPayment[];
  } | null>(null);

  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [printReceiptOpen, setPrintReceiptOpen] = useState(false);
  
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false);
  const [selectedSaleForDeletion, setSelectedSaleForDeletion] = useState<Sale | null>(null);
  const [deleteSaleDialogOpen, setDeleteSaleDialogOpen] = useState(false);
  
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [promotionsDialogOpen, setPromotionsDialogOpen] = useState(false);
  const [managePromotionsOpen, setManagePromotionsOpen] = useState(false);
  const [verifyOwnerPinOpen, setVerifyOwnerPinOpen] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<Promotion | null>(null);

  const filteredServices = services.filter((service) => {
    const matchesSearch = searchQuery === "" || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartSubtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  const calculateDiscountAmount = () => {
    if (!appliedDiscount) return 0;
    
    if (appliedDiscount.type === 'percentage') {
      return cartSubtotal * (appliedDiscount.value / 100);
    } else {
      return Math.min(appliedDiscount.value, cartSubtotal);
    }
  };
  
  const calculatePromotionDiscountAmount = () => {
    if (!appliedPromotion) return 0;
    
    if (appliedPromotion.type === 'percentage_off') {
      return cartSubtotal * (appliedPromotion.value / 100);
    } else if (appliedPromotion.type === 'fixed_amount_off') {
      return Math.min(appliedPromotion.value, cartSubtotal);
    }
    
    return 0;
  };
  
  const discountAmount = calculateDiscountAmount();
  const promotionDiscountAmount = calculatePromotionDiscountAmount();
  const cartTotal = Math.max(0, cartSubtotal - discountAmount - promotionDiscountAmount);

  const addToCart = (item: Service | Product, quantity: number = 1) => {
    const isService = (item as Service).duration !== undefined;
    const itemType = isService ? 'service' : 'product';
    const itemId = item.id;
    
    const existingItemIndex = cartItems.findIndex(cartItem => 
      isService 
        ? cartItem.serviceId === item.id 
        : cartItem.productId === item.id
    );

    if (existingItemIndex !== -1) {
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setCartItems(updatedItems);
    } else {
      const newItem: SaleItem = {
        id: Math.random().toString(36).substring(2, 11),
        saleId: "", 
        name: item.name,
        price: item.price,
        quantity: quantity,
        serviceId: isService ? item.id : undefined,
        productId: !isService ? item.id : undefined,
        barberId: isService ? (item as Service).barberId : undefined,
        type: itemType,
        itemId: itemId,
      };
      
      setCartItems([...cartItems, newItem]);
    }

    setSelectedService(null);
    setSelectedProduct(null);
    
    // En móvil, cambiar automáticamente al carrito cuando se agrega un item
    if (window.innerWidth < 768) {
      setMobileView('cart');
    }
    
    if (isService && !(item as Service).barberId) {
      setServiceToAssign(item as Service);
      setAssignBarberModalOpen(true);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(cartItems.map(item => 
      item.id === itemId ? {...item, quantity: newQuantity} : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedDiscount(null);
    setAppliedPromotion(null);
  };

  const handleBarberSelect = (service: Service) => {
    setServiceToAssign(service);
    setAssignBarberModalOpen(true);
  };

  const assignBarberToService = (service: Service, barberId: string) => {
    const updatedItems = cartItems.map(item => 
      item.serviceId === service.id 
        ? {...item, barberId} 
        : item
    );
    
    setCartItems(updatedItems);
    toast({
      title: "Barbero asignado",
      description: `Se asignó el servicio al barbero ${barbers.find(b => b.id === barberId)?.name || "seleccionado"}`,
    });
  };

  const processPayment = (
    paymentMethod: PaymentMethod, 
    splitPayments?: SplitPayment[],
    tip?: Tip
  ) => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega servicios o productos antes de procesar el pago",
        variant: "destructive",
      });
      return;
    }

    const missingBarberService = cartItems.find(item => 
      item.serviceId && !item.barberId
    );

    if (missingBarberService) {
      toast({
        title: "Barbero no asignado",
        description: `Asigna un barbero al servicio "${missingBarberService.name}"`,
        variant: "destructive",
      });
      return;
    }

    const primaryBarberId = cartItems.find(item => item.barberId)?.barberId || "";

    const newSaleData: Omit<Sale, "id"> = {
      barberId: primaryBarberId,
      date: new Date(),
      items: cartItems.map(item => ({...item, saleId: ""})),
      total: cartTotal,
      paymentMethod,
      splitPayments,
      discount: appliedDiscount || undefined,
      appliedPromotion: appliedPromotion || undefined,
      tip
    };

    try {
      addSale(newSaleData);
      console.log("Sale created successfully");
      
      const saleForPrinting: Sale = {
        id: Date.now().toString(),
        ...newSaleData
      };
      
      setLastCompletedSale(saleForPrinting);
      clearCart();
      
      // En móvil, volver a la vista de productos después de completar la venta
      if (window.innerWidth < 768) {
        setMobileView('products');
      }
      
      toast({
        title: "Venta completada",
        description: "La venta se ha registrado exitosamente",
      });
      
      setTimeout(() => {
        setPrintReceiptOpen(true);
      }, 500);
      
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la venta",
        variant: "destructive",
      });
    }
  };

  const initiatePayment = (method: PaymentMethod, splitPayments?: SplitPayment[]) => {
    setPendingPayment({ method, splitPayments });
    setShowTipDialog(true);
  };

  const handleCashPayment = () => {
    initiatePayment(PaymentMethod.CASH);
  };

  const handleCardPayment = () => {
    initiatePayment(PaymentMethod.CARD);
  };

  const handleTransferPayment = () => {
    initiatePayment(PaymentMethod.TRANSFER);
  };

  const handleMixedPayment = (payments: SplitPayment[]) => {
    initiatePayment(PaymentMethod.MIXED, payments);
  };

  // Función modificada para manejar cambios en el código de barras
  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcodeInput(value);
    
    // Limpiar el timer anterior si existe
    if (barcodeTimer) {
      clearTimeout(barcodeTimer);
    }
    
    // Si hay un valor, configurar un nuevo timer para procesar automáticamente
    if (value.trim()) {
      const timer = setTimeout(() => {
        processBarcode();
      }, 500); // Procesar después de 500ms de inactividad
      
      setBarcodeTimer(timer);
    }
  };

  // Función modificada para manejar teclas (mantener Enter para compatibilidad)
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Si presiona Enter, cancelar el timer y procesar inmediatamente
      if (barcodeTimer) {
        clearTimeout(barcodeTimer);
        setBarcodeTimer(null);
      }
      processBarcode();
    }
  };

  const processBarcode = () => {
    if (!barcodeInput.trim()) return;
    
    const code = barcodeInput.trim();
    let foundService = null;
    let barberId = undefined;

    foundService = services.find(service => service.barcode === code);
    
    if (!foundService) {
      for (const service of services) {
        if (service.barberBarcodes) {
          const barberMapping = service.barberBarcodes.find(
            mapping => mapping.barcode === code
          );
          
          if (barberMapping) {
            foundService = service;
            barberId = barberMapping.barberId;
            break;
          }
        }
      }
    }

    if (foundService) {
      const serviceToAdd = {...foundService};
      if (barberId) {
        serviceToAdd.barberId = barberId;
      }
      
      addToCart(serviceToAdd);
      setBarcodeInput("");
      
      // Limpiar el timer si existe
      if (barcodeTimer) {
        clearTimeout(barcodeTimer);
        setBarcodeTimer(null);
      }
      
      toast({
        title: "Servicio encontrado",
        description: `Se agregó "${serviceToAdd.name}" ${barberId ? `(Barbero: ${barbers.find(b => b.id === barberId)?.name})` : ""} al carrito`,
      });
    } else {
      toast({
        title: "Código no encontrado",
        description: `No se encontró ningún servicio con el código "${code}"`,
        variant: "destructive",
      });
      
      // Limpiar el timer si existe
      if (barcodeTimer) {
        clearTimeout(barcodeTimer);
        setBarcodeTimer(null);
      }
    }
  };

  // Limpiar timer al desmontar el componente
  useEffect(() => {
    return () => {
      if (barcodeTimer) {
        clearTimeout(barcodeTimer);
      }
    };
  }, [barcodeTimer]);

  const handleDeleteSale = () => {
    if (selectedSaleForDeletion) {
      deleteSale(selectedSaleForDeletion.id);
      
      // Forzar actualización de la interfaz cerrando y reabriendo el historial
      setTimeout(() => {
        setSalesHistoryOpen(false);
        setTimeout(() => {
          setSalesHistoryOpen(true);
        }, 100);
      }, 500);
      
      setSelectedSaleForDeletion(null);
    }
  };
  
  const handleApplyDiscount = (discount: Discount) => {
    setAppliedDiscount(discount);
    toast({
      title: "Descuento aplicado",
      description: `Se ha aplicado un descuento de ${
        discount.type === 'percentage' 
          ? `${discount.value}%` 
          : `$${discount.value.toFixed(2)}`
      }`,
    });
  };
  
  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    toast({
      title: "Descuento eliminado",
      description: "Se ha eliminado el descuento aplicado",
    });
  };
  
  const handleApplyPromotion = (promotion: Promotion) => {
    if (promotion.requiresOwnerPin && !isOwner) {
      setPendingPromotion(promotion);
      setVerifyOwnerPinOpen(true);
    } else {
      setAppliedPromotion(promotion);
      toast({
        title: "Promoción aplicada",
        description: `Se ha aplicado la promoción "${promotion.name}"`,
      });
    }
  };
  
  const handleRemovePromotion = () => {
    setAppliedPromotion(null);
    toast({
      title: "Promoción eliminada",
      description: "Se ha eliminado la promoción aplicada",
    });
  };
  
  const handleOwnerPinVerified = () => {
    if (pendingPromotion) {
      setAppliedPromotion(pendingPromotion);
      toast({
        title: "Promoción aplicada",
        description: `Se ha aplicado la promoción "${pendingPromotion.name}"`,
      });
      setPendingPromotion(null);
    }
  };
  
  const handleAddPromotion = (promotion: Promotion) => {
    if (typeof addPromotion === 'function') {
      addPromotion(promotion);
    } else {
      console.log("Add promotion function not provided in context", promotion);
    }
  };
  
  const handleUpdatePromotion = (promotion: Promotion) => {
    if (typeof updatePromotion === 'function') {
      updatePromotion(promotion);
    } else {
      console.log("Update promotion function not provided in context", promotion);
    }
  };
  
  const handleDeletePromotion = (promotionId: string) => {
    if (typeof deletePromotion === 'function') {
      deletePromotion(promotionId);
    } else {
      console.log("Delete promotion function not provided in context", promotionId);
    }
  };

  const formatDate = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return new Intl.DateTimeFormat('es-ES', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    }).format(date);
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH: return "Efectivo";
      case PaymentMethod.CARD: return "Tarjeta";
      case PaymentMethod.TRANSFER: return "Transferencia";
      case PaymentMethod.MIXED: return "Mixto";
      default: return method;
    }
  };

  const handleTipConfirm = (tip: Tip) => {
    console.log("Tip confirmed:", tip);
    if (!pendingPayment) {
      console.error("No pending payment found");
      return;
    }

    const { method, splitPayments } = pendingPayment;
    
    processPayment(method, splitPayments, tip);
    setPendingPayment(null);
    setShowTipDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Layout móvil */}
      <div className="md:hidden">
        {/* Header móvil con navegación entre vistas */}
        <div className="bg-white border-b border-gray-200 p-3 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-900">POS</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSalesHistoryOpen(true)}
                className="h-8 px-2 text-xs"
              >
                <List className="h-4 w-4 mr-1" />
                Historial
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setManagePromotionsOpen(true)}
                className="h-8 px-2 text-xs"
              >
                <Tag className="h-4 w-4 mr-1" />
                Promo
              </Button>
              
              {lastCompletedSale && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setPrintReceiptOpen(true)}
                  className="h-8 px-2 text-xs"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Tabs de navegación móvil */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={mobileView === 'products' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMobileView('products')}
              className="flex-1 text-xs h-8"
            >
              <Package className="h-3 w-3 mr-1" />
              Productos
            </Button>
            <Button
              variant={mobileView === 'cart' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMobileView('cart')}
              className="flex-1 text-xs h-8 relative"
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Carrito
              {cartItems.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0 h-4 min-w-4">
                  {cartItems.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Contenido móvil */}
        <div className="p-4">
          {mobileView === 'products' ? (
            <Card className="border-2 border-gray-200">
              <CardContent className="p-4">
                {/* Barra de búsqueda móvil */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      className="pl-10 h-10 text-base"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="flex-1 h-10">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="relative flex-1">
                      <Input
                        placeholder="Código de barras..."
                        className="h-10 text-sm"
                        value={barcodeInput}
                        onChange={handleBarcodeInput}
                        onKeyDown={handleBarcodeKeyDown}
                      />
                    </div>
                  </div>
                </div>

                {/* Tabs de servicios y productos móvil */}
                <Tabs defaultValue="services" className="h-[calc(100vh-200px)]">
                  <TabsList className="grid w-full grid-cols-2 mb-4 h-10">
                    <TabsTrigger value="services" className="text-sm">
                      <Scissors className="mr-2 h-4 w-4" />
                      Servicios
                    </TabsTrigger>
                    <TabsTrigger value="products" className="text-sm">
                      <Package className="mr-2 h-4 w-4" />
                      Productos
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="services" className="h-[calc(100%-60px)] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-3 pb-4">
                      {filteredServices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <Scissors className="h-12 w-12 mb-4 opacity-30" />
                          <p className="text-lg font-medium">No se encontraron servicios</p>
                        </div>
                      ) : (
                        filteredServices.map((service) => (
                          <ServiceCardItem
                            key={service.id}
                            service={service}
                            onAddToCart={addToCart}
                            onBarberSelect={handleBarberSelect}
                            selected={selectedService?.id === service.id}
                          />
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="products" className="h-[calc(100%-60px)] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-3 pb-4">
                      {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <Package className="h-12 w-12 mb-4 opacity-30" />
                          <p className="text-lg font-medium">No se encontraron productos</p>
                        </div>
                      ) : (
                        filteredProducts.map((product) => (
                          <ProductCardItem
                            key={product.id}
                            product={product}
                            onAddToCart={addToCart}
                            selected={selectedProduct?.id === product.id}
                          />
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            /* Vista del carrito móvil */
            <Card className="border-2 border-gray-200">
              <CardContent className="p-4">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium mb-2">Carrito vacío</p>
                    <p className="text-sm text-center mb-4">Selecciona servicios o productos</p>
                    <Button 
                      onClick={() => setMobileView('products')}
                      variant="outline"
                    >
                      Ver productos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header del carrito */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-900">Carrito</h2>
                        <Badge variant="secondary">
                          {cartItems.length}
                        </Badge>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCart}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                        Limpiar
                      </Button>
                    </div>

                    {/* Items del carrito */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {cartItems.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-gray-900 flex-1 text-sm">{item.name}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-600 ml-2 h-6 w-6 p-0"
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                            <span>${item.price.toFixed(2)} × {item.quantity}</span>
                            <span className="font-medium text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>

                          {item.serviceId && (
                            <div className="flex items-center justify-between mb-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  item.barberId 
                                    ? "bg-green-50 text-green-700 border-green-200" 
                                    : "bg-orange-50 text-orange-700 border-orange-200"
                                }`}
                              >
                                <User className="h-3 w-3 mr-1" />
                                {item.barberId 
                                  ? barbers.find(b => b.id === item.barberId)?.name
                                  : "Sin asignar"}
                              </Badge>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const serviceToAssign = services.find(s => s.id === item.serviceId);
                                  if (serviceToAssign) {
                                    handleBarberSelect(serviceToAssign);
                                  }
                                }}
                                className="text-xs h-6"
                              >
                                {item.barberId ? "Cambiar" : "Asignar"}
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Cantidad:</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                className="h-7 w-7 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                className="h-7 w-7 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Resumen de totales */}
                    <div className="border-t pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">${cartSubtotal.toFixed(2)}</span>
                        </div>
                        
                        {appliedDiscount && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">Descuento:</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveDiscount}
                                className="h-4 w-4 p-0 text-gray-400 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-red-600 font-medium">-${discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {appliedPromotion && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">Promoción:</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRemovePromotion}
                                className="h-4 w-4 p-0 text-gray-400 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-blue-600 font-medium">-${promotionDiscountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-green-600">${cartTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Botones de descuentos y promociones */}
                      {!appliedDiscount && !appliedPromotion && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-9"
                            onClick={() => setDiscountDialogOpen(true)}
                          >
                            <Percent className="h-3 w-3 mr-1" />
                            Descuento
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-9"
                            onClick={() => setPromotionsDialogOpen(true)}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            Promoción
                          </Button>
                        </div>
                      )}

                      {/* Botones de pago móvil */}
                      <div className="space-y-3 mt-4">
                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white h-11"
                            onClick={handleCashPayment}
                            size="lg"
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Pagar en Efectivo - ${cartTotal.toFixed(2)}
                          </Button>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white h-11"
                            onClick={handleCardPayment}
                            size="lg"
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pagar con Tarjeta - ${cartTotal.toFixed(2)}
                          </Button>
                          <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white h-11"
                            onClick={handleTransferPayment}
                            size="lg"
                          >
                            <ArrowLeftRight className="mr-2 h-4 w-4" />
                            Pagar por Transferencia - ${cartTotal.toFixed(2)}
                          </Button>
                        </div>
                        
                        <Button
                          variant="outline"
                          className="w-full h-10"
                          onClick={() => setMixedPaymentOpen(true)}
                        >
                          <MoreHorizontal className="mr-2 h-4 w-4" />
                          Pago mixto
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Layout desktop - sin cambios */}
      <div className="hidden md:flex min-h-screen">
        {/* Panel principal de productos/servicios - optimizado para usar todo el espacio */}
        <div className="flex-1 p-4">
          <Card className="h-full shadow-lg border-2 border-gray-200">
            <CardContent className="p-4">
              {/* Barra de búsqueda y filtros compacta */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar servicios o productos..."
                    className="pl-10 h-10 text-base shadow-sm border-2 border-gray-200 focus:border-blue-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[200px] h-10 shadow-sm border-2 border-gray-200">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative w-full sm:w-[180px]">
                  <Input
                    placeholder="Código de barras..."
                    className="h-10 text-base shadow-sm border-2 border-gray-200 focus:border-blue-400"
                    value={barcodeInput}
                    onChange={handleBarcodeInput}
                    onKeyDown={handleBarcodeKeyDown}
                  />
                </div>
              </div>

              {/* Tabs optimizados */}
              <Tabs defaultValue="services" className="h-[calc(100%-80px)]">
                <TabsList className="grid w-full grid-cols-2 mb-4 h-10 bg-gray-200">
                  <TabsTrigger value="services" className="text-sm">
                    <Scissors className="mr-2 h-4 w-4" />
                    Servicios ({filteredServices.length})
                  </TabsTrigger>
                  <TabsTrigger value="products" className="text-sm">
                    <Package className="mr-2 h-4 w-4" />
                    Productos ({filteredProducts.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="h-[calc(100%-60px)] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                    {filteredServices.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                        <Scissors className="h-12 w-12 mb-4 opacity-30" />
                        <p className="text-lg font-medium">No se encontraron servicios</p>
                        <p className="text-sm">Intenta con otros términos de búsqueda</p>
                      </div>
                    ) : (
                      filteredServices.map((service) => (
                        <ServiceCardItem
                          key={service.id}
                          service={service}
                          onAddToCart={addToCart}
                          onBarberSelect={handleBarberSelect}
                          selected={selectedService?.id === service.id}
                        />
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="products" className="h-[calc(100%-60px)] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                    {filteredProducts.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                        <Package className="h-12 w-12 mb-4 opacity-30" />
                        <p className="text-lg font-medium">No se encontraron productos</p>
                        <p className="text-sm">Intenta con otros términos de búsqueda</p>
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <ProductCardItem
                          key={product.id}
                          product={product}
                          onAddToCart={addToCart}
                          selected={selectedProduct?.id === product.id}
                        />
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Panel del carrito desktop - sin cambios */}
        <div className="w-96 border-l border-gray-300 bg-white shadow-lg">
          <div className="flex flex-col h-full">
            {/* Header del carrito con botones integrados */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gray-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Carrito</h2>
                {cartItems.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {cartItems.length}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSalesHistoryOpen(true)}
                  className="h-7 px-2 text-xs"
                >
                  <List className="h-3 w-3 mr-1" />
                  Historial
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManagePromotionsOpen(true)}
                  className="h-7 px-2 text-xs"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  Promo
                </Button>
                
                {lastCompletedSale && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setPrintReceiptOpen(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <Printer className="h-3 w-3" />
                  </Button>
                )}
                
                {cartItems.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="h-7 px-2 text-gray-500 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Contenido del carrito */}
            <div className="flex-1 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                  <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-2">Carrito vacío</p>
                  <p className="text-sm text-center">Selecciona servicios o productos para comenzar</p>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 flex-1 text-sm">{item.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-600 ml-2 h-6 w-6 p-0"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>${item.price.toFixed(2)} × {item.quantity}</span>
                        <span className="font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {item.serviceId && (
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              item.barberId 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : "bg-orange-50 text-orange-700 border-orange-200"
                            }`}
                          >
                            <User className="h-3 w-3 mr-1" />
                            {item.barberId 
                              ? barbers.find(b => b.id === item.barberId)?.name
                              : "Sin asignar"}
                          </Badge>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const serviceToAssign = services.find(s => s.id === item.serviceId);
                              if (serviceToAssign) {
                                handleBarberSelect(serviceToAssign);
                              }
                            }}
                            className="text-xs h-6"
                          >
                            {item.barberId ? "Cambiar" : "Asignar"}
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Cantidad:</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumen y botones de pago compactos */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-3">
                {/* Resumen de totales compacto */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  
                  {appliedDiscount && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Descuento:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveDiscount}
                          className="h-4 w-4 p-0 text-gray-400 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-red-600 font-medium">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {appliedPromotion && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Promoción:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePromotion}
                          className="h-4 w-4 p-0 text-gray-400 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-blue-600 font-medium">-${promotionDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-base font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botones de descuentos y promociones compactos */}
                {!appliedDiscount && !appliedPromotion && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => setDiscountDialogOpen(true)}
                    >
                      <Percent className="h-3 w-3 mr-1" />
                      Descuento
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => setPromotionsDialogOpen(true)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      Promoción
                    </Button>
                  </div>
                )}

                {/* Botones de pago compactos */}
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm text-xs h-9"
                      onClick={handleCashPayment}
                      size="sm"
                    >
                      <DollarSign className="mr-1 h-3 w-3" />
                      Efectivo
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs h-9"
                      onClick={handleCardPayment}
                      size="sm"
                    >
                      <CreditCard className="mr-1 h-3 w-3" />
                      Tarjeta
                    </Button>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm text-xs h-9"
                      onClick={handleTransferPayment}
                      size="sm"
                    >
                      <ArrowLeftRight className="mr-1 h-3 w-3" />
                      Transfer
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full shadow-sm text-xs h-8"
                    onClick={() => setMixedPaymentOpen(true)}
                  >
                    <MoreHorizontal className="mr-2 h-3 w-3" />
                    Pago mixto
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales - sin cambios */}
      <AssignBarberModal
        open={assignBarberModalOpen}
        onOpenChange={setAssignBarberModalOpen}
        service={serviceToAssign}
        onBarberSelected={assignBarberToService}
      />

      <MixedPaymentDialog
        open={mixedPaymentOpen}
        onClose={() => setMixedPaymentOpen(false)}
        totalAmount={cartTotal}
        onConfirm={handleMixedPayment}
      />
      
      <PrintReceiptDialog
        open={printReceiptOpen}
        onClose={() => setPrintReceiptOpen(false)}
        sale={lastCompletedSale}
      />

      <Sheet open={salesHistoryOpen} onOpenChange={setSalesHistoryOpen}>
        <SheetContent className="sm:max-w-md md:max-w-lg">
          <SheetHeader>
            <SheetTitle>Historial de Ventas</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {sales.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No hay ventas registradas
              </p>
            ) : (
              <div className="space-y-4">
                {sales.slice().reverse().map((sale) => (
                  <Card key={sale.id} className="overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-muted">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">
                          {formatDate(sale.date)}
                        </div>
                        <Badge>
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      <div className="space-y-1">
                        {sale.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {sale.items.length > 3 && (
                          <div className="text-center text-sm text-muted-foreground py-1">
                            ... y {sale.items.length - 3} más
                          </div>
                        )}
                        
                        {sale.discount && (
                          <div className="flex justify-between items-center text-sm text-purple-600">
                            <span>Descuento: {
                              sale.discount.type === 'percentage' 
                                ? `${sale.discount.value}%` 
                                : `$${sale.discount.value}`
                            }</span>
                          </div>
                        )}
                        
                        {sale.appliedPromotion && (
                          <div className="flex justify-between items-center text-sm text-blue-600">
                            <span>Promoción: {sale.appliedPromotion.name}</span>
                          </div>
                        )}
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between items-center font-medium">
                        <span>Total:</span>
                        <span>${sale.total.toFixed(2)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="py-2 px-4 bg-muted flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLastCompletedSale(sale);
                          setPrintReceiptOpen(true);
                        }}
                      >
                        <Printer className="h-3.5 w-3.5 mr-1" />
                        Imprimir
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedSaleForDeletion(sale);
                          setDeleteSaleDialogOpen(true);
                        }}
                      >
                        <Trash className="h-3.5 w-3.5 mr-1" />
                        Eliminar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <DeleteSaleDialog
        open={deleteSaleDialogOpen}
        onOpenChange={setDeleteSaleDialogOpen}
        sale={selectedSaleForDeletion}
        onConfirmDelete={handleDeleteSale}
      />
      
      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        currentTotal={cartSubtotal}
        onApplyDiscount={handleApplyDiscount}
      />
      
      <PromotionsDialog
        open={promotionsDialogOpen}
        onOpenChange={setPromotionsDialogOpen}
        promotions={promotions}
        onApplyPromotion={handleApplyPromotion}
        cartTotal={cartSubtotal}
      />
      
      <ManagePromotionsDialog
        open={managePromotionsOpen}
        onOpenChange={setManagePromotionsOpen}
        promotions={promotions}
        onAddPromotion={handleAddPromotion}
        onUpdatePromotion={handleUpdatePromotion}
        onDeletePromotion={handleDeletePromotion}
      />
      
      <VerifyOwnerPinDialog
        open={verifyOwnerPinOpen}
        onOpenChange={setVerifyOwnerPinOpen}
        onPinVerified={handleOwnerPinVerified}
        title="Promoción protegida"
        description="Esta promoción requiere verificación del propietario. Por favor, introduce el PIN del propietario para aplicarla."
      />
      
      <TipDialog
        open={showTipDialog}
        onOpenChange={(open) => {
          console.log("TipDialog onOpenChange:", open);
          setShowTipDialog(open);
          if (!open && pendingPayment) {
            console.log("Processing payment without tip");
            const { method, splitPayments } = pendingPayment;
            processPayment(method, splitPayments);
            setPendingPayment(null);
          }
        }}
        total={cartTotal}
        barberId={cartItems.find(item => item.barberId)?.barberId || ''}
        paymentMethod={pendingPayment?.method || PaymentMethod.CASH}
        onConfirm={handleTipConfirm}
      />
    </div>
  );
};

export default POSPage;
