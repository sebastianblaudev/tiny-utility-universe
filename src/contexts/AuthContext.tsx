import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { useSupabaseRealtimeData } from '@/hooks/useSupabaseRealtimeData';

interface AuthContextType {
  currentUser: User | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  isOwner: boolean;
  isAdmin: boolean;
  isBarber: boolean;
  addUser: (user: User) => Promise<{ success: boolean; error?: string }>;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  getAllUsers: () => User[];
  refreshUsers: () => Promise<void>;
  showLoginEffect: boolean;
  setShowLoginEffect: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { user: supabaseUser, session } = useSupabaseAuth();
  const { 
    systemUsers, 
    addSystemUser, 
    updateSystemUser, 
    deleteSystemUser, 
    refreshData,
    isDataLoaded 
  } = useSupabaseRealtimeData();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [supabaseProfile, setSupabaseProfile] = useState<any>(null);
  const [showLoginEffect, setShowLoginEffect] = useState(false);

  // Cargar perfil de Supabase cuando el usuario esté autenticado
  useEffect(() => {
    const loadSupabaseProfile = async () => {
      if (supabaseUser) {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        setSupabaseProfile(profile);
      } else {
        setSupabaseProfile(null);
      }
    };

    loadSupabaseProfile();
  }, [supabaseUser]);

  const login = async (pin: string): Promise<boolean> => {
    console.log(`Attempting login with PIN: ${pin}`);
    
    // Buscar en usuarios del sistema de Supabase
    const systemUser = systemUsers.find(u => u.pin === pin);
    if (systemUser) {
      console.log('Login successful with system user:', systemUser);
      const localUser: User = {
        id: systemUser.id,
        name: systemUser.name,
        pin: systemUser.pin,
        role: systemUser.role,
        branchId: systemUser.branchId
      };
      setCurrentUser(localUser);
      
      // Activar efecto de login exitoso
      setShowLoginEffect(true);
      
      return true;
    }
    
    // Si hay usuario de Supabase autenticado, verificar también
    if (supabaseUser && supabaseProfile && supabaseProfile.pin === pin) {
      console.log('Login successful with Supabase profile:', supabaseProfile);
      const localUser: User = {
        id: supabaseProfile.id,
        name: supabaseProfile.name || supabaseUser.email || 'Usuario',
        pin: supabaseProfile.pin,
        role: supabaseProfile.role as 'owner' | 'admin' | 'barber',
        branchId: supabaseProfile.branch_id || '1'
      };
      setCurrentUser(localUser);
      
      // Activar efecto de login exitoso
      setShowLoginEffect(true);
      
      return true;
    }
    
    console.log('Login failed: No matching PIN found');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setShowLoginEffect(false);
  };

  const addUser = async (user: User): Promise<{ success: boolean; error?: string }> => {
    console.log('Adding user:', user);
    
    // Convertir a formato de SystemUserData
    const userData = {
      name: user.name.trim(),
      pin: user.pin,
      role: user.role,
      branchId: user.branchId || '1',
      isBlocked: false
    };
    
    return await addSystemUser(userData);
  };

  const updateUser = async (user: User) => {
    console.log('Updating user:', user);
    
    const userData = {
      id: user.id,
      name: user.name.trim(),
      pin: user.pin,
      role: user.role,
      branchId: user.branchId || '1',
      isBlocked: false
    };
    
    const success = await updateSystemUser(userData);
    
    // Si el usuario actualizado es el actualmente logueado, actualizar el estado
    if (currentUser && currentUser.id === user.id) {
      setCurrentUser(user);
    }
    
    return success;
  };

  const deleteUser = async (userId: string) => {
    console.log('Deleting user:', userId);
    await deleteSystemUser(userId);
  };

  const getAllUsers = (): User[] => {
    // Convertir systemUsers a formato User
    const users: User[] = systemUsers.map(su => ({
      id: su.id,
      name: su.name,
      pin: su.pin,
      role: su.role,
      branchId: su.branchId
    }));
    
    console.log('Getting all users:', users);
    return users;
  };

  const refreshUsers = async (): Promise<void> => {
    await refreshData();
  };

  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin' || isOwner;
  const isBarber = currentUser?.role === 'barber' || isAdmin;

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isOwner,
      isAdmin,
      isBarber,
      addUser,
      updateUser,
      deleteUser,
      getAllUsers,
      refreshUsers,
      showLoginEffect,
      setShowLoginEffect
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
