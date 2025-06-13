import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  AppSettings, 
  Barber, 
  Service, 
  Product, 
  Category, 
  Sale, 
  CashAdvance, 
  Promotion,
  BarcodeMapping 
} from '@/types';

export interface BarberContextType {
  appSettings: AppSettings;
  barbers: Barber[];
  services: Service[];
  products: Product[];
  categories: Category[];
  sales: Sale[];
  cashAdvances: CashAdvance[];
  promotions: Promotion[];
  isDataLoaded: boolean;
  loading: boolean;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  addBarber: (barber: Omit<Barber, 'id'>) => Promise<void>;
  updateBarber: (barber: Barber) => Promise<void>;
  deleteBarber: (id: string) => Promise<void>;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  updateSale: (sale: Sale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  addCashAdvance: (cashAdvance: Omit<CashAdvance, 'id'>) => Promise<void>;
  updateCashAdvance: (cashAdvance: CashAdvance) => Promise<void>;
  deleteCashAdvance: (id: string) => Promise<void>;
  addPromotion: (promotion: Omit<Promotion, 'id'>) => Promise<void>;
  updatePromotion: (promotion: Promotion) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  generateBarcode: (prefix?: string) => string;
  getCashAdvancesWithBarberNames: () => (CashAdvance & { barberName: string })[];
  updateCashAdvanceStatus: (id: string, status: 'pending' | 'settled') => Promise<void>;
  getSummaryByPaymentMethod: () => any;
  generateBarcodesForAllBarbers: () => Promise<void>;
  loadFromBackupData: (backupData: any) => Promise<void>;
}

const BarberContext = createContext<BarberContextType | undefined>(undefined);

export const BarberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [appSettings, setAppSettings] = useState<AppSettings>({
    branchName: '',
    address: '',
    phone: ''
  });
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Función helper para manejar errores
  const handleError = useCallback((error: any, operation: string) => {
    console.error(`❌ Error en ${operation}:`, error);
    toast({
      title: "Error",
      description: `Error en ${operation}: ${error.message}`,
      variant: "destructive",
    });
  }, [toast]);

