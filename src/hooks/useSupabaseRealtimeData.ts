import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  SystemUserData,
  UserPreferencesData,
  TipData,
  AppSettingsExtended,
  SystemUserInsert,
  UserPreferencesInsert,
  TipInsert
} from '@/types/supabase-realtime';

export const useSupabaseRealtimeData = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Estados para todos los datos
  const [systemUsers, setSystemUsers] = useState<SystemUserData[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferencesData | null>(null);
  const [tips, setTips] = useState<TipData[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettingsExtended>({
    branchName: '',
    address: '',
    phone: '',
    receiptSettings: {
      showLogo: true,
      showAddress: true,
      showPhone: true,
      footerText: 'Gracias por su visita'
    },
    languageSettings: {
      language: 'es',
      currency: 'COP',
      timezone: 'America/Bogota'
    },
    blockedNames: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Cargar usuarios del sistema
      const { data: systemUsersData } = await supabase
        .from('system_users')
        .select('*')
        .eq('user_id', user.id);

      if (systemUsersData) {
        const mappedUsers: SystemUserData[] = systemUsersData.map(u => ({
          id: u.id,
          name: u.name,
          pin: u.pin,
          role: u.role as 'owner' | 'admin' | 'barber',
          branchId: u.branch_id || '1',
          isBlocked: u.is_blocked || false
        }));
        setSystemUsers(mappedUsers);
        console.log('✅ Sistema usuarios cargados desde Supabase:', mappedUsers.length);
      }

      // Cargar preferencias de usuario
      const { data: preferencesData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (preferencesData) {
        setUserPreferences({
          id: preferencesData.id,
          sidebarOpen: preferencesData.sidebar_open || false,
          theme: preferencesData.theme || 'system',
          notificationsEnabled: preferencesData.notifications_enabled || true,
          preferences: (preferencesData.preferences as Record<string, any>) || {}
        });
      }

      // Cargar tips
      const { data: tipsData } = await supabase
        .from('tips')
        .select('*')
        .eq('user_id', user.id);

      if (tipsData) {
        const mappedTips: TipData[] = tipsData.map(t => ({
          id: t.id,
          tipId: t.tip_id,
          amount: Number(t.amount),
          barberId: t.barber_id,
          barberName: t.barber_name || undefined,
          saleId: t.sale_id || undefined,
          paymentMethod: t.payment_method,
          date: new Date(t.date)
        }));
        setTips(mappedTips);
        console.log('✅ Tips cargados desde Supabase:', mappedTips.length);
      }

      // Cargar configuraciones de la app
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsData) {
        setAppSettings({
          branchName: settingsData.branch_name || '',
          address: settingsData.address || '',
          phone: settingsData.phone || '',
          receiptSettings: (settingsData.receipt_settings as {
            showLogo: boolean;
            showAddress: boolean;
            showPhone: boolean;
            footerText: string;
          }) || {
            showLogo: true,
            showAddress: true,
            showPhone: true,
            footerText: 'Gracias por su visita'
          },
          languageSettings: (settingsData.language_settings as {
            language: string;
            currency: string;
            timezone: string;
          }) || {
            language: 'es',
            currency: 'COP',
            timezone: 'America/Bogota'
          },
          blockedNames: (settingsData.blocked_names as string[]) || []
        });
      }

      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Configurar subscripciones en tiempo real optimizadas
  useEffect(() => {
    if (!user) return;

    let mounted = true;
    let channel: any = null;

    const setupRealtimeSubscriptions = async () => {
      try {
        console.log('🔗 Configurando subscripciones optimizadas en tiempo real...');
        
        // Crear un canal único para todas las tablas
        channel = supabase
          .channel(`realtime_data_${user.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'system_users',
            filter: `user_id=eq.${user.id}`
          }, (payload) => {
            if (!mounted) return;
            
            console.log('🔄 Cambio detectado en system_users:', payload.eventType);
            
            if (payload.eventType === 'INSERT') {
              const newUser: SystemUserData = {
                id: payload.new.id,
                name: payload.new.name,
                pin: payload.new.pin,
                role: payload.new.role as 'owner' | 'admin' | 'barber',
                branchId: payload.new.branch_id || '1',
                isBlocked: payload.new.is_blocked || false
              };
              
              setSystemUsers(prev => {
                const exists = prev.find(u => u.id === newUser.id);
                if (!exists) {
                  console.log('➕ Agregando nuevo usuario al estado:', newUser.name);
                  return [...prev, newUser];
                }
                return prev;
              });
              
              toast({
                title: "Usuario agregado",
                description: `${newUser.name} ha sido agregado exitosamente`,
              });
              
            } else if (payload.eventType === 'UPDATE') {
              const updatedUser: SystemUserData = {
                id: payload.new.id,
                name: payload.new.name,
                pin: payload.new.pin,
                role: payload.new.role as 'owner' | 'admin' | 'barber',
                branchId: payload.new.branch_id || '1',
                isBlocked: payload.new.is_blocked || false
              };
              
              setSystemUsers(prev => prev.map(u => 
                u.id === updatedUser.id ? updatedUser : u
              ));
              
              console.log('🔄 Usuario actualizado:', updatedUser.name);
              
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              setSystemUsers(prev => prev.filter(u => u.id !== deletedId));
              console.log('🗑️ Usuario eliminado:', deletedId);
            }
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'tips',
            filter: `user_id=eq.${user.id}`
          }, (payload) => {
            if (!mounted) return;
            
            console.log('🔄 Cambio detectado en tips:', payload.eventType);
            
            if (payload.eventType === 'INSERT') {
              const newTip: TipData = {
                id: payload.new.id,
                tipId: payload.new.tip_id,
                amount: Number(payload.new.amount),
                barberId: payload.new.barber_id,
                barberName: payload.new.barber_name || undefined,
                saleId: payload.new.sale_id || undefined,
                paymentMethod: payload.new.payment_method,
                date: new Date(payload.new.date)
              };
              
              setTips(prev => {
                const exists = prev.find(t => t.id === newTip.id);
                if (!exists) {
                  console.log('➕ Agregando nueva propina al estado:', newTip.amount);
                  return [newTip, ...prev];
                }
                return prev;
              });
              
              toast({
                title: "Propina registrada",
                description: `Nueva propina de $${newTip.amount}`,
              });
              
            } else if (payload.eventType === 'UPDATE') {
              const updatedTip: TipData = {
                id: payload.new.id,
                tipId: payload.new.tip_id,
                amount: Number(payload.new.amount),
                barberId: payload.new.barber_id,
                barberName: payload.new.barber_name || undefined,
                saleId: payload.new.sale_id || undefined,
                paymentMethod: payload.new.payment_method,
                date: new Date(payload.new.date)
              };
              
              setTips(prev => prev.map(t => 
                t.id === updatedTip.id ? updatedTip : t
              ));
              
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              setTips(prev => prev.filter(t => t.id !== deletedId));
            }
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_preferences',
            filter: `user_id=eq.${user.id}`
          }, () => {
            if (mounted) loadInitialData();
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'app_settings',
            filter: `user_id=eq.${user.id}`
          }, () => {
            if (mounted) loadInitialData();
          });

        await channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscripciones optimizadas establecidas exitosamente');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Error en subscripciones en tiempo real');
          }
        });

      } catch (error) {
        console.error('Error setting up realtime subscriptions:', error);
      }
    };

    setupRealtimeSubscriptions();

    return () => {
      mounted = false;
      if (channel) {
        try {
          supabase.removeChannel(channel);
          console.log('🔌 Subscripciones limpiadas correctamente');
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      }
    };
  }, [user, loadInitialData, toast]);

  // Cargar datos cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      loadInitialData();
    } else {
      setSystemUsers([]);
      setUserPreferences(null);
      setTips([]);
      setIsDataLoaded(false);
    }
  }, [user, loadInitialData]);

  // Funciones CRUD para system_users
  const addSystemUser = async (userData: Omit<SystemUserData, 'id'>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    try {
      const insertData: SystemUserInsert = {
        user_id: user.id,
        name: userData.name,
        pin: userData.pin,
        role: userData.role,
        branch_id: userData.branchId,
        is_blocked: userData.isBlocked || false
      };

      const { error } = await supabase
        .from('system_users')
        .insert(insertData);

      if (error) {
        console.error('Error adding system user:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Usuario del sistema agregado exitosamente');
      return { success: true };
    } catch (error) {
      console.error('Unexpected error adding system user:', error);
      return { success: false, error: 'Error inesperado' };
    }
  };

  const updateSystemUser = async (userData: SystemUserData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('system_users')
        .update({
          name: userData.name,
          pin: userData.pin,
          role: userData.role,
          branch_id: userData.branchId,
          is_blocked: userData.isBlocked || false
        })
        .eq('id', userData.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating system user:', error);
        return false;
      }

      console.log('✅ Usuario del sistema actualizado exitosamente');
      return true;
    } catch (error) {
      console.error('Error updating system user:', error);
      return false;
    }
  };

  const deleteSystemUser = async (userId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('system_users')
        .delete()
        .eq('id', userId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting system user:', error);
        return false;
      }

      console.log('✅ Usuario del sistema eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('Error deleting system user:', error);
      return false;
    }
  };

  // Funciones para user_preferences
  const updateUserPreferences = async (preferences: Partial<UserPreferencesData>): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData = {
        sidebar_open: preferences.sidebarOpen,
        theme: preferences.theme,
        notifications_enabled: preferences.notificationsEnabled,
        preferences: preferences.preferences
      };

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updateData
        });

      return !error;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  };

  // Funciones para tips
  const addTip = async (tipData: Omit<TipData, 'id'>): Promise<boolean> => {
    if (!user) return false;

    try {
      const insertData: TipInsert = {
        user_id: user.id,
        tip_id: tipData.tipId,
        amount: tipData.amount,
        barber_id: tipData.barberId,
        barber_name: tipData.barberName,
        sale_id: tipData.saleId,
        payment_method: tipData.paymentMethod,
        date: tipData.date.toISOString()
      };

      const { error } = await supabase
        .from('tips')
        .insert(insertData);

      if (error) {
        console.error('Error adding tip:', error);
        return false;
      }

      console.log('✅ Propina agregada exitosamente');
      return true;
    } catch (error) {
      console.error('Error adding tip:', error);
      return false;
    }
  };

  // Funciones para app_settings
  const updateAppSettings = async (settings: Partial<AppSettingsExtended>): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData = {
        branch_name: settings.branchName,
        address: settings.address,
        phone: settings.phone,
        receipt_settings: settings.receiptSettings,
        language_settings: settings.languageSettings,
        blocked_names: settings.blockedNames
      };

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          ...updateData
        });

      return !error;
    } catch (error) {
      console.error('Error updating app settings:', error);
      return false;
    }
  };

  return {
    // Estados
    systemUsers,
    userPreferences,
    tips,
    appSettings,
    isLoading,
    isDataLoaded,
    
    // Funciones CRUD
    addSystemUser,
    updateSystemUser,
    deleteSystemUser,
    updateUserPreferences,
    addTip,
    updateAppSettings,
    
    // Función para refrescar datos
    refreshData: loadInitialData
  };
};
