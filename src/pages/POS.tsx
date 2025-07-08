import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getBusinessInfoForReceipt } from '@/utils/ticketUtils';
import { getBusinessLogo, BusinessLogo } from '@/utils/logoStorageUtils';
import { Mic, X, Plus, Minus, ShoppingCart, CreditCard, Banknote, ArrowDownToLine, Printer, ClipboardList, GridIcon, Search, LogOut, Menu, ExternalLink, Divide, UserPlus, Weight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardImage } from '@/components/ui/card';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { useNavigate } from 'react-router-dom';
import { generateTicketNumber } from '@/utils/ticketUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { CustomerSelector } from '@/components/CustomerSelector';
import CustomerDisplayRedirect from '@/components/CustomerDisplayRedirect';
import SaleTypeSelector, { SaleType, SALE_TYPES } from '@/components/SaleTypeSelector';
import TenantSecurityMonitor from '@/components/TenantSecurityMonitor';

interface Product {
  id: string;
  name: string;
  price: number;
  code?: string;
  stock?: number;
  image_url?: string;
  category?: string;
  is_weight_based?: boolean;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
  notes?: string;
}

type PaymentMethod = 'card' | 'cash' | 'transfer';
type ViewMode = 'voice' | 'traditional';

interface PaymentPart {
  method: PaymentMethod;
  amount: number;
}

interface BusinessInfo {
  businessName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  currency: string;
  modoFood?: boolean;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};