  // Función para generar códigos de barras
  const generateBarcode = useCallback((prefix: string = 'ITEM'): string => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp.slice(-6)}${random}`.replace(/[^A-Za-z0-9]/g, '');
  }, []);

  // Funciones de conversión entre formatos Supabase y locales
  const convertSupabaseToLocal = {
    appSettings: (data: any): AppSettings => ({
      branchName: data.branch_name || '',
      address: data.address || '',
      phone: data.phone || ''
    }),
    barber: (data: any): Barber => ({
      id: data.barber_id,
      name: data.name
    }),
    category: (data: any): Category => ({
      id: data.category_id,
      name: data.name
    }),
    service: (data: any): Service => ({
      id: data.service_id,
      name: data.name,
      price: parseFloat(data.price) || 0,
      duration: data.duration || 0,
      categoryId: data.category_id,
      barberId: data.barber_id,
      barcode: data.barcode,
      barberBarcodes: Array.isArray(data.barber_barcodes) ? data.barber_barcodes : []
    }),
    product: (data: any): Product => ({
      id: data.product_id,
      name: data.name,
      price: parseFloat(data.price) || 0,
      stock: data.stock || 0,
      categoryId: data.category_id
    }),
    sale: (data: any): Sale => ({
      id: data.sale_id,
      barberId: data.barber_id,
      date: data.date,
      items: Array.isArray(data.items) ? data.items : [],
      total: parseFloat(data.total) || 0,
      paymentMethod: data.payment_method,
      splitPayments: Array.isArray(data.split_payments) ? data.split_payments : undefined,
      tip: data.tip || undefined,
      discount: data.discount || undefined,
      appliedPromotion: data.applied_promotion || undefined
    }),
    cashAdvance: (data: any): CashAdvance => ({
      id: data.advance_id,
      barberId: data.barber_id,
      barberName: data.barber_name,
      amount: parseFloat(data.amount) || 0,
      date: data.date,
      description: data.description || '',
      paymentMethod: data.payment_method,
      status: data.status,
      settled: data.settled
    }),
    promotion: (data: any): Promotion => ({
      id: data.promotion_id,
      name: data.name,
      description: data.description,
      type: data.type,
      value: parseFloat(data.value) || 0,
      startDate: data.start_date,
      endDate: data.end_date,
      active: data.active,
      requiresOwnerPin: data.requires_owner_pin,
      minimumPurchase: data.minimum_purchase ? parseFloat(data.minimum_purchase) : undefined,
      applicableCategories: Array.isArray(data.applicable_categories) ? data.applicable_categories : [],
      applicableItems: Array.isArray(data.applicable_items) ? data.applicable_items : [],
      buyXGetYDetails: data.buy_x_get_y_details
    })
  };

  // Cargar todos los datos al inicializar
  const loadAllData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🔄 Cargando todos los datos desde Base de Datos para usuario:', user.id);
      
      // Cargar app_settings
      const { data: appSettingsData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (appSettingsData) {
        setAppSettings(convertSupabaseToLocal.appSettings(appSettingsData));
      }

      // Cargar todas las entidades en paralelo
      const [
        { data: barbersData },
        { data: categoriesData },
        { data: servicesData },
        { data: productsData },
        { data: salesData },
        { data: cashAdvancesData },
        { data: promotionsData }
      ] = await Promise.all([
        supabase.from('barbers').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('categories').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('services').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('products').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('sales').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('cash_advances').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('promotions').select('*').eq('user_id', user.id).order('created_at')
      ]);

      setBarbers(barbersData?.map(convertSupabaseToLocal.barber) || []);
      setCategories(categoriesData?.map(convertSupabaseToLocal.category) || []);
      setServices(servicesData?.map(convertSupabaseToLocal.service) || []);
      setProducts(productsData?.map(convertSupabaseToLocal.product) || []);
      setSales(salesData?.map(convertSupabaseToLocal.sale) || []);
      setCashAdvances(cashAdvancesData?.map(convertSupabaseToLocal.cashAdvance) || []);
      setPromotions(promotionsData?.map(convertSupabaseToLocal.promotion) || []);

      setIsDataLoaded(true);
      console.log('✅ Todos los datos cargados desde Base de Datos');
    } catch (error) {
      handleError(error, 'cargar datos');
    } finally {
      setLoading(false);
    }
  }, [user?.id, handleError]);

  // Cargar datos cuando cambie el usuario
  useEffect(() => {
    if (user?.id) {
      loadAllData();
    } else {
      // Limpiar datos cuando no hay usuario
      setAppSettings({ branchName: '', address: '', phone: '' });
      setBarbers([]);
      setServices([]);
      setProducts([]);
      setCategories([]);
      setSales([]);
      setCashAdvances([]);
      setPromotions([]);
      setIsDataLoaded(false);
    }
  }, [user?.id, loadAllData]);

  // Configurar subscripciones en tiempo real mejoradas
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔗 Configurando subscripciones en tiempo real mejoradas...');

    // Crear un solo canal para todas las subscripciones
    const channel = supabase
      .channel(`realtime_changes_${user.id}`)
      
      // Barberos
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'barbers', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('🔄 Cambio en barberos:', payload);
          if (payload.eventType === 'INSERT') {
            const newBarber = convertSupabaseToLocal.barber(payload.new);
            setBarbers(prev => [...prev, newBarber]);
            toast({
              title: "Barbero agregado",
              description: `${newBarber.name} ha sido agregado exitosamente`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedBarber = convertSupabaseToLocal.barber(payload.new);
            setBarbers(prev => prev.map(item => 
              item.id === updatedBarber.id ? updatedBarber : item
            ));
            toast({
              title: "Barbero actualizado",
              description: `${updatedBarber.name} ha sido actualizado`,
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).barber_id;
            setBarbers(prev => prev.filter(item => item.id !== deletedId));
            toast({
              title: "Barbero eliminado",
              description: "El barbero ha sido eliminado exitosamente",
            });
          }
        }
      )
      
      // Categorías
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('🔄 Cambio en categorías:', payload);
          if (payload.eventType === 'INSERT') {
            const newCategory = convertSupabaseToLocal.category(payload.new);
            setCategories(prev => [...prev, newCategory]);
            toast({
              title: "Categoría agregada",
              description: `${newCategory.name} ha sido agregada exitosamente`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedCategory = convertSupabaseToLocal.category(payload.new);
            setCategories(prev => prev.map(item => 
              item.id === updatedCategory.id ? updatedCategory : item
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).category_id;
            setCategories(prev => prev.filter(item => item.id !== deletedId));
          }
        }
      )
      
      // Servicios - Optimizado para actualizaciones inmediatas
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'services', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('🔄 Cambio en servicios detectado:', payload);
          if (payload.eventType === 'INSERT') {
            const newService = convertSupabaseToLocal.service(payload.new);
            console.log('✅ Nuevo servicio agregado:', newService);
            setServices(prev => {
              // Verificar si el servicio ya existe para evitar duplicados
              const exists = prev.find(s => s.id === newService.id);
              if (exists) {
                console.log('⚠️ Servicio ya existe, actualizando:', newService.id);
                return prev.map(s => s.id === newService.id ? newService : s);
              }
              console.log('➕ Agregando nuevo servicio a la lista');
              return [...prev, newService];
            });
            toast({
              title: "Servicio agregado",
              description: `${newService.name} ha sido agregado exitosamente`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedService = convertSupabaseToLocal.service(payload.new);
            console.log('🔄 Servicio actualizado:', updatedService);
            setServices(prev => prev.map(item => 
              item.id === updatedService.id ? updatedService : item
            ));
            toast({
              title: "Servicio actualizado",
              description: `${updatedService.name} ha sido actualizado`,
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).service_id;
            console.log('🗑️ Servicio eliminado:', deletedId);
            setServices(prev => prev.filter(item => item.id !== deletedId));
          }
        }
      )
      
      // Productos
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('🔄 Cambio en productos:', payload);
          if (payload.eventType === 'INSERT') {
            const newProduct = convertSupabaseToLocal.product(payload.new);
            setProducts(prev => [...prev, newProduct]);
            toast({
              title: "Producto agregado",
              description: `${newProduct.name} ha sido agregado exitosamente`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedProduct = convertSupabaseToLocal.product(payload.new);
            setProducts(prev => prev.map(item => 
              item.id === updatedProduct.id ? updatedProduct : item
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).product_id;
            setProducts(prev => prev.filter(item => item.id !== deletedId));
          }
        }
      )
      
      // Ventas
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sales', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('🔄 Cambio en ventas:', payload);
          if (payload.eventType === 'INSERT') {
            const newSale = convertSupabaseToLocal.sale(payload.new);
            setSales(prev => [newSale, ...prev]);
            toast({
              title: "Venta registrada",
              description: `Nueva venta por $${newSale.total.toFixed(2)}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedSale = convertSupabaseToLocal.sale(payload.new);
            setSales(prev => prev.map(item => 
              item.id === updatedSale.id ? updatedSale : item
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).sale_id;
            setSales(prev => prev.filter(item => item.id !== deletedId));
          }
        }
      )
      
      // Adelantos
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cash_advances', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('🔄 Cambio en adelantos:', payload);
          if (payload.eventType === 'INSERT') {
            const newAdvance = convertSupabaseToLocal.cashAdvance(payload.new);
            setCashAdvances(prev => [newAdvance, ...prev]);
            toast({
              title: "Adelanto registrado",
              description: `Nuevo adelanto por $${newAdvance.amount.toFixed(2)}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedAdvance = convertSupabaseToLocal.cashAdvance(payload.new);
            setCashAdvances(prev => prev.map(item => 
              item.id === updatedAdvance.id ? updatedAdvance : item
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).advance_id;
            setCashAdvances(prev => prev.filter(item => item.id !== deletedId));
          }
        }
      )
      
      // Promociones
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'promotions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('🔄 Cambio en promociones:', payload);
          if (payload.eventType === 'INSERT') {
            const newPromotion = convertSupabaseToLocal.promotion(payload.new);
            setPromotions(prev => [...prev, newPromotion]);
            toast({
              title: "Promoción agregada",
              description: `${newPromotion.name} ha sido agregada exitosamente`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedPromotion = convertSupabaseToLocal.promotion(payload.new);
            setPromotions(prev => prev.map(item => 
              item.id === updatedPromotion.id ? updatedPromotion : item
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).promotion_id;
            setPromotions(prev => prev.filter(item => item.id !== deletedId));
          }
        }
      )
      
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscripciones en tiempo real establecidas exitosamente');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en subscripciones en tiempo real');
        }
      });

    // Cleanup
    return () => {
      console.log('🔌 Limpiando subscripciones...');
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

  // Implementar todas las funciones CRUD con Supabase

  const updateAppSettings = useCallback(async (settings: Partial<AppSettings>) => {
    if (!user?.id) return;

    try {
      const newSettings = { ...appSettings, ...settings };
      
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          branch_name: newSettings.branchName,
          address: newSettings.address,
          phone: newSettings.phone
        });

      if (error) throw error;
      
      setAppSettings(newSettings);
      console.log('✅ Configuración actualizada');
    } catch (error) {
      handleError(error, 'actualizar configuración');
    }
  }, [user?.id, appSettings, handleError]);

  const addBarber = useCallback(async (barber: Omit<Barber, 'id'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('barbers')
        .insert({
          user_id: user.id,
          name: barber.name,
          barber_id: '' // Se generará automáticamente por el trigger
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Barbero agregado:', data.barber_id);
    } catch (error) {
      handleError(error, 'agregar barbero');
    }
  }, [user?.id, handleError]);

  const updateBarber = useCallback(async (barber: Barber) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('barbers')
        .update({
          name: barber.name
        })
        .eq('user_id', user.id)
        .eq('barber_id', barber.id);

      if (error) throw error;
      
      console.log('✅ Barbero actualizado:', barber.id);
    } catch (error) {
      handleError(error, 'actualizar barbero');
    }
  }, [user?.id, handleError]);

  const deleteBarber = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('user_id', user.id)
        .eq('barber_id', id);

      if (error) throw error;
      
      console.log('✅ Barbero eliminado:', id);
    } catch (error) {
      handleError(error, 'eliminar barbero');
    }
  }, [user?.id, handleError]);

  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: category.name,
          category_id: '' // Se generará automáticamente por el trigger
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Categoría agregada:', data.category_id);
    } catch (error) {
      handleError(error, 'agregar categoría');
    }
  }, [user?.id, handleError]);

  const updateCategory = useCallback(async (category: Category) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: category.name
        })
        .eq('user_id', user.id)
        .eq('category_id', category.id);

      if (error) throw error;
      
      console.log('✅ Categoría actualizada:', category.id);
    } catch (error) {
      handleError(error, 'actualizar categoría');
    }
  }, [user?.id, handleError]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', id);

      if (error) throw error;
      
      console.log('✅ Categoría eliminada:', id);
    } catch (error) {
      handleError(error, 'eliminar categoría');
    }
  }, [user?.id, handleError]);

  const addService = useCallback(async (service: Omit<Service, 'id'>) => {
    if (!user?.id) return;

    try {
      console.log('🔄 Creando servicio:', service);
      
      const { data, error } = await supabase
        .from('services')
        .insert({
          user_id: user.id,
          service_id: '', // Se generará automáticamente
          name: service.name,
          price: service.price,
          duration: service.duration,
          category_id: service.categoryId,
          barber_id: service.barberId,
          barcode: service.barcode || '', // Se generará automáticamente si está vacío
          barber_barcodes: JSON.parse(JSON.stringify(service.barberBarcodes || []))
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Servicio creado exitosamente en Base de Datos:', data.service_id);
      
      // Opcional: Actualizar estado local inmediatamente para UI más responsiva
      // La subscripción en tiempo real también manejará esto, pero esto es backup
      const newService = convertSupabaseToLocal.service(data);
      setServices(prev => {
        const exists = prev.find(s => s.id === newService.id);
        if (!exists) {
          console.log('⚡ Actualizando estado local inmediatamente');
          return [...prev, newService];
        }
        return prev;
      });
      
    } catch (error) {
      handleError(error, 'agregar servicio');
    }
  }, [user?.id, handleError]);

  const updateService = useCallback(async (service: Service) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('services')
        .update({
          name: service.name,
          price: service.price,
          duration: service.duration,
          category_id: service.categoryId,
          barber_id: service.barberId,
          barcode: service.barcode,
          barber_barcodes: JSON.parse(JSON.stringify(service.barberBarcodes || []))
        })
        .eq('user_id', user.id)
        .eq('service_id', service.id);

      if (error) throw error;
      
      console.log('✅ Servicio actualizado:', service.id);
    } catch (error) {
      handleError(error, 'actualizar servicio');
    }
  }, [user?.id, handleError]);

  const deleteService = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('user_id', user.id)
        .eq('service_id', id);

      if (error) throw error;
      
      console.log('✅ Servicio eliminado:', id);
    } catch (error) {
      handleError(error, 'eliminar servicio');
    }
  }, [user?.id, handleError]);

  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          product_id: '', // Se generará automáticamente
          name: product.name,
          price: product.price,
          stock: product.stock,
          category_id: product.categoryId
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Producto agregado:', data.product_id);
    } catch (error) {
      handleError(error, 'agregar producto');
    }
  }, [user?.id, handleError]);

  const updateProduct = useCallback(async (product: Product) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          price: product.price,
          stock: product.stock,
          category_id: product.categoryId
        })
        .eq('user_id', user.id)
        .eq('product_id', product.id);

      if (error) throw error;
      
      console.log('✅ Producto actualizado:', product.id);
    } catch (error) {
      handleError(error, 'actualizar producto');
    }
  }, [user?.id, handleError]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id);

      if (error) throw error;
      
      console.log('✅ Producto eliminado:', id);
    } catch (error) {
      handleError(error, 'eliminar producto');
    }
  }, [user?.id, handleError]);

  const addSale = useCallback(async (sale: Omit<Sale, 'id'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          sale_id: '', // Se generará automáticamente
          barber_id: sale.barberId,
          date: sale.date instanceof Date ? sale.date.toISOString() : sale.date,
          items: JSON.parse(JSON.stringify(sale.items)),
          total: sale.total,
          payment_method: sale.paymentMethod,
          split_payments: sale.splitPayments ? JSON.parse(JSON.stringify(sale.splitPayments)) : null,
          tip: sale.tip ? JSON.parse(JSON.stringify(sale.tip)) : null,
          discount: sale.discount ? JSON.parse(JSON.stringify(sale.discount)) : null,
          applied_promotion: sale.appliedPromotion ? JSON.parse(JSON.stringify(sale.appliedPromotion)) : null
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Venta agregada:', data.sale_id);
    } catch (error) {
      handleError(error, 'agregar venta');
    }
  }, [user?.id, handleError]);

  const updateSale = useCallback(async (sale: Sale) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('sales')
        .update({
          barber_id: sale.barberId,
          date: sale.date instanceof Date ? sale.date.toISOString() : sale.date,
          items: JSON.parse(JSON.stringify(sale.items)),
          total: sale.total,
          payment_method: sale.paymentMethod,
          split_payments: sale.splitPayments ? JSON.parse(JSON.stringify(sale.splitPayments)) : null,
          tip: sale.tip ? JSON.parse(JSON.stringify(sale.tip)) : null,
          discount: sale.discount ? JSON.parse(JSON.stringify(sale.discount)) : null,
          applied_promotion: sale.appliedPromotion ? JSON.parse(JSON.stringify(sale.appliedPromotion)) : null
        })
        .eq('user_id', user.id)
        .eq('sale_id', sale.id);

      if (error) throw error;
      
      console.log('✅ Venta actualizada:', sale.id);
    } catch (error) {
      handleError(error, 'actualizar venta');
    }
  }, [user?.id, handleError]);

  const deleteSale = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('user_id', user.id)
        .eq('sale_id', id);

      if (error) throw error;
      
      console.log('✅ Venta eliminada:', id);
    } catch (error) {
      handleError(error, 'eliminar venta');
    }
  }, [user?.id, handleError]);

  const addCashAdvance = useCallback(async (cashAdvance: Omit<CashAdvance, 'id'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('cash_advances')
        .insert({
          user_id: user.id,
          advance_id: '', // Se generará automáticamente
          barber_id: cashAdvance.barberId,
          barber_name: cashAdvance.barberName,
          amount: cashAdvance.amount,
          date: cashAdvance.date instanceof Date ? cashAdvance.date.toISOString() : cashAdvance.date,
          description: cashAdvance.description,
          payment_method: cashAdvance.paymentMethod,
          status: cashAdvance.status,
          settled: cashAdvance.settled
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Adelanto agregado:', data.advance_id);
    } catch (error) {
      handleError(error, 'agregar adelanto');
    }
  }, [user?.id, handleError]);

  const updateCashAdvance = useCallback(async (cashAdvance: CashAdvance) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('cash_advances')
        .update({
          barber_id: cashAdvance.barberId,
          barber_name: cashAdvance.barberName,
          amount: cashAdvance.amount,
          date: cashAdvance.date instanceof Date ? cashAdvance.date.toISOString() : cashAdvance.date,
          description: cashAdvance.description,
          payment_method: cashAdvance.paymentMethod,
          status: cashAdvance.status,
          settled: cashAdvance.settled
        })
        .eq('user_id', user.id)
        .eq('advance_id', cashAdvance.id);

      if (error) throw error;
      
      console.log('✅ Adelanto actualizado:', cashAdvance.id);
    } catch (error) {
      handleError(error, 'actualizar adelanto');
    }
  }, [user?.id, handleError]);

  const updateCashAdvanceStatus = useCallback(async (id: string, status: 'pending' | 'settled') => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('cash_advances')
        .update({
          status: status,
          settled: status === 'settled'
        })
        .eq('user_id', user.id)
        .eq('advance_id', id);

      if (error) throw error;
      
      console.log('✅ Estado de adelanto actualizado:', id, status);
    } catch (error) {
      handleError(error, 'actualizar estado de adelanto');
    }
  }, [user?.id, handleError]);

  const deleteCashAdvance = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('cash_advances')
        .delete()
        .eq('user_id', user.id)
        .eq('advance_id', id);

      if (error) throw error;
      
      console.log('✅ Adelanto eliminado:', id);
    } catch (error) {
      handleError(error, 'eliminar adelanto');
    }
  }, [user?.id, handleError]);

  const addPromotion = useCallback(async (promotion: Omit<Promotion, 'id'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('promotions')
        .insert({
          user_id: user.id,
          promotion_id: '', // Se generará automáticamente
          name: promotion.name,
          description: promotion.description,
          type: promotion.type,
          value: promotion.value,
          start_date: promotion.startDate instanceof Date ? promotion.startDate.toISOString() : promotion.startDate,
          end_date: promotion.endDate instanceof Date ? promotion.endDate.toISOString() : promotion.endDate,
          active: promotion.active,
          requires_owner_pin: promotion.requiresOwnerPin,
          minimum_purchase: promotion.minimumPurchase,
          applicable_categories: JSON.parse(JSON.stringify(promotion.applicableCategories || [])),
          applicable_items: JSON.parse(JSON.stringify(promotion.applicableItems || [])),
          buy_x_get_y_details: promotion.buyXGetYDetails ? JSON.parse(JSON.stringify(promotion.buyXGetYDetails)) : null
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Promoción agregada:', data.promotion_id);
    } catch (error) {
      handleError(error, 'agregar promoción');
    }
  }, [user?.id, handleError]);

  const updatePromotion = useCallback(async (promotion: Promotion) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('promotions')
        .update({
          name: promotion.name,
          description: promotion.description,
          type: promotion.type,
          value: promotion.value,
          start_date: promotion.startDate instanceof Date ? promotion.startDate.toISOString() : promotion.startDate,
          end_date: promotion.endDate instanceof Date ? promotion.endDate.toISOString() : promotion.endDate,
          active: promotion.active,
          requires_owner_pin: promotion.requiresOwnerPin,
          minimum_purchase: promotion.minimumPurchase,
          applicable_categories: JSON.parse(JSON.stringify(promotion.applicableCategories || [])),
          applicable_items: JSON.parse(JSON.stringify(promotion.applicableItems || [])),
          buy_x_get_y_details: promotion.buyXGetYDetails ? JSON.parse(JSON.stringify(promotion.buyXGetYDetails)) : null
        })
        .eq('user_id', user.id)
        .eq('promotion_id', promotion.id);

      if (error) throw error;
      
      console.log('✅ Promoción actualizada:', promotion.id);
    } catch (error) {
      handleError(error, 'actualizar promoción');
    }
  }, [user?.id, handleError]);

  const deletePromotion = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('user_id', user.id)
        .eq('promotion_id', id);

      if (error) throw error;
      
      console.log('✅ Promoción eliminada:', id);
    } catch (error) {
      handleError(error, 'eliminar promoción');
    }
  }, [user?.id, handleError]);

  // Funciones helper que mantienen compatibilidad
  const getCashAdvancesWithBarberNames = useCallback(() => {
    return cashAdvances.map(advance => ({
      ...advance,
      barberName: barbers.find(b => b.id === advance.barberId)?.name || advance.barberName || 'Unknown'
    }));
  }, [cashAdvances, barbers]);

  const getSummaryByPaymentMethod = useCallback(() => {
    return sales.reduce((summary, sale) => {
      const amount = sale.total;
      switch (sale.paymentMethod) {
        case 'cash':
          summary.cash += amount;
          break;
        case 'card':
          summary.card += amount;
          break;
        case 'transfer':
          summary.transfer += amount;
          break;
        case 'mixed':
          summary.mixed += amount;
          break;
      }
      return summary;
    }, { cash: 0, card: 0, transfer: 0, mixed: 0 });
  }, [sales]);

  const generateBarcodesForAllBarbers = useCallback(async () => {
    if (!user?.id) return;

    console.log("🔄 Generando códigos de barras para todos los barberos y servicios");
    console.log("Barberos disponibles:", barbers.length);
    console.log("Servicios disponibles:", services.length);
    
    if (barbers.length === 0) {
      console.warn("No hay barberos disponibles para generar códigos");
      return;
    }

    if (services.length === 0) {
      console.warn("No hay servicios disponibles para generar códigos");
      return;
    }
    
    for (const service of services) {
      const generalBarcode = service.barcode || generateBarcode('SRV');
      
      const barberBarcodes: BarcodeMapping[] = barbers.map(barber => {
        const existingCode = service.barberBarcodes?.find(bc => bc.barberId === barber.id);
        
        return {
          barberId: barber.id,
          barcode: existingCode?.barcode || generateBarcode(`SRV${service.id.slice(-3)}BAR${barber.id.slice(-3)}`)
        };
      });
      
      console.log(`Servicio ${service.name}: código general ${generalBarcode}, ${barberBarcodes.length} códigos de barberos`);
      
      try {
        const { error } = await supabase
          .from('services')
          .update({
            barcode: generalBarcode,
            barber_barcodes: JSON.parse(JSON.stringify(barberBarcodes))
          })
          .eq('user_id', user.id)
          .eq('service_id', service.id);

        if (error) throw error;
      } catch (error) {
        handleError(error, `generar códigos para servicio ${service.name}`);
      }
    }
    
    console.log("✅ Códigos de barras generados exitosamente para todos los servicios y barberos");
  }, [barbers, services, generateBarcode, user?.id, handleError]);

  const loadFromBackupData = useCallback(async (backupData: any) => {
    if (!user?.id) return;

    console.log('📥 Cargando datos desde respaldo a Base de Datos...');
    
    try {
      // Cargar datos del respaldo a Base de Datos
      if (backupData.appSettings) {
        await updateAppSettings(backupData.appSettings);
      }

      // Insertar datos en lotes para mejor rendimiento
      if (backupData.categories && Array.isArray(backupData.categories)) {
        for (const category of backupData.categories) {
          await addCategory(category);
        }
      }

      if (backupData.barbers && Array.isArray(backupData.barbers)) {
        for (const barber of backupData.barbers) {
          await addBarber(barber);
        }
      }

      if (backupData.services && Array.isArray(backupData.services)) {
        for (const service of backupData.services) {
          await addService(service);
        }
      }

      if (backupData.products && Array.isArray(backupData.products)) {
        for (const product of backupData.products) {
          await addProduct(product);
        }
      }

      if (backupData.sales && Array.isArray(backupData.sales)) {
        for (const sale of backupData.sales) {
          await addSale(sale);
        }
      }

      if (backupData.cashAdvances && Array.isArray(backupData.cashAdvances)) {
        for (const advance of backupData.cashAdvances) {
          await addCashAdvance(advance);
        }
      }

      if (backupData.promotions && Array.isArray(backupData.promotions)) {
        for (const promotion of backupData.promotions) {
          await addPromotion(promotion);
        }
      }
      
      console.log('✅ Datos cargados desde respaldo a Base de Datos');
    } catch (error) {
      handleError(error, 'cargar datos desde respaldo');
    }
  }, [user?.id, updateAppSettings, addCategory, addBarber, addService, addProduct, addSale, addCashAdvance, addPromotion, handleError]);

  const value: BarberContextType = {
    appSettings,
    barbers,
    services,
    products,
    categories,
    sales,
    cashAdvances,
    promotions,
    isDataLoaded,
    loading,
    updateAppSettings,
    addBarber,
    updateBarber,
    deleteBarber,
    addService,
    updateService,
    deleteService,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addSale,
    updateSale,
    deleteSale,
    addCashAdvance,
    updateCashAdvance,
    deleteCashAdvance,
    addPromotion,
    updatePromotion,
    deletePromotion,
    generateBarcode,
    getCashAdvancesWithBarberNames,
    updateCashAdvanceStatus,
    getSummaryByPaymentMethod,
    generateBarcodesForAllBarbers,
    loadFromBackupData,
  };

  return (
    <BarberContext.Provider value={value}>
      {children}
    </BarberContext.Provider>
  );
};

export const useBarber = () => {
  const context = useContext(BarberContext);
  if (!context) {
    throw new Error('useBarber must be used within a BarberProvider');
  }
  return context;
};
