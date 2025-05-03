import { useState, useEffect, useRef } from "react" 
import { useNavigate, useLocation } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  User,
  Pizza,
  Coffee,
  Utensils,
  IceCream,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  ChevronDown,
  Truck,
  ShoppingBag,
  Store,
  Search,
  UserPlus,
  Users,
  Eye,
  Tag,
  X,
  Barcode,
  ScanBarcode,
  Save,
  Printer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { initDB, getTableOrder } from "@/lib/db"
import type { Product, Customer, Category } from "@/lib/db"
import { motion, AnimatePresence } from "framer-motion"
import { PaymentModal } from "@/components/PaymentModal"
import { MenuDrawer } from "@/components/MenuDrawer"
import { CreateCustomerDialog } from "@/components/CreateCustomerDialog"
import { HalfAndHalfDialog } from "@/components/HalfAndHalfDialog"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import PizzaSizeSelector from '@/components/PizzaSizeSelector'
import { AddExtraIngredientModal } from "@/components/AddExtraIngredientModal"
import { createRoot } from 'react-dom/client'
import { useProductsData } from "@/hooks/useProductsData"
import { calculateTaxAmount, useTaxSettings } from "@/lib/utils"
import { TableOrderManager } from "@/components/TableOrderManager"
import { PreBillReceipt } from "@/components/PreBillReceipt"
import { TableSelectionModal } from "@/components/TableSelectionModal"
import { ItemNoteDialog } from "@/components/ItemNoteDialog"

const defaultIcons: { [key: string]: any } = {
  pizzas: Pizza,
  entradas: Utensils,
  bebidas: Coffee,
  postres: IceCream,
}

const defaultColors: { [key: string]: string } = {
  pizzas: 'bg-orange-600',
  entradas: 'bg-blue-600',
  bebidas: 'bg-purple-600',
  postres: 'bg-pink-600'
}

