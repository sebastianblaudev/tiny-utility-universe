
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getLockedMenuItems } from '@/lib/supabase-helpers';
import { toast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'cashier';

// Add license info type
type LicenseInfo = {
  isActive: boolean;
  paymentDate: string | null;
  expirationDate: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  userRole: UserRole;
  lockedMenuItems: string[];
  licenseInfo: LicenseInfo;
  tenantId: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshLockedItems: () => Promise<void>;
  updateLicenseStatus: (isActive: boolean, expirationDate?: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [lockedMenuItems, setLockedMenuItems] = useState<string[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>({
    isActive: false,
    paymentDate: null,
    expirationDate: null,
  });

  const refreshLockedItems = async () => {
    if (user) {
      const itemIds = await getLockedMenuItems();
      setLockedMenuItems(itemIds);
    } else {
      setLockedMenuItems([]);
    }
  };

  const updateLicenseStatus = async (isActive: boolean, expirationDate?: string): Promise<boolean> => {
    try {
      if (!user) return false;
      
      const now = new Date().toISOString();
      const expDate = expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase.auth.updateUser({
        data: {
          licenseActive: isActive,
          licensePaymentDate: isActive ? now : null,
          licenseExpirationDate: isActive ? expDate : null
        }
      });
      
      if (error) throw error;
      
      setLicenseInfo({
        isActive,
        paymentDate: isActive ? now : null,
        expirationDate: isActive ? expDate : null
      });
      
      return true;
    } catch (error) {
      console.error("Error actualizando estado de licencia:", error);
      return false;
    }
  };

  useEffect(() => {
    try {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            const role = currentUser.user_metadata?.role as UserRole || 'admin';
            setUserRole(role);
            
            const userTenantId = currentUser.user_metadata?.tenant_id || null;
            
            if (userTenantId) {
              console.log("Setting tenant ID from auth state change:", userTenantId);
              setTenantId(userTenantId);
              
              localStorage.setItem('current_tenant_id', userTenantId);
            } else {
              console.warn("No tenant_id found in user metadata!");
              const newTenantId = crypto.randomUUID();
              console.log("Generated new tenant ID:", newTenantId);
              
              try {
                const { error } = await supabase.auth.updateUser({
                  data: { tenant_id: newTenantId }
                });
                
                if (error) {
                  console.error("Error updating user with new tenant ID:", error);
                } else {
                  console.log("Updated user with new tenant ID:", newTenantId);
                  setTenantId(newTenantId);
                  localStorage.setItem('current_tenant_id', newTenantId);
                }
              } catch (updateError) {
                console.error("Exception updating user:", updateError);
              }
            }
            
            refreshLockedItems();
            
            const licenseActive = !!currentUser.user_metadata?.licenseActive;
            const licensePaymentDate = currentUser.user_metadata?.licensePaymentDate;
            const licenseExpirationDate = currentUser.user_metadata?.licenseExpirationDate;
            
            setLicenseInfo({
              isActive: licenseActive,
              paymentDate: licensePaymentDate || null,
              expirationDate: licenseExpirationDate || null
            });
          } else {
            setLockedMenuItems([]);
            setTenantId(null);
            localStorage.removeItem('current_tenant_id');
            setLicenseInfo({
              isActive: false,
              paymentDate: null,
              expirationDate: null
            });
          }
          
          setLoading(false);
        }
      );

      supabase.auth.getSession().then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          const role = currentUser.user_metadata?.role as UserRole || 'admin';
          setUserRole(role);
          
          const userTenantId = currentUser.user_metadata?.tenant_id || null;
          
          if (userTenantId) {
            console.log("Setting tenant ID from initial session:", userTenantId);
            setTenantId(userTenantId);
            
            localStorage.setItem('current_tenant_id', userTenantId);
          } else {
            console.warn("No tenant_id found in initial session metadata!");
          }
          
          refreshLockedItems();
          
          const licenseActive = !!currentUser.user_metadata?.licenseActive;
          const licensePaymentDate = currentUser.user_metadata?.licensePaymentDate;
          const licenseExpirationDate = currentUser.user_metadata?.licenseExpirationDate;
          
          setLicenseInfo({
            isActive: licenseActive,
            paymentDate: licensePaymentDate || null,
            expirationDate: licenseExpirationDate || null
          });
        }
        
        setLoading(false);
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Auth state change error:", error);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        const role = data.user.user_metadata?.role as UserRole || 'admin';
        setUserRole(role);
        
        refreshLockedItems();
      }
      
      toast({
        title: "¡Inicio de sesión exitoso!",
        description: "Bienvenido de nuevo al sistema."
      });
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Ocurrió un error al intentar iniciar sesión.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata: any) => {
    try {
      const uniqueTenantId = crypto.randomUUID();
      console.log("Generated new tenant ID for signup:", uniqueTenantId);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            role: 'admin',
            tenant_id: uniqueTenantId,
            locked_menu_items: [],
            licenseActive: false,
            licenseMessagesDismissed: false
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "¡Registro exitoso!",
        description: "Se ha enviado un correo de confirmación a tu bandeja de entrada."
      });
    } catch (error: any) {
      toast({
        title: "Error al registrarse",
        description: error.message || "Ocurrió un error al intentar registrarse.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente."
      });
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message || "Ocurrió un error al intentar cerrar sesión.",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      userRole, 
      lockedMenuItems, 
      licenseInfo,
      tenantId,
      signIn, 
      signUp, 
      signOut, 
      refreshLockedItems,
      updateLicenseStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};