const POS = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('traditional');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processingVoice, setProcessingVoice] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [changeAmount, setChangeAmount] = useState<number | null>(null);
  const { user, signOut, tenantId } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [printType, setPrintType] = useState<'comanda' | 'recibo' | null>(null);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();
  const [ticketNumber, setTicketNumber] = useState<string>('001');
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [currentWeightProduct, setCurrentWeightProduct] = useState<Product | null>(null);
  const [productWeight, setProductWeight] = useState<string>('');
  const [completedCartItems, setCompletedCartItems] = useState<CartItem[]>([]);
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCart, setShowCart] = useState(!isMobile);
  const [customerDisplayWindow, setCustomerDisplayWindow] = useState<Window | null>(null);
  const [showSplitPaymentDialog, setShowSplitPaymentDialog] = useState(false);
  const [paymentParts, setPaymentParts] = useState<PaymentPart[]>([]);
  const [currentSplitMethod, setCurrentSplitMethod] = useState<PaymentMethod>('cash');
  const [currentSplitAmount, setCurrentSplitAmount] = useState<string>('');
  const [remainingAmount, setRemainingAmount] = useState<number>(0);
  const [showRemainingAmount, setShowRemainingAmount] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [showCustomerDisplay, setShowCustomerDisplay] = useState(false);
  const [selectedSaleType, setSelectedSaleType] = useState<SaleType>('Normal');
  const [cashierName, setCashierName] = useState<string>('Cajero');
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<string>('');
  const [dynamicBusinessInfo, setDynamicBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    address: '',
    phone: '',
    receiptFooter: 'Gracias por su compra',
    currency: 'CLP'
  });
  const [businessLogo, setBusinessLogo] = useState<BusinessLogo | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Validar contexto de tenant antes de cargar productos
        if (!tenantId) {
          console.error("TENANT_SECURITY_ERROR: No tenant_id available for loading products");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('tenant_id', tenantId);
        
        if (error) {
          throw error;
        }
        
        const filteredData = data?.filter(product => 
          !product.name.startsWith('__category_placeholder__')) || [];
        
        setProducts(filteredData);
        setFilteredProducts(filteredData);
        
        const uniqueCategories = [...new Set(filteredData?.map(product => product.category).filter(Boolean))];
        setCategories(uniqueCategories as string[]);
        
        console.log("Productos cargados para tenant:", tenantId, filteredData);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        toast("Error", {
          description: "No se pudieron cargar los productos",
          style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [tenantId]);

  // Load business info
  useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        const info = await getBusinessInfoForReceipt();
        setDynamicBusinessInfo(info);

        // Load business logo
        if (tenantId) {
          const logo = await getBusinessLogo(tenantId);
          setBusinessLogo(logo);
        }
      } catch (error) {
        console.error('Error loading business info:', error);
      }
    };
    
    loadBusinessInfo();
  }, [tenantId]);

  useEffect(() => {
    let filtered = products;
    
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const currentDate = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  const cartTotal = cartItems.reduce((total, item) => total + item.subtotal, 0);

  const toggleCart = () => {
    setShowCart(prev => !prev);
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const exactCodeMatch = products.find(product => 
        product.code && product.code.trim() === searchTerm.trim()
      );
      
      if (exactCodeMatch) {
        addToCart(exactCodeMatch);
        setSearchTerm('');
        toast("Producto añadido", {
          description: `Se añadió "${exactCodeMatch.name}" al carrito`
        });
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= 4) {
      const exactCodeMatch = products.find(product => 
        product.code && product.code === value
      );
      
      if (exactCodeMatch) {
        addToCart(exactCodeMatch);
        setSearchTerm('');
        toast("Producto añadido", {
          description: `Se añadió "${exactCodeMatch.name}" al carrito`
        });
      }
    }
  };

  const startListening = () => {
    setListening(true);
    setTranscript('');

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast("No soportado", {
        description: "Tu navegador no soporta reconocimiento de voz",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      setListening(false);
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast("No soportado", {
        description: "Tu navegador no soporta reconocimiento de voz",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      setListening(false);
      return;
    }
    
    const recognition = new SpeechRecognitionAPI();
    
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setTranscript(transcript);
      processVoiceCommand(transcript);
    };
    
    recognition.onerror = (event) => {
      console.error('Error en reconocimiento de voz:', event.error);
      setListening(false);
      toast("Error", {
        description: "Error en el reconocimiento de voz",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
    };
    
    recognition.onend = () => {
      setListening(false);
    };
    
    recognition.start();
  };

  const findProductMatches = (command: string, products: Product[]) => {
    const foundProducts: {product: Product, quantity: number}[] = [];
    
    console.log("Comando recibido:", command);
    console.log("Productos disponibles:", products);
    
    const normalizeText = (text: string) => {
      return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };
    
    const normalizedCommand = normalizeText(command);
    
    const commonWords = ['dame', 'quiero', 'ponme', 'por', 'favor', 'necesito', 'me', 'da', 'das', 'de', 'y', 'una', 'un', 'unas', 'unos', 'la', 'las', 'el', 'los'];
    
    const segments = normalizedCommand
      .replace(/\sy\s|\scon\s|,/g, '|')
      .split('|')
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0);
    
    console.log("Segmentos del comando:", segments);
    
    segments.forEach(segment => {
      const words = segment.split(' ')
        .filter(word => !commonWords.includes(word) && word.length > 2);
      
      const quantity = extractQuantity(segment);
      
      console.log(`Procesando segmento: "${segment}", palabras clave:`, words, `cantidad detectada: ${quantity}`);
      
      let foundInSegment = false;
      
      products.forEach(product => {
        const productNameLower = product.name.toLowerCase();
        const normalizedProductName = normalizeText(productNameLower);
        
        if (segment.includes(normalizedProductName)) {
          foundProducts.push({ product, quantity });
          console.log(`Coincidencia exacta en segmento para: ${product.name}, cantidad: ${quantity}`);
          foundInSegment = true;
          return;
        }
      });
      
      if (!foundInSegment) {
        products.forEach(product => {
          const productNameLower = product.name.toLowerCase();
          const normalizedProductName = normalizeText(productNameLower);
          const productWords = normalizedProductName.split(' ');
          
          if (productWords.length > 1) {
            for (let i = 0; i < productWords.length - 1; i++) {
              const twoWordPhrase = productWords.slice(i, i+2).join(' ');
              if (segment.includes(twoWordPhrase)) {
                foundProducts.push({ product, quantity });
                console.log(`Coincidencia parcial en segmento para: ${product.name}, frase: ${twoWordPhrase}, cantidad: ${quantity}`);
                foundInSegment = true;
                return;
              }
            }
          }
          
          let matchCount = 0;
          productWords.forEach(productWord => {
            if (productWord.length >= 3 && words.some(word => word.includes(productWord) || productWord.includes(word))) {
              matchCount++;
            }
          });
          
          if ((productWords.length > 1 && matchCount >= 1) || 
              (productWords.length === 1 && matchCount === 1)) {
            foundProducts.push({ product, quantity });
            console.log(`Coincidencia de palabras en segmento para: ${product.name}, cantidad: ${quantity}`);
            foundInSegment = true;
          }
        });
      }
    });
    
    return foundProducts;
  };

  const extractQuantity = (command: string): number => {
    const numberWords: {[key: string]: number} = {
      'un': 1, 'una': 1, 'uno': 1,
      'dos': 2,
      'tres': 3,
      'cuatro': 4,
      'cinco': 5,
      'seis': 6,
      'siete': 7,
      'ocho': 8,
      'nueve': 9,
      'diez': 10,
      'once': 11,
      'doce': 12
    };
    
    const words = command.split(' ');
    
    for (let i = 0; i < Math.min(2, words.length); i++) {
      const word = words[i].trim().toLowerCase();
      if (numberWords[word]) {
        return numberWords[word];
      }
    }
    
    const numericPattern = /\b(\d+)\b/;
    const match = command.match(numericPattern);
    if (match && match[1]) {
      const num = parseInt(match[1]);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
    
    return 1;
  };

  const processVoiceCommand = (command: string) => {
    setProcessingVoice(true);
    
    try {
      console.log("Procesando comando de voz:", command);
      
      const foundProducts = findProductMatches(command, products);
      
      if (foundProducts.length > 0) {
        foundProducts.forEach(({ product, quantity }) => {
          addToCart(product, quantity);
        });
        
        const productNames = foundProducts.map(fp => 
          `${fp.quantity} ${fp.product.name}`
        ).join(', ');
        
        toast("Productos añadidos", {
          description: `Se añadió: ${productNames}`
        });
      } else {
        toast("No se encontraron productos", {
          description: "Intenta de nuevo con otro producto"
        });
      }
    } catch (error) {
      console.error('Error al procesar comando de voz:', error);
      toast("Error", {
        description: "No se pudo procesar el comando de voz",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
    } finally {
      setProcessingVoice(false);
    }
  };

  const parseNumber = (word: string): number => {
    const numberWords: {[key: string]: number} = {
      'un': 1, 'una': 1, 'uno': 1,
      'dos': 2,
      'tres': 3,
      'cuatro': 4,
      'cinco': 5,
      'seis': 6,
      'siete': 7,
      'ocho': 8,
      'nueve': 9,
      'diez': 10,
      'once': 11,
      'doce': 12
    };
    
    if (numberWords[word]) {
      return numberWords[word];
    }
    
    const num = parseInt(word);
    return isNaN(num) ? 0 : num;
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setSaleCompleted(false);
    setCurrentSaleId(null);
    
    if (product.is_weight_based) {
      setCurrentWeightProduct(product);
      setProductWeight('');
      setShowWeightDialog(true);
      return;
    }
    
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity,
          subtotal: parseFloat((product.price * newQuantity).toFixed(0))
        };
        return updatedItems;
      } else {
        return [...prevItems, {
          ...product,
          quantity,
          subtotal: parseFloat((product.price * quantity).toFixed(0))
        }];
      }
    });
  };

  const addWeightBasedProduct = () => {
    if (!currentWeightProduct || !productWeight) return;
    
    const weight = parseFloat(productWeight);
    if (isNaN(weight) || weight <= 0) {
      toast("Error", {
        description: "Ingrese un peso válido",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      return;
    }
    
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === currentWeightProduct.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        const newQuantity = updatedItems[existingItemIndex].quantity + weight;
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity,
          subtotal: parseFloat((currentWeightProduct.price * newQuantity).toFixed(0))
        };
        return updatedItems;
      } else {
        return [...prevItems, {
          ...currentWeightProduct,
          quantity: weight,
          subtotal: parseFloat((currentWeightProduct.price * weight).toFixed(0))
        }];
      }
    });
    
    toast("Producto añadido", {
      description: `Se añadió ${weight}kg de "${currentWeightProduct.name}" al carrito`
    });
    
    setShowWeightDialog(false);
    setCurrentWeightProduct(null);
    setProductWeight('');
  };

  const removeFromCart = (productId: string) => {
    setSaleCompleted(false);
    setCurrentSaleId(null);
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setSaleCompleted(false);
    setCurrentSaleId(null);
    
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === productId) {
          return {
            ...item,
            quantity: newQuantity,
            subtotal: parseFloat((item.price * newQuantity).toFixed(2))
          };
        }
        return item;
      });
    });
  };

  const finalizePedido = async () => {
    if (cartItems.length === 0) return;
    
    try {
      const { ticketNumber: newTicketNumber, error: ticketError } = await generateTicketNumber();
      if (ticketError) {
        console.warn('Ticket number generation issue:', ticketError);
      }
      setTicketNumber(newTicketNumber);
      
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{ 
          total: cartTotal,
          payment_method: 'cash',
          status: 'completed',
          date: new Date().toISOString(),
          customer_id: selectedCustomerId,
          sale_type: selectedSaleType,
          tenant_id: tenantId
        }])
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      const saleItems = cartItems.map(item => ({
        sale_id: sale.id,
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
      
      for (const item of cartItems) {
        if (item.stock !== undefined) {
          const newStock = Math.max(0, item.stock - item.quantity);
          
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.id);
          
          if (stockError) throw stockError;
        }
      }
      
      setCompletedCartItems([...cartItems]);
      
      setSaleCompleted(true);
      setCurrentSaleId(sale.id);
      
      setCartItems([]);
      
      toast("Venta completada", {
        description: `Venta por $${cartTotal.toFixed(2)} registrada con éxito`
      });
    } catch (error) {
      console.error('Error al finalizar venta:', error);
      toast("Error", {
        description: "No se pudo completar la venta",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
    }
  };

  const handleSplitPaymentClick = () => {
    if (cartItems.length === 0) return;
    
    setPaymentParts([]);
    setCurrentSplitMethod('cash');
    setCurrentSplitAmount('');
    setRemainingAmount(cartTotal);
    setShowRemainingAmount(true);
    setShowSplitPaymentDialog(true);
  };

  const addPaymentPart = () => {
    const amount = parseFloat(currentSplitAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast("Error", {
        description: "Ingrese un monto válido",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      return;
    }
    
    if (amount > remainingAmount) {
      toast("Error", {
        description: "El monto no puede ser mayor al restante",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      return;
    }
    
    setPaymentParts(prev => [...prev, {
      method: currentSplitMethod,
      amount: amount
    }]);
    
    setRemainingAmount(prev => prev - amount);
    
    setCurrentSplitAmount('');
  };

  const removePaymentPart = (index: number) => {
    const partAmount = paymentParts[index].amount;
    
    setPaymentParts(prev => prev.filter((_, i) => i !== index));
    setRemainingAmount(prev => prev + partAmount);
  };

  const processSplitPayment = async () => {
    if (paymentParts.length === 0) {
      toast("Error", {
        description: "Debe agregar al menos un método de pago",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      return;
    }
    
    if (remainingAmount > 0) {
      toast("Error", {
        description: "Debe cubrir el monto total de la venta",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      const { ticketNumber: newTicketNumber, error: ticketError } = await generateTicketNumber();
      if (ticketError) {
        console.warn('Ticket number generation issue:', ticketError);
      }
      setTicketNumber(newTicketNumber);
      
      const primaryPayment = [...paymentParts].sort((a, b) => b.amount - a.amount)[0];
      
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{ 
          total: cartTotal,
          payment_method: paymentParts.length > 1 ? 'mixed' : primaryPayment.method,
          status: 'completed',
          date: new Date().toISOString(),
          customer_id: selectedCustomerId,
          sale_type: selectedSaleType,
          tenant_id: tenantId
        }])
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      const saleItems = cartItems.map(item => ({
        sale_id: sale.id,
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
      
      for (const item of cartItems) {
        if (item.stock !== undefined) {
          const newStock = Math.max(0, item.stock - item.quantity);
          
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.id);
          
          if (stockError) throw stockError;
        }
      }
      
      setCompletedCartItems([...cartItems]);
      setSaleCompleted(true);
      setCurrentSaleId(sale.id);
      setCartItems([]);
      setShowSplitPaymentDialog(false);
      
      toast("Venta completada", {
        description: `Venta por ${formatPrice(cartTotal)} registrada con éxito`
      });
      
      setShowPrintDialog(true);
    } catch (error) {
      console.error('Error al finalizar venta:', error);
      toast("Error", {
        description: "No se pudo completar la venta"
      });
      setSaleCompleted(false);
      setCurrentSaleId(null);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentClick = () => {
    if (cartItems.length === 0) return;
    setShowPaymentDialog(true);
    setSelectedPayment(null);
    setCashAmount('');
    setChangeAmount(null);
    setSaleCompleted(false);
  };

  const handleCashInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCashAmount(value);
    
    const amount = parseFloat(value);
    if (!isNaN(amount)) {
      const change = amount - cartTotal;
      setChangeAmount(change >= 0 ? change : null);
    } else {
      setChangeAmount(null);
    }
  };

  const handlePaymentSelect = async (method: PaymentMethod) => {
    setSelectedPayment(method);
    
    if (method !== 'cash' || (parseFloat(cashAmount) >= cartTotal)) {
      processPayment(method);
    }
  };
  
  const processPayment = async (method: PaymentMethod) => {
    setProcessingPayment(true);
    
    // Set payment method for receipt
    const paymentMethodNames = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia'
    };
    setCurrentPaymentMethod(paymentMethodNames[method]);
    
    try {
      const { ticketNumber: newTicketNumber, error: ticketError } = await generateTicketNumber();
      if (ticketError) {
        console.warn('Ticket number generation issue:', ticketError);
      }
      setTicketNumber(newTicketNumber);
      
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{ 
          total: cartTotal,
          payment_method: method,
          status: 'completed',
          date: new Date().toISOString(),
          customer_id: selectedCustomerId,
          sale_type: selectedSaleType
        }])
        .select()
        .single();
      
      if (saleError) {
        console.error('Sales insert error:', saleError);
        throw saleError;
      }
      
      const saleItems = cartItems.map(item => ({
        sale_id: sale.id,
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
      
      for (const item of cartItems) {
        if (item.stock !== undefined) {
          const newStock = Math.max(0, item.stock - item.quantity);
          
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.id);
          
          if (stockError) throw stockError;
        }
      }
      
      setCompletedCartItems([...cartItems]);
      
      setSaleCompleted(true);
      setCurrentSaleId(sale.id);
      
      setCartItems([]);
      
      setShowPaymentDialog(false);
      
      const paymentMessage = method === 'cash' && changeAmount !== null ? 
        `Venta por $${cartTotal.toFixed(2)} con ${getPaymentMethodName(method)}. Cambio: $${changeAmount.toFixed(2)}` :
        `Venta por $${cartTotal.toFixed(2)} con ${getPaymentMethodName(method)} registrada con éxito`;
      
      toast("Venta completada", {
        description: paymentMessage
      });
      
      setShowPrintDialog(true);
    } catch (error) {
      console.error('Error al finalizar venta:', error);
      toast("Error", {
        description: "No se pudo completar la venta"
      });
      setSaleCompleted(false);
      setCurrentSaleId(null);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getPaymentMethodName = (method: PaymentMethod | 'mixed'): string => {
    switch (method) {
      case "card": return 'Tarjeta';
      case "cash": return 'Efectivo';
      case "transfer": return 'Transferencia';
      case "mixed": return 'Pago Mixto';
      default: return '';
    }
  };

  const PaymentMethodButton = ({ 
    method, 
    icon, 
    label
  }: { 
    method: PaymentMethod; 
    icon: React.ReactNode; 
    label: string 
  }) => (
    <Button
      onClick={() => handlePaymentSelect(method)}
      disabled={processingPayment}
      className="flex-1 h-24 flex flex-col items-center justify-center gap-2 p-4"
      variant={selectedPayment === method ? "default" : "outline"}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );

  const SplitPaymentMethodButton = ({ 
    method, 
    icon, 
    label
  }: { 
    method: PaymentMethod; 
    icon: React.ReactNode; 
    label: string 
  }) => (
    <Button
      onClick={() => setCurrentSplitMethod(method)}
      className="flex-1 h-16 flex flex-col items-center justify-center gap-1 p-2"
      variant={currentSplitMethod === method ? "default" : "outline"}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );

  const businessName = user?.user_metadata?.businessName || 'Venta POS';

  const handlePrintComanda = () => {
    if (!saleCompleted || !currentSaleId) {
      toast("No hay venta completada", {
        description: "Debe finalizar una venta antes de imprimir la comanda",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      return;
    }
    
    setPrintType('comanda');
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const handlePrintRecibo = () => {
    if (!saleCompleted || !currentSaleId) {
      toast("No hay venta completada", {
        description: "Debe finalizar una venta antes de imprimir el recibo",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      return;
    }
    
    setPrintType('recibo');
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const originalContent = document.body.innerHTML;
    const printSection = printContent.innerHTML;
    
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast("Error", {
        description: "No se pudo abrir la ventana de impresión. Verifique que no esté bloqueada por su navegador.",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      return;
    }
    
    const receiptTotal = completedCartItems.reduce((total, item) => total + item.subtotal, 0);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Impresión</title>
            <style>
  @page {
    size: 80mm auto;
    margin: 0;
  }
  body {
    font-family: 'Arial', 'Verdana', 'Tahoma', sans-serif;
    width: 80mm;
    margin: 0;
    padding: 0;
    font-size: 14px;
    background: #fff;
  }
  .receipt {
    padding: 10px 5px;
    width: 100%;
    box-sizing: border-box;
  }
  .receipt-header {
    text-align: center;
    margin-bottom: 15px;
  }
  .receipt-title {
    font-size: 15px;
    font-weight: bold;
    padding: 5px;
    margin-bottom: 5px;
    background: #000;
    color: #fff;
    text-align: center;
    letter-spacing: 1px;
  }
  .receipt-business {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 2px;
  }
  .receipt-subtitle,
  .receipt-info {
    font-size: 12px;
    margin-bottom: 5px;
  }
  .receipt-ticketNumber {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 5px;
  }
  .receipt-separator {
    border-top: 1px dashed #000;
    margin: 8px 0;
    width: 100%;
  }
  .receipt-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  .receipt-table th {
    font-size: 12px;
    text-align: left;
    border-bottom: 1px dashed #000;
    text-transform: uppercase
    padding-bottom: 3px;
    font-family: 'Arial', 'Verdana', 'Tahoma', sans-serif;
  }
  .receipt-table td {
    font-size: 12px;
    text-transform: uppercase;
    padding: 3px 0;
  }
  .receipt-total {
    text-align: right;
    margin-top: 10px;
    font-size: 12px;
    font-weight: bold;
  }
  .receipt-footer {
    text-align: center;
    margin-top: 15px;
    font-size: 10px;
  }
  .right-align {
    text-align: right;
  }
  .center-align {
    text-align: center;
  }
</style>
        </head>
        <body>${printSection}</body>
      </html>
    `);
    
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      
      setPrintType(null);
    }, 300);
  };

  const startNewSale = () => {
    setCartItems([]);
    setCompletedCartItems([]);
    setSaleCompleted(false);
    setCurrentSaleId(null);
    setShowPrintDialog(false);
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'voice' ? 'traditional' : 'voice');
    setSelectedCategory('all');
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md flex flex-col h-full overflow-hidden bg-[#F1F0FB]"
      onClick={() => addToCart(product)}
    >
      <CardImage 
        imageUrl={product.image_url} 
      />
      <div className="p-3">
        <div className="flex-1 mb-1">
          <h3 className="font-medium text-sm truncate">{product.name}</h3>
          <div className="text-xs text-gray-500">
            {product.stock !== undefined && (
              <span className={`font-medium ${
                product.stock > 5 
                  ? 'text-green-600' 
                  : product.stock > 0 
                    ? 'text-amber-600' 
                    : 'text-red-600'
              }`}>
                Stock: {product.stock}
              </span>
            )}
          </div>
        </div>
        <div className="font-semibold text-base mt-1">
          {formatPrice(product.price)}
        </div>
      </div>
    </Card>
  );

  const openCustomerDisplay = () => {
    if (customerDisplayWindow && !customerDisplayWindow.closed) {
      customerDisplayWindow.focus();
    } else {
      const newWindow = window.open('/pantalla2', 'CustomerDisplay', 'width=800,height=600');
      setCustomerDisplayWindow(newWindow);
      
      if (newWindow && cartItems.length > 0) {
        setTimeout(() => {
          supabase
            .channel('customer-display')
            .send({
              type: 'broadcast',
              event: 'cart-update',
              payload: { 
                items: cartItems,
                total: cartTotal
              }
            });
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (cartItems.length > 0) {
      supabase
        .channel('customer-display')
        .send({
          type: 'broadcast',
          event: 'cart-update',
          payload: { 
            items: cartItems,
            total: cartTotal
          }
        });
    }
  }, [cartItems, cartTotal]);

  const handleCustomerSelect = (customerId: string | null, customerName?: string) => {
    setSelectedCustomerId(customerId);
    if (customerName) {
      setSelectedCustomerName(customerName);
    } else {
      setSelectedCustomerName('');
    }
  };

  const handleShowPrintDialog = async () => {
    if (!saleCompleted || !currentSaleId) {
      toast("No hay venta completada", {
        description: "Debe finalizar una venta antes de imprimir",
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      return;
    }
    setShowPrintDialog(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {!isMobile ? (
        <Sidebar />
      ) : (
        <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
          <SheetContent side="left" className="p-0 w-[250px]">
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TenantSecurityMonitor />
        <header className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-black/20 px-4 py-2 flex items-center justify-between">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)} className="dark:text-gray-200 dark:hover:bg-gray-800">
              <Menu size={20} />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{businessName}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{currentDate}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="min-w-[200px]">
              <CustomerSelector 
                onCustomerSelect={handleCustomerSelect} 
                selectedCustomerId={selectedCustomerId} 
              />
            </div>
    
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleViewMode}
              className="flex items-center gap-1 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {viewMode === 'voice' ? <GridIcon size={16} /> : <Mic size={16} />}
              <span className={isMobile ? "sr-only" : ""}>{viewMode === 'voice' ? 'Tradicional' : 'Por Voz'}</span>
            </Button>
            
            {isMobile && (
              <Button
                variant="outline"
                size="icon"
                onClick={toggleCart}
                className="relative dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <ShoppingCart size={20} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-500 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </header>
        
        <div className="flex-1 flex overflow-hidden">
          <main className={`flex-1 overflow-y-auto scrollbar-thin p-4 bg-gray-50 dark:bg-gray-900 ${isMobile && showCart ? 'hidden' : 'block'}`}>
            <div className="mb-4 flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder={isMobile ? "Buscar..." : "Buscar productos por nombre o código..."}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              
              {viewMode === 'traditional' && (
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className={`${isMobile ? 'w-[100px]' : 'w-[180px]'} dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200`}>
                    <SelectValue placeholder="Categorías" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="all" className="dark:text-gray-200 dark:focus:bg-gray-700">Todas</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="dark:text-gray-200 dark:focus:bg-gray-700">{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {viewMode === 'traditional' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer transition-all hover:shadow-md flex flex-col h-full overflow-hidden bg-[#F1F0FB] dark:bg-gray-800 dark:hover:shadow-black/40 dark:border-gray-700"
                    onClick={() => addToCart(product)}
                  >
                    <CardImage 
                      imageUrl={product.image_url} 
                    />
                    <div className="p-3">
                      <div className="flex-1 mb-1">
                        <h3 className="font-medium text-sm truncate dark:text-gray-200">{product.name}</h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {product.stock !== undefined && (
                            <span className={`font-medium ${
                              product.stock > 5 
                                ? 'text-green-600 dark:text-green-500' 
                                : product.stock > 0 
                                  ? 'text-amber-600 dark:text-amber-500' 
                                  : 'text-red-600 dark:text-red-500'
                            }`}>
                              Stock: {product.stock}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-semibold text-base mt-1 dark:text-white">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <button
                  onClick={startListening}
                  disabled={listening || processingVoice}
                  className={`relative rounded-full p-6 transition-all ${
                    listening ? 'bg-red-500 animate-pulse' : 'bg-primary'
                  }`}
                >
                  <Mic size={32} className="text-white" />
                  {processingVoice && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></span>
                    </span>
                  )}
                </button>
                <p className="mt-4 text-center text-gray-600 dark:text-gray-300 max-w-md">
                  {listening ? 'Escuchando...' : 'Presiona el micrófono y di lo que quieres agregar'}
                </p>
                {transcript && (
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm max-w-md mx-auto">
                    <p className="text-gray-800 dark:text-gray-200 italic">"{transcript}"</p>
                  </div>
                )}
              </div>
            )}
          </main>
          
          <div className={`w-80 flex-shrink-0 border-l dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden ${isMobile ? (showCart ? 'block w-full' : 'hidden') : 'block'}`}>
            <div className="p-4 bg-transparent text-foreground dark:text-gray-100 flex items-center justify-between border-b border-border dark:border-gray-800">
              <div className="flex items-center gap-2 flex-1">
                <ShoppingCart size={18} />
                <span className="font-bold">Carrito</span>
                <div className="w-32 ml-2">
                  <SaleTypeSelector
                    value={selectedSaleType}
                    onChange={setSelectedSaleType}
                  />
                </div>
              </div>
              {isMobile && (
                <Button variant="ghost" size="sm" onClick={toggleCart} className="text-foreground dark:text-gray-200 dark:hover:bg-gray-700">
                  <X size={18} />
                </Button>
              )}
              <span className="text-sm">{cartItems.length} items</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-4">
                  <ShoppingCart size={40} className="mb-2 opacity-20" />
                  <p className="text-center">El carrito está vacío</p>
                  {isMobile && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`mt-4 mobile-add-product ${isMobile ? 'agregar-productos-btn w-full py-3' : ''}`} 
                      onClick={toggleCart}
                    >
                      Agregar productos
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex bg-gray-50 dark:bg-gray-800 rounded-md p-2 text-sm group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate dark:text-gray-200">{item.name}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{formatPrice(item.price)} × {item.quantity}</div>
                      </div>
                      <div className="flex flex-col items-end ml-2">
                        <div className="font-semibold dark:text-gray-200">{formatPrice(item.subtotal)}</div>
                        <div className="flex items-center mt-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-300"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center dark:text-gray-300">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-300"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-300 ml-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t dark:border-gray-800 p-4 space-y-3">
              <div className="flex justify-between font-bold text-lg dark:text-gray-100">
                <span>Total:</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handlePaymentClick}
                  disabled={cartItems.length === 0}
                  className="w-full"
                >
                  <CreditCard className="mr-2" size={16} />
                  Pagar
                </Button>
                <Button
                  onClick={handleSplitPaymentClick}
                  disabled={cartItems.length === 0}
                  variant="outline"
                  className="w-full dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <Divide className="mr-2" size={16} />
                  Dividir
                </Button>
              </div>
              
              {isMobile && cartItems.length > 0 && (
                <Button variant="ghost" onClick={toggleCart} className="w-full dark:text-gray-200 dark:hover:bg-gray-800">
                  Seguir comprando
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={showWeightDialog} onOpenChange={setShowWeightDialog}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Ingresar peso</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Ingrese el peso en kilogramos para "{currentWeightProduct?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Peso en kg"
              value={productWeight}
              onChange={(e) => setProductWeight(e.target.value)}
              className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
            <span className="dark:text-gray-300">kg</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWeightDialog(false)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              Cancelar
            </Button>
            <Button onClick={addWeightBasedProduct}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Método de pago</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Seleccione la forma de pago para un total de {formatPrice(cartTotal)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            <PaymentMethodButton
              method="cash"
              icon={<Banknote size={24} />}
              label="Efectivo"
            />
            <PaymentMethodButton
              method="card"
              icon={<CreditCard size={24} />}
              label="Tarjeta"
            />
            <PaymentMethodButton
              method="transfer"
              icon={<ArrowDownToLine size={24} />}
              label="Transferencia"
            />
          </div>
          
          {selectedPayment === 'cash' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-gray-300">Monto entregado</label>
                  <Input
                    type="number"
                    min={cartTotal}
                    value={cashAmount}
                    onChange={handleCashInputChange}
                    autoFocus
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-gray-300">Cambio</label>
                  <Input
                    value={changeAmount !== null ? formatPrice(changeAmount) : ''}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  />
                </div>
              </div>
              <Button
                disabled={changeAmount === null || processingPayment}
                onClick={() => processPayment('cash')}
                className="w-full"
              >
                {processingPayment ? 'Procesando...' : 'Finalizar pago'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={showSplitPaymentDialog} onOpenChange={setShowSplitPaymentDialog}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Pago dividido</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Divida el pago en múltiples métodos para un total de {formatPrice(cartTotal)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {showRemainingAmount && (
              <div className="flex justify-between items-center mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                <span className="text-sm font-medium dark:text-gray-300">Monto restante:</span>
                <span className="font-semibold dark:text-gray-200">{formatPrice(remainingAmount)}</span>
              </div>
            )}
            
            {paymentParts.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium dark:text-gray-300">Pagos registrados:</h4>
                {paymentParts.map((part, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="flex items-center gap-2">
                      {part.method === 'cash' && <Banknote size={16} className="text-green-600 dark:text-green-500" />}
                      {part.method === 'card' && <CreditCard size={16} className="text-blue-600 dark:text-blue-500" />}
                      {part.method === 'transfer' && <ArrowDownToLine size={16} className="text-purple-600 dark:text-purple-500" />}
                      <span className="dark:text-gray-300">{getPaymentMethodName(part.method)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium dark:text-gray-200">{formatPrice(part.amount)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removePaymentPart(index)}
                        className="h-6 w-6 rounded-full dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {remainingAmount > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <SplitPaymentMethodButton
                    method="cash"
                    icon={<Banknote size={18} />}
                    label="Efectivo"
                  />
                  <SplitPaymentMethodButton
                    method="card"
                    icon={<CreditCard size={18} />}
                    label="Tarjeta"
                  />
                  <SplitPaymentMethodButton
                    method="transfer"
                    icon={<ArrowDownToLine size={18} />}
                    label="Transferencia"
                  />
                </div>
                
                <div className="flex gap-2 mt-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block dark:text-gray-300">Monto</label>
                    <Input
                      type="number"
                      min={1}
                      max={remainingAmount}
                      value={currentSplitAmount}
                      onChange={e => setCurrentSplitAmount(e.target.value)}
                      placeholder={`Máximo: ${formatPrice(remainingAmount)}`}
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                    />
                  </div>
                  <div className="self-end">
                    <Button onClick={addPaymentPart} className="h-10">
                      <Plus size={16} className="mr-1" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowSplitPaymentDialog(false)}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={processSplitPayment}
              disabled={remainingAmount > 0 || paymentParts.length === 0 || processingPayment}
              className="min-w-24"
            >
              {processingPayment ? "Procesando..." : "Finalizar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Imprimir recibo</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              La venta ha sido completada exitosamente
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button onClick={handlePrintRecibo} className="w-full">
              <Printer className="mr-2" size={16} />
              Imprimir recibo
            </Button>
            <Button onClick={handlePrintComanda} variant="outline" className="w-full dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <ClipboardList className="mr-2" size={16} />
              Imprimir comanda
            </Button>
            <Button onClick={startNewSale} variant="outline" className="w-full dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <ShoppingCart className="mr-2" size={16} />
              Nueva venta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showCustomerDisplay} onOpenChange={setShowCustomerDisplay}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Pantalla para Cliente</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <CustomerDisplayRedirect version={2} />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCustomerDisplay(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="hidden">
        <div ref={printRef}>
          {printType === 'recibo' ? (
            <div className="receipt">
  {/* HEADER EMPRESARIAL DINÁMICO */}
  <div className="receipt-header">
    {businessLogo && (
      <div className="receipt-logo" style={{ textAlign: 'center', marginBottom: '10px' }}>
        <img 
          src={businessLogo.data} 
          alt="Logo del negocio" 
          style={{ 
            maxHeight: '60px', 
            maxWidth: '200px', 
            objectFit: 'contain',
            margin: '0 auto'
          }}
        />
      </div>
    )}
    <div className="business-name"style={{ textAlign: 'center', fontWeight: 'bold',  marginBottom: '10px' }}>{dynamicBusinessInfo.businessName}</div>
    <div className="business-details">
      {dynamicBusinessInfo.address && <div>Dirección: {dynamicBusinessInfo.address}</div>}
      {dynamicBusinessInfo.phone && <div>Tel: {dynamicBusinessInfo.phone}</div>}
    </div>
  </div>
  
  <div className="receipt-separator-thick"></div>
  
  {/* INFORMACIÓN DE VENTA */}
  <div className="receipt-info-section">
    <div className="receipt-type"></div>
    <div className="receipt-details">
      <div>Fecha: {format(new Date(), "dd/MM/yyyy", { locale: es })}</div>
      <div>Hora: {format(new Date(), "HH:mm", { locale: es })}</div>
      <div>Ticket: #{ticketNumber}</div>
    </div>
    {selectedCustomerName && (
      <div className="customer-info">
        <div>Cliente: {selectedCustomerName.toUpperCase()}</div>
      </div>
    )}
  </div>
  
  <div className="receipt-separator"></div>
  
  {/* TABLA DE PRODUCTOS */}
  <table className="receipt-table">
    <thead>
      <tr>
        <th className="left-align">ÍTEM</th>
        <th>CANT.</th>
        <th className="right-align">P. UNIT</th>
        <th className="right-align">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      {completedCartItems.map((item, index) => (
        <tr key={index}>
          <td className="item-description">
            <div>{item.name}</div>
            {item.notes && <div className="item-notes">({item.notes})</div>}
          </td>
          <td className="center-align">
            {item.is_weight_based ? `${item.quantity} kg` : item.quantity}
          </td>
          <td className="right-align">{formatPrice(item.price)}</td>
          <td className="right-align">{formatPrice(item.subtotal)}</td>
        </tr>
      ))}
    </tbody>
  </table>
  
  <div className="receipt-separator"></div>
  
  {/* TOTALES */}
  <div className="receipt-totals">
    <div className="total-line">
      <span><strong>TOTAL:</strong></span>
      <span><strong>{formatPrice(completedCartItems.reduce((total, item) => total + item.subtotal, 0))}</strong></span>
    </div>
    <div className="payment-method">
      <span>Forma de Pago: {currentPaymentMethod || 'Efectivo'}</span>
    </div>
  </div>
  
  <div className="receipt-separator"></div>
  
  {/* FOOTER DINÁMICO */}
  <div className="receipt-footer">
    <div className="thank-you">{dynamicBusinessInfo.receiptFooter}</div>
    
    <div className="barcode-section">
     
    </div>
  </div>
</div>

          ) : (
            <div className="receipt">
              <div className="receipt-header">
                <div className="receipt-title">COMANDA #{ticketNumber}</div>
                <div className='center-align'>{selectedSaleType.toUpperCase()}</div>
                <div className="receipt-info">
                  {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
                </div>
              </div>
              
              <div className="receipt-separator"></div>
              
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Cant.</th>
                  </tr>
                </thead>
                <tbody>
                  {completedCartItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td className="center-align">{item.is_weight_based ? `${item.quantity} kg` : item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;