export default function PizzaPOS() {
  const { 
    products, 
    categories, 
    productsByCategory, 
    isLoading,
    searchProducts,
    searchResults,
    isSearchActive,
    clearSearch,
    handleBarcodeScanned,
    exactBarcodeMatch
  } = useProductsData();
  
  const [cart, setCart] = useState<any[]>([]);
  const [total, setTotal] = useState(0)
  const [activeTable, setActiveTable] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<"mesa" | "delivery" | "takeaway">("takeaway")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [searchCustomer, setSearchCustomer] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false)
  const [showHalfAndHalfDialog, setShowHalfAndHalfDialog] = useState(false)
  const [selectedPizzas, setSelectedPizzas] = useState<Product[]>([])
  const [extraModal, setExtraModal] = useState<{ open: boolean, itemIdx: number | null }>({ open: false, itemIdx: null });
  const [pendingExtra, setPendingExtra] = useState<{ idx: number | null }>({ idx: null });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isScannerActive, setIsScannerActive] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [showTableOrderManager, setShowTableOrderManager] = useState(false);
  const [showTableSelectionModal, setShowTableSelectionModal] = useState(false);
  const [tableWithOrders, setTablesWithOrders] = useState<number[]>([]);
  const [tableCount, setTableCount] = useState<number>(8); // Define tableCount with a default value of 8
  const [noteDialogConfig, setNoteDialogConfig] = useState<{ open: boolean, itemIdx: number | null, initialNote: string }>({ 
    open: false, 
    itemIdx: null, 
    initialNote: "" 
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Check if we were navigated here from the Shifts page with a table selection
  useEffect(() => {
    if (location.state) {
      const { selectedTable, orderType: newOrderType } = location.state as { selectedTable?: string, orderType?: "mesa" | "delivery" | "takeaway" };
      
      if (selectedTable) {
        console.log("Table selected from Shifts page:", selectedTable);
        setActiveTable(selectedTable);
        
        if (newOrderType) {
          setOrderType(newOrderType);
        }
        
        // Check if the selected table has a saved order
        const loadExistingTableOrder = async () => {
          try {
            const existingOrder = await getTableOrder(selectedTable);
            
            if (existingOrder) {
              console.log("Found existing order for table:", existingOrder);
              
              // Convert the saved order items to cart items
              const cartItems = existingOrder.items.map((item: any) => ({
                id: item.productId,
                quantity: item.quantity,
                price: item.price,
                name: item.name,
                size: item.size || 'regular'
              }));
              
              setCart(cartItems);
              
              if (existingOrder.customerId) {
                const customer = customers.find(c => c.id === existingOrder.customerId);
                if (customer) {
                  setSelectedCustomer(customer);
                }
              }
              
              toast({
                title: "Orden cargada",
                description: `Orden de mesa ${selectedTable} cargada exitosamente`,
                variant: "default"
              });
            }
          } catch (error) {
            console.error("Error loading table order:", error);
          }
        };
        
        loadExistingTableOrder();
      }
      
      // If the completeOrder flag is set, open the payment modal
      if (location.state.completeOrder) {
        setShowPaymentModal(true);
      }
    }
  }, [location]);
  
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      console.log("Estableciendo categoría inicial:", categories[0].id);
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const db = await initDB();
        if (!db) return;
        
        const customerTx = db.transaction('customers', 'readonly');
        const customerStore = customerTx.objectStore('customers');
        const allCustomers = await customerStore.getAll();
        setCustomers(allCustomers);
      } catch (error) {
        console.error("Error loading customers:", error);
      }
    };

    loadCustomers();
  }, []);

  useEffect(() => {
    const storedCart = localStorage.getItem("pizzaPOSCart");
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        localStorage.removeItem("pizzaPOSCart");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pizzaPOSCart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (isScannerActive) {
      let barcodeBuffer = '';
      const keyDownHandler = (e: KeyboardEvent) => {
        if (!isScannerActive) return;
        
        if (e.key !== 'Enter') {
          barcodeBuffer += e.key;
        } else {
          if (barcodeBuffer) {
            handleBarcodeScanned(barcodeBuffer);
            setSearchQuery(barcodeBuffer);
            barcodeBuffer = '';
          }
        }
      };

      window.addEventListener('keydown', keyDownHandler);
      
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }

      return () => {
        window.removeEventListener('keydown', keyDownHandler);
      };
    }
  }, [isScannerActive, handleBarcodeScanned]);

  useEffect(() => {
    if (exactBarcodeMatch) {
      const isPizza = exactBarcodeMatch.category === 'pizzas' || 
                     exactBarcodeMatch.categoryId === 'cat_pizza' || 
                     (exactBarcodeMatch.category && (/pizza/i.test(exactBarcodeMatch.category)));
      
      if (isPizza) {
        if (exactBarcodeMatch.sizes) {
          const sizes = exactBarcodeMatch.sizes;
          const sizeKey = Object.keys(sizes)[0];
          const price = sizes[sizeKey];
          
          const cartItem = {
            ...exactBarcodeMatch,
            price,
            size: sizeKey,
            quantity: 1,
          };

          const existingItemIndex = cart.findIndex(
            (i) => i.id === exactBarcodeMatch.id && i.size === sizeKey
          );

          if (existingItemIndex >= 0) {
            const newCart = [...cart];
            newCart[existingItemIndex].quantity += 1;
            setCart(newCart);
          } else {
            setCart([...cart, cartItem]);
          }
          
          toast({
            title: "Producto agregado",
            description: `${exactBarcodeMatch.name} (${sizeKey}) agregado al carrito`,
            variant: "default"
          });
        }
      } else {
        const existingItemIndex = cart.findIndex((cartItem) => cartItem.id === exactBarcodeMatch.id);

        if (existingItemIndex >= 0) {
          const newCart = [...cart];
          newCart[existingItemIndex].quantity += 1;
          setCart(newCart);
        } else {
          setCart([...cart, { ...exactBarcodeMatch, quantity: 1 }]);
        }
        
        toast({
          title: "Producto agregado",
          description: `${exactBarcodeMatch.name} agregado al carrito`,
          variant: "default"
        });
      }
      
      clearSearch();
      setSearchQuery("");
    }
  }, [exactBarcodeMatch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchProducts(value);
  };

  const toggleScanner = () => {
    const newScannerState = !isScannerActive;
    setIsScannerActive(newScannerState);
    
    if (newScannerState) {
      toast({
        title: "Escáner activado",
        description: "Escanee un código de barras",
        variant: "default"
      });
      
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } else {
      toast({
        title: "Escáner desactivado",
        description: "Modo de búsqueda manual",
        variant: "default"
      });
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchCustomer.toLowerCase()) || customer.phone.includes(searchCustomer)
  );

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => {
      let itemTotal = item.price * item.quantity;

      if (item.extras && Array.isArray(item.extras) && item.extras.length > 0) {
        const extrasTotal = item.extras.reduce((s: number, ext: any) => s + (ext.price ? ext.price : 0), 0);
        itemTotal += extrasTotal * item.quantity;
      }

      return sum + itemTotal;
    }, 0);
    
    setSubtotal(newTotal);
    
    // Calculate tax amount
    const taxSettings = useTaxSettings();
    if (taxSettings.taxEnabled && taxSettings.taxPercentage > 0) {
      const taxAmount = calculateTaxAmount(newTotal);
      setTaxAmount(taxAmount);
      setTotal(newTotal + taxAmount);
    } else {
      setTaxAmount(0);
      setTotal(newTotal);
    }
  }, [cart]);

  const handleAddToCart = (item: Product) => {
    const isPizza = item.category === 'pizzas' || item.categoryId === 'cat_pizza' || 
                    (item.category && (/pizza/i.test(item.category)));
    
    if (isPizza) {
      console.log("Abriendo selector de tamaño para pizza:", item);
      
      if (!item.sizes) {
        console.log("El producto no tiene tamaños definidos");
        item.sizes = { personal: 0, mediana: 0, familiar: 0 };
      }
      
      const dialog = document.createElement('dialog');
      dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
      dialog.addEventListener('click', (e) => {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
        if (!isInDialog) {
          dialog.close();
          document.body.removeChild(dialog);
        }
      });
      
      dialog.innerHTML = `
        <div id="sizeSelector" class="bg-[#1A1A1A] p-4 rounded-lg shadow-lg min-w-[300px]" onclick="event.stopPropagation()">
          <h3 class="text-lg font-bold mb-4 text-white">${item.name}</h3>
          <div id="sizeSelectorContainer"></div>
        </div>
      `;

      document.body.appendChild(dialog);
      dialog.showModal();

      const container = dialog.querySelector('#sizeSelectorContainer');
      if (container) {
        console.log("Renderizando selector con tamaños:", item.sizes);
        const root = createRoot(container);
        root.render(
          <PizzaSizeSelector
            sizes={item.sizes}
            onClose={() => {
              dialog.close();
              document.body.removeChild(dialog);
            }}
            onSizeSelect={(size, price) => {
              console.log(`Tamaño seleccionado: ${size}, precio: ${price}`);
              const cartItem = {
                ...item,
                price,
                size,
                quantity: 1,
              };

              const existingItemIndex = cart.findIndex(
                (i) => i.id === item.id && i.size === size
              );

              if (existingItemIndex >= 0) {
                const newCart = [...cart];
                newCart[existingItemIndex].quantity += 1;
                setCart(newCart);
              } else {
                setCart([...cart, cartItem]);
              }

              root.unmount();
              dialog.close();
              document.body.removeChild(dialog);
            }}
          />
        );
      }
    } else {
      const existingItemIndex = cart.findIndex((cartItem) => cartItem.id === item.id);

      if (existingItemIndex >= 0) {
        const newCart = [...cart];
        newCart[existingItemIndex].quantity += 1;
        setCart(newCart);
      } else {
        setCart([...cart, { ...item, quantity: 1 }]);
      }
    }
  };

  const handleQuantityChange = (id: string, change: number) => {
    const newCart = cart
      .map((item) => {
        if (item.id === id) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      })
      .filter(Boolean);

    setCart(newCart);
  };

  const handleRemoveItem = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const handleSelectTable = (tableNumber: string) => {
    // No need to parse string to number since we updated openOrderForTable to accept strings too
    openOrderForTable(tableNumber);
  };

  const handleOrderTypeChange = (type: "mesa" | "delivery" | "takeaway") => {
    setOrderType(type);
    if (type === "mesa") {
      setShowTableSelectionModal(true);
    } else {
      setActiveTable(null);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDialog(false);
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers([...customers, newCustomer]);
    setSelectedCustomer(newCustomer);
    setShowCustomerDialog(false);
  };

  const getOrderTypeIcon = () => {
    switch (orderType) {
      case "mesa":
        return <Store className="h-4 w-4 mr-2" />;
      case "delivery":
        return <Truck className="h-4 w-4 mr-2" />;
      case "takeaway":
        return <ShoppingBag className="h-4 w-4 mr-2" />;
    }
  };

  const getOrderTypeLabel = () => {
    switch (orderType) {
      case "mesa":
        return "Mesa" + (activeTable ? ` ${activeTable}` : "");
      case "delivery":
        return "Delivery";
      case "takeaway":
        return "Para llevar";
    }
  };

  const handlePaymentComplete = async () => {
    setCart([]);
    setShowPaymentModal(false);
    setSelectedCustomer(null);
    if (orderType === "mesa") {
      setActiveTable(null);
    }
  };

  const loadPreviousOrder = async (customerId: string) => {
    try {
      const db = await initDB();
      if (!db) {
        console.error("Database not initialized");
        return null;
      }
      
      const tx = db.transaction('orders', 'readonly');
      const orderStore = tx.objectStore('orders');
      const customerOrders = await orderStore.index('by-customer').getAll(customerId);
      
      console.log("Customer orders retrieved:", customerOrders);
      
      if (customerOrders && customerOrders.length > 0) {
        const lastOrder = customerOrders[customerOrders.length - 1];
        console.log("Last order found:", lastOrder);
        return lastOrder;
      }
      
      console.log("No previous orders found for customer");
      return null;
    } catch (error) {
      console.error("Error loading previous order:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el pedido anterior",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleLoadPreviousOrder = async (customerId: string) => {
    const lastOrder = await loadPreviousOrder(customerId);
    
    if (!lastOrder || !lastOrder.items || !lastOrder.items.length) {
      toast({
        title: "Sin pedidos",
        description: "El cliente no tiene pedidos anteriores",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const cartItems = await Promise.all(
        lastOrder.items.map(async (item: any) => {
          let productName = 'Producto';
          let productCategory = '';
          
          for (const category in productsByCategory) {
            const product = productsByCategory[category].find(p => p.id === item.productId);
            if (product) {
              productName = product.name;
              productCategory = category;
              break;
            }
          }
          
          return {
            id: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: productName,
            category: productCategory
          };
        })
      );
      
      console.log("Converted cart items:", cartItems);
      setCart(cartItems);
      
      toast({
        title: "Pedido cargado",
        description: "El último pedido se ha cargado correctamente",
        variant: "default"
      });
    } catch (error) {
      console.error("Error processing order items:", error);
      toast({
        title: "Error",
        description: "Error al procesar los items del pedido",
        variant: "destructive"
      });
    }
  };

  const handleHalfAndHalfConfirm = (firstHalf: Product, secondHalf: Product) => {
    const averagePrice = (firstHalf.price + secondHalf.price) / 2;
    const halfAndHalfPizza = {
      id: `half-${firstHalf.id}-${secondHalf.id}`,
      name: `Mitad ${firstHalf.name} / Mitad ${secondHalf.name}`,
      price: averagePrice,
      category: 'pizzas',
      quantity: 1,
    };
    setCart([...cart, halfAndHalfPizza]);
  };

  function getCategoryColor(category: { color?: string, name?: string }) {
    if (category.color) return category.color;

    const key = (category.name || '').toLowerCase();
    const mapping: Record<string, string> = {
      pizzas: '#F97316',
      entradas: '#0EA5E9',
      bebidas: '#8B5CF6',
      postres: '#D946EF',
    };
    return mapping[key] || '#8E9196';
  }

  const handleAddExtraIngredient = (itemIdx: number, ingredient: { id: string; name: string }) => {
    setCart(prev => {
      return prev.map((item, idx) => {
        if (idx === itemIdx) {
          const extras = item.extras || [];
          if (extras.some((e: any) => e.id === ingredient.id)) return item;
          return { ...item, extras: [...extras, { ...ingredient }] };
        }
        return item;
      });
    });
  };

  const productsToDisplay = isSearchActive ? searchResults : (productsByCategory[selectedCategory] || []);

  const renderOrderActionButtons = () => {
    return (
      <div className="p-4 border-t border-zinc-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {/* Pre-bill section */}
          {cart.length > 0 && (
            <div className="mb-4 border-b border-zinc-800 pb-4">
              <PreBillReceipt
                cart={cart}
                activeTable={activeTable}
                selectedCustomer={selectedCustomer}
                orderType={orderType}
                subtotal={subtotal}
                taxAmount={taxAmount}
                total={total}
              />
            </div>
          )}
        
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-zinc-400">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-400">IVA ({useTaxSettings().taxPercentage}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Botones de acción diferenciados por tipo de orden */}
          {orderType === 'mesa' ? (
            <div className="flex space-x-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                <Button 
                  className="bg-[#1A1A1A] hover:bg-[#252525] border border-orange-500/40 hover:border-orange-500 w-full h-12 text-white shadow-sm" 
                  onClick={() => setShowTableOrderManager(true)}
                >
                  <Save className="h-5 w-5 mr-2" />
                  Guardar
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                <Button 
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 w-full h-12 text-lg font-medium shadow-[0_0_15px_rgba(249,115,22,0.3)] border-0" 
                  onClick={() => setShowPaymentModal(true)}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pagar
                </Button>
              </motion.div>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 w-full h-12 text-lg font-medium shadow-[0_0_15px_rgba(249,115,22,0.3)] border-0" 
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Pagar
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  };

  const handleOrderSaved = () => {
    setCart([]);
    toast({
      title: "Orden guardada",
      description: "La orden ha sido guardada exitosamente",
      variant: "default"
    });
  };

  const handleLoadExistingOrder = async (order: any) => {
    try {
      const cartItems = order.items.map((item: any) => ({
        id: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        size: item.size || 'regular'
      }));
      
      setCart(cartItems);
      setActiveTable(order.tableNumber);
      
      if (order.customerId) {
        const customer = customers.find(c => c.id === order.customerId);
        if (customer) {
          setSelectedCustomer(customer);
        }
      }
      
      setOrderType('mesa');
      
      toast({
        title: "Orden cargada",
        description: `Orden de mesa ${order.tableNumber} cargada exitosamente`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error loading order:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la orden",
        variant: "destructive"
      });
    }
  };

  // Add this function that was referenced but not defined
  const getTableOrder = async (tableNumber: string | number) => {
    try {
      // Convert to string if it's a number
      const tableId = tableNumber.toString();
      
      const db = await initDB();
      const orders = await db.getAll('orders');
      
      const tableOrder = orders.find(order => 
        order.orderType === 'mesa' && 
        order.tableNumber === tableId && 
        order.status === 'saved'
      );
      
      return tableOrder || null;
    } catch (error) {
      console.error("Error getting table order:", error);
      return null;
    }
  };

  // Updated openOrderForTable function to handle both string and number types
  const openOrderForTable = (tableNumber: number | string) => {
    // Convert to string if it's a number
    const tableId = tableNumber.toString();
    setOrderType("mesa");
    setActiveTable(tableId);
    
    // Check for existing orders for this table
    const checkForExistingOrder = async () => {
      try {
        const existingOrder = await getTableOrder(tableId);
        if (existingOrder) {
          console.log("Found existing order for table:", existingOrder);
          // Set order details from existing order
          if (existingOrder.items && existingOrder.items.length > 0) {
            const cartItems = existingOrder.items.map((item: any) => ({
              id: item.productId,
              quantity: item.quantity,
              price: item.price,
              name: item.name,
              size: item.size || 'regular'
            }));
            setCart(cartItems);
          }
        }
      } catch (error) {
        console.error("Error checking for existing table order:", error);
      }
    };
    
    checkForExistingOrder();
  };

  // Check which tables have saved orders
  useEffect(() => {
    const checkSavedOrders = async () => {
      const tablesWithOrders: number[] = [];
      
      for (let i = 1; i <= tableCount; i++) {
        const order = await getTableOrder(i);
        if (order) {
          tablesWithOrders.push(i);
        }
      }
      
      setTablesWithOrders(tablesWithOrders);
      console.log("Tables with saved orders:", tablesWithOrders);
    };
    
    checkSavedOrders();
  }, [tableCount]);

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <div className="flex flex-col flex-1">
        <motion.div
          className="bg-[#111111] p-2 border-b border-zinc-950"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="flex items-center space-x-2 px-2">
            <MenuDrawer />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] w-48 justify-between shadow-sm transition-all duration-300"
                >
                  <span className="flex items-center">
                    {getOrderTypeIcon()}
                    {getOrderTypeLabel()}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-800 border-zinc-700 text-white">
                <DropdownMenuItem
                  className="hover:bg-zinc-700 focus:bg-zinc-700 cursor-pointer"
                  onClick={() => handleOrderTypeChange("mesa")}
                >
                  <Store className="h-4 w-4 mr-2" />
                  <span>Mesa</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-zinc-700 focus:bg-zinc-700 cursor-pointer"
                  onClick={() => handleOrderTypeChange("delivery")}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  <span>Delivery</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-zinc-700 focus:bg-zinc-700 cursor-pointer"
                  onClick={() => handleOrderTypeChange("takeaway")}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  <span>Para llevar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className={`bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] justify-between shadow-sm transition-all duration-300 ${
                selectedCustomer ? "border-green-500 text-green-400" : ""
              }`}
              onClick={() => setShowCustomerDialog(true)}
            >
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {selectedCustomer ? selectedCustomer.name : "Seleccionar Cliente"}
              </span>
            </Button>

            {orderType === "mesa" && activeTable && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="default"
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                  onClick={() => setShowTableSelectionModal(true)}
                >
                  Mesa {activeTable}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="bg-[#151515] p-2 border-b border-zinc-800 flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar por nombre o código de barras"
              className="pl-9 bg-[#1A1A1A] border-[#333333] focus:border-orange-500 text-white"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  clearSearch();
                }}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button 
            variant={isScannerActive ? "default" : "outline"}
            size="sm"
            onClick={toggleScanner}
            className={
              isScannerActive 
                ? "bg-orange-600 hover:bg-orange-700" 
                : "bg-[#1A1A1A] hover:bg-[#252525] border-[#333333]"
            }
            title={isScannerActive ? "Desactivar escáner" : "Activar escáner de código de barras"}
          >
            {isScannerActive ? (
              <Barcode className="h-4 w-4" />
            ) : (
              <ScanBarcode className="h-4 w-4" />
            )}
          </Button>
        </div>

        <motion.div
          className="bg-zinc-900 border-b border-zinc-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {isLoading ? (
            <div className="p-8 text-center">Cargando productos...</div>
          ) : (
            <Tabs value={selectedCategory} onValueChange={(isSearchActive ? (v) => { setSelectedCategory(v); clearSearch(); setSearchQuery(''); } : setSelectedCategory)} className="w-full">
              <TabsList className="bg-[#151515] p-0 h-14 w-full justify-start overflow-x-auto border-b border-[#222222]">
                {categories.map((cat) => {
                  const Icon = defaultIcons[(cat.name || '').toLowerCase()] || Tag;
                  const catColor = getCategoryColor(cat);
                  return (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className={`
                        data-[state=active]:text-white
                        px-6 h-full transition-all duration-300 hover:bg-[#252525] flex items-center gap-2
                      `}
                      style={{
                        ...(selectedCategory === cat.id && !isSearchActive
                          ? { background: catColor, color: '#fff' }
                          : {}),
                      }}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {cat.name}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <div className="p-4 bg-black">
                {isSearchActive && searchResults.length > 0 && (
                  <div className="mb-4">
                    <p className="text-orange-500 text-sm mb-2">
                      {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'} encontrados
                    </p>
                  </div>
                )}

                {isSearchActive && searchResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                    <Search className="h-8 w-8 mb-2" />
                    <p>No se encontraron productos</p>
                    <p className="text-sm mt-1">Intente con otro término de búsqueda</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {productsToDisplay.length > 0 ? (
                    productsToDisplay.map((prod, index) => {
                      const prodCategory = categories.find(c => c.id === (prod.categoryId || prod.category));
                      const borderColor = prodCategory ? getCategoryColor(prodCategory) : '#FF931E';
                      
                      return (
                        <motion.div
                          key={prod.id}
                          className={`
                            bg-[#1A1A1A] rounded-lg overflow-hidden cursor-pointer hover:bg-[#252525]
                            transition-all duration-300 shadow-md hover:shadow-[0_5px_15px_rgba(0,0,0,0.3)]
                            border-b-4 relative
                          `}
                          style={{
                            borderBottomColor: borderColor,
                            borderImage: `linear-gradient(to right, transparent, ${borderColor}, transparent) 1`
                          }}
                          onClick={e => {
                            if ((prod.category === 'pizzas' || prod.categoryId === 'cat_pizza') && (e.ctrlKey || e.metaKey)) {
                              setShowHalfAndHalfDialog(true);
                              setSelectedPizzas(productsByCategory['cat_pizza'] || []);
                            } else {
                              handleAddToCart(prod);
                            }
                          }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {prod.image ? (
                            <div className="relative">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-full h-32 object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                                <span className="text-lg font-bold">
                                  {prod.name}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 flex flex-col items-center">
                              <h3 className="font-medium text-center">{prod.name}</h3>
                            </div>
                          )}
                          
                          {prod.barcode && (
                            <div className="absolute top-2 right-2 bg-zinc-800/80 px-2 py-1 rounded text-xs flex items-center">
                              <Barcode className="h-3 w-3 mr-1 text-orange-500" />
                              <span className="text-zinc-300">{prod.barcode}</span>
                            </div>
                          )}
                          
                          {(prod.category === 'pizzas' || prod.categoryId === 'cat_pizza') && (
                            <div className="absolute top-2 right-2 flex items-center space-x-1">
                              <div 
                                className="bg-orange-500/20 p-1 rounded-full hover:bg-orange-500/40 transition-all"
                                title="Mitad y Mitad"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowHalfAndHalfDialog(true);
                                  setSelectedPizzas(productsByCategory['cat_pizza'] || []);
                                }}
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="20" 
                                  height="20" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  className="text-orange-500"
                                >
                                  <path d="M12 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8V2Z"/>
                                  <path d="M2 12h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2v-12Z"/>
                                </svg>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  ) : (
                    !isSearchActive && (
                      <div className="text-center text-zinc-500 w-full col-span-4">
                        No hay productos en esta categoría.
                      </div>
                    )
                  )}
                </div>
              </div>
            </Tabs>
          )}
        </motion.div>
      </div>

      <motion.div
        className="w-96 bg-[#111111] border-l border-zinc-950 flex flex-col shadow-[-5px_0_15px_rgba(0,0,0,0.2)]"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-4 border-b border-zinc-950 flex items-center justify-between bg-gradient-to-r from-[#151515] to-[#111111]">
          <div className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-orange-500" />
            <h2 className="text-lg font-bold">Orden</h2>
          </div>
          <div className="flex items-center space-x-2">
            {orderType === "mesa" && activeTable && <Badge className="bg-orange-600">Mesa {activeTable}</Badge>}
            {orderType === "delivery" && <Badge className="bg-blue-600">Delivery</Badge>}
            {orderType === "takeaway" && <Badge className="bg-green-600">Para llevar</Badge>}
            {selectedCustomer && (
              <Badge className="bg-emerald-600">
                <User className="h-3 w-3 mr-1" />
                Cliente
              </Badge>
            )}
          </div>
        </div>

        {selectedCustomer && (
          <div className="px-4 py-2 border-b border-zinc-950 bg-[#151515]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{selectedCustomer.name}</p>
                <p className="text-xs text-zinc-400">{selectedCustomer.phone}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-zinc-400 hover:text-white hover:bg-[#252525]"
                onClick={() => setSelectedCustomer(null)}
              >
                Cambiar
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center h-full text-zinc-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                <ShoppingCart className="h-12 w-12 mb-2" />
              </motion.div>
              <p>Carrito vacío</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {cart.map((item, idx) => {
                  let extrasTotal = 0;
                  if (item.extras && Array.isArray(item.extras) && item.extras.length > 0) {
                    extrasTotal = item.extras.reduce((sum: number, ext: any) => sum + (ext.price ? ext.price : 0), 0);
                  }
                  const itemUnitTotal = item.price + extrasTotal;
                  const itemRowTotal = itemUnitTotal * item.quantity;

                  return (
                    <motion.div
                      key={item.id + (item.size || "") + idx}
                      className={`bg-[#1A1A1A] rounded-lg p-3 border border-[#333333] shadow-sm hover:shadow-md transition-all duration-300 relative`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3 }}
                      layout
                      style={{
                        borderBottomWidth: 4,
                        borderBottomColor:
                          item.category && (
                            (() => {
                              const colorMap: Record<string, string> = {
                                pizzas: "#F97316",
                                entradas: "#0EA5E9",
                                bebidas: "#8B5CF6",
                                postres: "#D946EF",
                              };
                              return colorMap[item.category] || "#FF931E";
                            })()
                          ),
                        borderBottomStyle: "solid",
                        boxShadow: "0 4px 22px 0 rgba(249,115,22,0.06)"
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-zinc-400">
                            {item.size || "Regular"}
                          </p>
                          {item.extras && item.extras.length > 0 && (
                            <ul className="text-xs mt-2">
                              {item.extras.map((extra: any) => (
                                <li
                                  key={extra.id}
                                  className="text-orange-300 bg-[#222]/60 px-2 py-0.5 rounded mb-1 inline-block mr-1"
                                >
                                  + {extra.name}
                                  {typeof extra.price === "number" && (
                                    <span className="ml-1 text-purple-300 font-bold">(${extra.price})</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                          {/* Display the note if it exists */}
                          {item.notes && (
                            <div className="mt-2 text-xs bg-purple-500/20 border border-purple-400/20 p-2 rounded text-purple-300 flex items-start">
                              <StickyNote className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                              <span>{item.notes}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {/* Comment button */}
                          <button
                            type="button"
                            className={`p-1 rounded-full ${
                              item.notes 
                                ? "bg-purple-600/40 hover:bg-purple-500/60 border border-purple-500"
                                : "bg-[#333]/40 hover:bg-[#444]/60 border border-[#444]"
                            } transition-colors shadow`}
                            onClick={() => setNoteDialogConfig({ 
                              open: true, 
                              itemIdx: idx,
                              initialNote: item.notes || ""
                            })}
                            title={item.notes ? "Editar comentario" : "Agregar comentario"}
                          >
                            <StickyNote className={`h-4 w-4 ${item.notes ? "text-purple-300" : "text-zinc-400"}`} />
                          </button>
                          
                          {(item.category === "pizzas" || item.categoryId === "cat_pizza") && (
                            <button
                              type="button"
                              className="p-1 rounded-full bg-orange-700/20 hover:bg-orange-600/60 transition-colors shadow border border-orange-700"
                              onClick={() => setExtraModal({ open: true, itemIdx: idx })}
                              title="Agregar extra"
                            >
                              <span>
                                <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.5" fill="#F97316"/>
                                  <path d="M9 12H15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                                  <path d="M12 15V9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              </span>
                            </button>
                          )}
                          <motion.button
                            className="text-zinc-400 hover:text-red-500"
                            onClick={() => handleRemoveItem(item.id)}
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center space-x-2">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 bg-zinc-700 hover:bg-zinc-600 hover:border-orange-500"
                              onClick={() => handleQuantityChange(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </motion.div>
                          <span>{item.quantity}</span>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 bg-zinc-700 hover:bg-zinc-600 hover:border-orange-500"
                              onClick={() => handleQuantityChange(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        </div>
                        <span className="font-bold">${itemRowTotal.toFixed(2)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {renderOrderActionButtons()}
      </motion.div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        onPaymentComplete={handlePaymentComplete}
        cart={cart}
        orderType={orderType}
        activeTable={activeTable}
        selectedCustomer={selectedCustomer}
      />

      <TableOrderManager
        isOpen={showTableOrderManager}
        onClose={() => setShowTableOrderManager(false)}
        cart={cart}
        selectedCustomer={selectedCustomer}
        activeTable={activeTable}
        onOrderSaved={handleOrderSaved}
        onLoadExistingOrder={handleLoadExistingOrder}
      />

      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="sm:max-w-md bg-[#111111] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Seleccionar Cliente</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Buscar por nombre o teléfono"
                  className="pl-8 bg-[#1A1A1A] border-[#333333] focus:border-orange-500 text-white placeholder:text-zinc-500"
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] text-white"
                onClick={() => setShowCreateCustomerDialog(true)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <motion.div
                    key={customer.id}
                    className="bg-[#1A1A1A] p-3 rounded-lg border border-[#333333] cursor-pointer hover:bg-[#252525] hover:border-orange-500/50 text-white"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 cursor-pointer" onClick={() => handleSelectCustomer(customer)}>
                        <p className="font-medium text-white">{customer.name}</p>
                        <p className="text-sm text-zinc-400">{customer.phone}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-[#252525] text-zinc-300">
                          {customer.orders.length} {customer.orders.length === 1 ? "orden" : "órdenes"}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-4 text-zinc-500">
                  <p>No se encontraron clientes</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomerDialog(false)}
              className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] text-white"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateCustomerDialog
        isOpen={showCreateCustomerDialog}
        onClose={() => setShowCreateCustomerDialog(false)}
        onCustomerCreated={handleCustomerCreated}
      />

      <HalfAndHalfDialog
        isOpen={showHalfAndHalfDialog}
        onClose={() => setShowHalfAndHalfDialog(false)}
        pizzas={productsByCategory['cat_pizza'] || []}
        onConfirm={handleHalfAndHalfConfirm}
      />

      <AddExtraIngredientModal
        open={extraModal.open}
        onClose={() => setExtraModal({ open: false, itemIdx: null })}
        onAdd={ingredient => {
          if (extraModal.itemIdx !== null) {
            handleAddExtraIngredient(extraModal.itemIdx, ingredient);
          }
        }}
      />

      <TableSelectionModal 
        isOpen={showTableSelectionModal}
        onClose={() => setShowTableSelectionModal(false)}
        tableCount={tableCount}
        activeTable={activeTable}
        tableWithOrders={tableWithOrders}
        onSelectTable={handleSelectTable}
      />

      <ItemNoteDialog 
        open={noteDialogConfig.open} 
        onClose={() => setNoteDialogConfig({ open: false, itemIdx: null, initialNote: "" })} 
        itemIndex={noteDialogConfig.itemIdx || 0}
        initialNote={noteDialogConfig.initialNote}
      />
    </div>
  );
}
