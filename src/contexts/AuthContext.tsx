
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import { toast } from "sonner";
import { Auth } from "@/lib/auth";

// Define the type for user profile
interface UserProfile {
  id: string;
  email: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

// Define the AuthContext type
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isBanned: boolean;
  loading: boolean;
  error: string | null;
  loginWithEmail: (email: string, password: string) => Promise<User | null>;
  loginWithPin: (pin: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<User | null>;
  checkUserStatus: () => Promise<boolean>;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Fetch user profile from Supabase
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      if (data) {
        console.log("User profile loaded:", data);
        const userProfile = data as UserProfile;
        setProfile(userProfile);
        setIsBanned(!userProfile.activo);
        return userProfile;
      }
      return null;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;
    console.log("AuthProvider initialized");

    // First set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change event:", event);
        
        if (mounted) {
          setUser(session?.user ?? null);
          
          // Handle profile fetch separately to avoid deadlocks
          if (session?.user) {
            // Use setTimeout to break potential deadlock
            setTimeout(() => {
              if (mounted) fetchUserProfile(session.user.id);
            }, 0);
          } else {
            setProfile(null);
            setIsBanned(false);
          }
          
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        console.log("Session check complete:", session?.user?.email);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserProfile(session.user.id);
        }
        
        // Mark auth as initialized after session check
        setLoading(false);
        setAuthInitialized(true);
      }
    }).catch(err => {
      console.error("Error getting session:", err);
      if (mounted) {
        setLoading(false);
        setAuthInitialized(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Check current user status (active/banned)
  const checkUserStatus = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const userProfile = await fetchUserProfile(user.id);
      return !!(userProfile && userProfile.activo);
    } catch (err) {
      console.error("Error checking user status:", err);
      return false;
    }
  }, [user, fetchUserProfile]);

  // Login with email and password
  const loginWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log("Attempting login for:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        toast.error("Error de inicio de sesión: " + error.message);
        throw error;
      }

      if (data.user) {
        console.log("Login successful for:", email);
        toast.success("Inicio de sesión exitoso");
        return data.user;
      }

      return null;
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : 'Error de inicio de sesión');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Login with PIN
  const loginWithPin = async (pin: string) => {
    try {
      setLoading(true);
      console.log("Attempting PIN login");
      
      if (!pin || pin.length !== 4) {
        throw new Error('PIN inválido');
      }
      
      // Use the Auth class from lib/auth.ts to authenticate with PIN
      const auth = Auth.getInstance();
      
      try {
        const authUser = await auth.loginWithPin(pin);
        
        if (!authUser) {
          toast.error("PIN incorrecto o usuario no encontrado");
          return null;
        }

        // If this is an admin user, verify if they are active in Supabase
        if (authUser.role === 'admin') {
          try {
            console.log("Verifying admin in Supabase:", authUser.username);
            
            // First try with exact email match
            let { data: adminData, error: adminError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('email', authUser.username)
              .maybeSingle();
            
            // If not found, try with case insensitive match
            if (adminError || !adminData) {
              console.log("Admin not found with exact match, trying case insensitive search");
              const { data: allProfiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('*');
              
              if (profilesError) {
                console.error("Error fetching profiles:", profilesError);
                toast.error("Error al buscar perfiles de usuario");
                return null;
              }
              
              if (allProfiles && allProfiles.length > 0) {
                // Find profile with case-insensitive match
                adminData = allProfiles.find(
                  profile => profile.email.toLowerCase() === authUser.username.toLowerCase()
                );
                
                if (adminData) {
                  console.log("Found admin with case insensitive match:", adminData.email);
                }
              }
            }
            
            if (!adminData) {
              console.error("Admin not found in Supabase");
              toast.error("Administrador no encontrado en Supabase");
              return null;
            }
            
            if (!adminData.activo) {
              toast.error("La cuenta de administrador está desactivada");
              return null;
            }
            
            console.log("Admin account is active in Supabase");
          } catch (verifyError) {
            console.error("Admin verification error:", verifyError);
            toast.error("Error al verificar el estado del administrador");
            return null;
          }
        }
        
        // Create a mock profile object since we're using the Auth class
        const mockProfile: UserProfile = {
          id: authUser.id,
          email: authUser.username,
          activo: true,
        };
        
        setProfile(mockProfile);
        
        // Create a mock Supabase User object for compatibility
        const mockUser: User = {
          id: authUser.id,
          email: authUser.username,
          app_metadata: {},
          user_metadata: { role: authUser.role },
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User;
        
        setUser(mockUser);
        
        toast.success(`Inicio de sesión exitoso como ${authUser.role === 'admin' ? 'Administrador' : 'Cajero'}`);
        
        return mockProfile;
      } catch (error) {
        console.error("PIN login error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión con PIN';
        toast.error(errorMessage);
        throw error;
      }
    } catch (err) {
      console.error("PIN login error:", err);
      setError(err instanceof Error ? err.message : 'Error de inicio de sesión con PIN');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log("Attempting signup for:", email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Signup error:", error);
        toast.error("Error de registro: " + error.message);
        throw error;
      }

      if (data.user) {
        toast.success("Registro exitoso");
      }

      return data.user;
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : 'Error de registro');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      console.log("Attempting logout");
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast.error("Error al cerrar sesión: " + error.message);
        throw error;
      }
      
      console.log("Logout successful");
      toast.success("Sesión cerrada correctamente");
      setUser(null);
      setProfile(null);
      setIsBanned(false);
      
      // Also logout from local Auth if it's being used
      const auth = Auth.getInstance();
      if (auth.isAuthenticated()) {
        auth.logout();
      }
      
      // Redirect to PIN login page
      window.location.href = '/login?tab=cajero';
      
      return;
    } catch (err) {
      console.error("Logout error:", err);
      setError(err instanceof Error ? err.message : 'Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Display loading state while authentication is initializing
  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-orange-500 mb-4"></div>
          <div className="h-4 w-32 bg-zinc-700 rounded text-white">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isBanned,
        loading,
        error,
        loginWithEmail,
        loginWithPin,
        logout,
        signUp,
        checkUserStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
