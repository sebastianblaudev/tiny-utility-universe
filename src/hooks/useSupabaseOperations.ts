
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  AppSettingsData, 
  BarberData, 
  CategoryData, 
  ServiceData, 
  ProductData, 
  SaleData, 
  CashAdvanceData, 
  PromotionData 
} from '@/types/supabase';

export const useSupabaseOperations = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Estados para datos
  const [appSettings, setAppSettings] = useState<AppSettingsData>({
    branchName: '',
    address: '',
    phone: ''
  });
  const [barbers, setBarbers] = useState<BarberData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [sales, setSales] = useState<SaleData[]>([]);
  const [cashAdvances, setCashAdvances] = useState<CashAdvanceData[]>([]);
  const [promotions, setPromotions] = useState<PromotionData[]>([]);

  // Función helper para manejar errores
  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Error en ${operation}:`, error);
    toast({
      title: "Error",
      description: `Error en ${operation}: ${error.message}`,
      variant: "destructive",
    });
  }, [toast]);

  // Función para convertir datos de Supabase a formato local
  const convertSupabaseToLocal = {
    appSettings: (data: any): AppSettingsData => ({
      branchName: data.branch_name || '',
      address: data.address || '',
      phone: data.phone || ''
    }),
    barber: (data: any): BarberData => ({
      id: data.barber_id,
      name: data.name
    }),
    category: (data: any): CategoryData => ({
      id: data.category_id,
      name: data.name
    }),
    service: (data: any): ServiceData => ({
      id: data.service_id,
      name: data.name,
      price: parseFloat(data.price) || 0,
      duration: data.duration || 0,
      categoryId: data.category_id,
      barberId: data.barber_id,
      barcode: data.barcode,
      barberBarcodes: data.barber_barcodes || []
    }),
    product: (data: any): ProductData => ({
      id: data.product_id,
      name: data.name,
      price: parseFloat(data.price) || 0,
      stock: data.stock || 0,
      categoryId: data.category_id
    }),
    sale: (data: any): SaleData => ({
      id: data.sale_id,
      barberId: data.barber_id,
      date: data.date,
      items: data.items || [],
      total: parseFloat(data.total) || 0,
      paymentMethod: data.payment_method,
      splitPayments: data.split_payments,
      tip: data.tip,
      discount: data.discount,
      appliedPromotion: data.applied_promotion
    }),
    cashAdvance: (data: any): CashAdvanceData => ({
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
    promotion: (data: any): PromotionData => ({
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
      applicableCategories: data.applicable_categories || [],
      applicableItems: data.applicable_items || [],
      buyXGetYDetails: data.buy_x_get_y_details
    })
  };

  // Función para convertir datos locales a formato Supabase
  const convertLocalToSupabase = {
    appSettings: (data: AppSettingsData) => ({
      user_id: user?.id,
      branch_name: data.branchName,
      address: data.address,
      phone: data.phone
    }),
    barber: (data: Omit<BarberData, 'id'>) => ({
      user_id: user?.id,
      name: data.name
    }),
    category: (data: Omit<CategoryData, 'id'>) => ({
      user_id: user?.id,
      name: data.name
    }),
    service: (data: Omit<ServiceData, 'id'>) => ({
      user_id: user?.id,
      name: data.name,
      price: data.price,
      duration: data.duration,
      category_id: data.categoryId,
      barber_id: data.barberId,
      barcode: data.barcode,
      barber_barcodes: data.barberBarcodes || []
    }),
    product: (data: Omit<ProductData, 'id'>) => ({
      user_id: user?.id,
      name: data.name,
      price: data.price,
      stock: data.stock,
      category_id: data.categoryId
    }),
    sale: (data: Omit<SaleData, 'id'>) => ({
      user_id: user?.id,
      barber_id: data.barberId,
      date: data.date,
      items: data.items,
      total: data.total,
      payment_method: data.paymentMethod,
      split_payments: data.splitPayments,
      tip: data.tip,
      discount: data.discount,
      applied_promotion: data.appliedPromotion
    }),
    cashAdvance: (data: Omit<CashAdvanceData, 'id'>) => ({
      user_id: user?.id,
      barber_id: data.barberId,
      barber_name: data.barberName,
      amount: data.amount,
      date: data.date,
      description: data.description,
      payment_method: data.paymentMethod,
      status: data.status,
      settled: data.settled
    }),
    promotion: (data: Omit<PromotionData, 'id'>) => ({
      user_id: user?.id,
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      start_date: data.startDate,
      end_date: data.endDate,
      active: data.active,
      requires_owner_pin: data.requiresOwnerPin,
      minimum_purchase: data.minimumPurchase,
      applicable_categories: data.applicableCategories,
      applicable_items: data.applicableItems,
      buy_x_get_y_details: data.buyXGetYDetails
    })
  };

  // Cargar todos los datos al inicializar
  const loadAllData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🔄 Cargando todos los datos desde Supabase...');
      
      // Cargar app_settings
      const { data: appSettingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        handleError(settingsError, 'cargar configuración');
      } else if (appSettingsData) {
        setAppSettings(convertSupabaseToLocal.appSettings(appSettingsData));
      }

      // Cargar barbers
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (barbersError) {
        handleError(barbersError, 'cargar barberos');
      } else {
        setBarbers(barbersData?.map(convertSupabaseToLocal.barber) || []);
      }

      // Cargar categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (categoriesError) {
        handleError(categoriesError, 'cargar categorías');
      } else {
        setCategories(categoriesData?.map(convertSupabaseToLocal.category) || []);
      }

      // Cargar services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (servicesError) {
        handleError(servicesError, 'cargar servicios');
      } else {
        setServices(servicesData?.map(convertSupabaseToLocal.service) || []);
      }

      // Cargar products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (productsError) {
        handleError(productsError, 'cargar productos');
      } else {
        setProducts(productsData?.map(convertSupabaseToLocal.product) || []);
      }

      // Cargar sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (salesError) {
        handleError(salesError, 'cargar ventas');
      } else {
        setSales(salesData?.map(convertSupabaseToLocal.sale) || []);
      }

      // Cargar cash_advances
      const { data: cashAdvancesData, error: cashAdvancesError } = await supabase
        .from('cash_advances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cashAdvancesError) {
        handleError(cashAdvancesError, 'cargar adelantos');
      } else {
        setCashAdvances(cashAdvancesData?.map(convertSupabaseToLocal.cashAdvance) || []);
      }

      // Cargar promotions
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (promotionsError) {
        handleError(promotionsError, 'cargar promociones');
      } else {
        setPromotions(promotionsData?.map(convertSupabaseToLocal.promotion) || []);
      }

      console.log('✅ Todos los datos cargados desde Supabase');
    } catch (error) {
      handleError(error, 'cargar datos');
    } finally {
      setLoading(false);
    }
  }, [user?.id, handleError]);

  return {
    // Estados
    loading,
    appSettings,
    barbers,
    categories,
    services,
    products,
    sales,
    cashAdvances,
    promotions,
    
    // Funciones
    loadAllData,
    convertLocalToSupabase,
    handleError,
    
    // Estados helpers
    setAppSettings,
    setBarbers,
    setCategories,
    setServices,
    setProducts,
    setSales,
    setCashAdvances,
    setPromotions
  };
};
