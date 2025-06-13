import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SupabaseAuthForm from '@/components/auth/SupabaseAuthForm';
import LoadingScreen from '@/components/ui/loading-screen';
import InstallPWAPrompt from '@/components/pwa/InstallPWAPrompt';
import LoginSuccessEffect from '@/components/effects/LoginSuccessEffect';
import { supabase } from '@/integrations/supabase/client';

const LoginPage = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [supabaseProfile, setSupabaseProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  const { login, currentUser, showLoginEffect, setShowLoginEffect } = useAuth();
  const { user: supabaseUser, session, loading: authLoading, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Show loading screen on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingScreen(false);
      setIsAppReady(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Redirect to dashboard if already logged in with local auth
  useEffect(() => {
    if (currentUser && isAppReady && !authLoading && !showLoginEffect) {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, isAppReady, authLoading, showLoginEffect, navigate]);

  // Load profile when user is authenticated (only once)
  useEffect(() => {
    const loadProfile = async () => {
      if (!supabaseUser || !isAppReady || authLoading || profileLoaded || profileLoading) {
        return;
      }

      console.log('🔄 Loading profile for user:', supabaseUser.id);
      setProfileLoading(true);
      setProfileError(false);
      
      try {
        // Try to load existing profile
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .maybeSingle();
        
        if (error) {
          console.error('❌ Error loading profile:', error);
          setProfileError(true);
          return;
        }

        // If no profile exists, create one
        if (!profile) {
          console.log('🔧 Profile not found, creating one...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email,
              name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
              pin: supabaseUser.user_metadata?.pin || '1234',
              role: supabaseUser.user_metadata?.role || 'admin',
              branch_id: '1'
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating profile:', createError);
            setProfileError(true);
            return;
          }

          profile = newProfile;
          console.log('✅ Profile created successfully:', profile);
        }

        // Check if profile is complete
        if (profile && profile.pin && profile.name) {
          console.log('✅ Complete profile found:', profile);
          setSupabaseProfile(profile);
          setProfileError(false);
          
          // Create default settings if they don't exist
          await createDefaultSettings(supabaseUser.id);
        } else {
          console.log('⚠️ Profile incomplete:', profile);
          setProfileError(true);
        }
      } catch (error) {
        console.error('❌ Unexpected error loading profile:', error);
        setProfileError(true);
      } finally {
        setProfileLoading(false);
        setProfileLoaded(true);
      }
    };

    loadProfile();
  }, [supabaseUser, isAppReady, authLoading, profileLoaded, profileLoading]);

  // Create default settings function
  const createDefaultSettings = async (userId: string) => {
    try {
      // Check and create app_settings if it doesn't exist
      const { data: settings } = await supabase
        .from('app_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!settings) {
        await supabase
          .from('app_settings')
          .insert({
            user_id: userId,
            branch_name: 'Mi Barbería',
            address: '',
            phone: ''
          });
      }

      // Check and create user_preferences if it doesn't exist
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!preferences) {
        await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            theme: 'system',
            sidebar_open: false,
            notifications_enabled: true
          });
      }
    } catch (error) {
      console.error('Error creating default settings:', error);
      // Don't block the main flow
    }
  };

  // Show loading screen first
  if (showLoadingScreen) {
    return <LoadingScreen onComplete={() => setShowLoadingScreen(false)} />;
  }

  // If still loading auth state, show loading
  if (authLoading || !isAppReady) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 relative animate-fade-in bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black to-gray-950/20"></div>
        
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-white/10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/3 left-1/2 w-0.5 h-0.5 bg-white/15 rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="text-white text-center relative z-10">
          <div className="animate-spin-slow mb-4">
            <Scissors className="h-12 w-12 mx-auto animate-pulse" />
          </div>
          <p className="animate-pulse text-gray-300 font-light">Cargando...</p>
        </div>
      </div>
    );
  }

  // If not authenticated with Supabase, show auth form
  if (!supabaseUser || !session) {
    return (
      <div className="animate-fade-in">
        <InstallPWAPrompt />
        <SupabaseAuthForm />
      </div>
    );
  }

  // If loading profile, show loading
  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 relative animate-fade-in bg-black">
        <div className="text-white text-center relative z-10">
          <div className="animate-spin-slow mb-4">
            <Scissors className="h-12 w-12 mx-auto animate-pulse" />
          </div>
          <p className="animate-pulse text-gray-300 font-light">
            Configurando tu perfil...
          </p>
        </div>
      </div>
    );
  }

  // If profile error, show error and options
  if (profileError || !supabaseProfile) {
    const handleSignOut = async () => {
      try {
        setLoading(true);
        await signOut();
        setSupabaseProfile(null);
        setProfileError(false);
        setProfileLoaded(false);
        window.location.reload();
      } catch (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Error",
          description: "Ocurrió un error al cerrar sesión",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const handleRetryProfile = async () => {
      if (!supabaseUser) return;
      
      setLoading(true);
      setProfileLoaded(false);
      try {
        console.log('🔄 Recreating profile...');
        
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .upsert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
            pin: supabaseUser.user_metadata?.pin || '1234',
            role: supabaseUser.user_metadata?.role || 'admin',
            branch_id: '1'
          })
          .select()
          .single();
        
        if (error) {
          console.error('❌ Error recreating profile:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el perfil. Contacta soporte técnico.",
            variant: "destructive",
          });
        } else {
          console.log('✅ Profile recreated successfully:', newProfile);
          setSupabaseProfile(newProfile);
          setProfileError(false);
          
          await createDefaultSettings(supabaseUser.id);
          
          toast({
            title: "¡Perfil restaurado!",
            description: "Tu perfil ha sido creado correctamente.",
          });
        }
      } catch (error) {
        console.error('❌ Unexpected error recreating profile:', error);
        toast({
          title: "Error",
          description: "Error inesperado. Intenta cerrar sesión y volver a entrar.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setProfileLoaded(true);
      }
    };

    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 relative animate-fade-in bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black to-gray-950/20"></div>
        
        <div className="p-8 bg-black/40 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-800/50 w-full max-w-md relative z-10 text-center">
          <h2 className="text-xl font-light text-white mb-4">Configurando perfil</h2>
          <p className="text-gray-400 mb-6">Estamos preparando tu cuenta. Esto puede tomar unos segundos.</p>
          
          <div className="space-y-3">
            <button
              onClick={handleRetryProfile}
              disabled={loading}
              className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 font-light tracking-wide py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Configurando...' : 'Crear perfil'}
            </button>
            
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light tracking-wide py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              Reiniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PIN entry interface
  const handlePinChange = (value: string) => {
    if (loading) return;
    
    if (pin.length < 4) {
      const newPin = pin + value;
      setPin(newPin);
      
      if (newPin.length === 4) {
        handleLogin(newPin);
      }
    }
  };

  const handleLogin = async (pinToCheck: string) => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log('Attempting login with PIN:', pinToCheck);
      
      const success = await login(pinToCheck);
      if (success) {
        console.log('Login successful, showing effects...');
        // The effect will handle navigation
      } else {
        setPin('');
        toast({
          title: "Error de acceso",
          description: "PIN incorrecto. Inténtelo nuevamente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setPin('');
      toast({
        title: "Error de acceso",
        description: "Ocurrió un error al intentar iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginEffectComplete = () => {
    console.log('Login effect completed, navigating to dashboard');
    setShowLoginEffect(false);
    navigate('/dashboard', { replace: true });
  };

  const handleBackspace = () => {
    if (!loading) {
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!loading) {
      setPin('');
    }
  };

  const renderPinDots = () => {
    return (
      <div className="flex justify-center space-x-4 mb-8">
        {Array(4).fill(0).map((_, index) => (
          <div 
            key={index} 
            className={`h-4 w-4 rounded-full transition-all duration-300 transform ${
              index < pin.length 
                ? 'bg-white scale-110 shadow-lg' 
                : 'bg-gray-600 scale-100'
            }`} 
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <InstallPWAPrompt />
      
      <LoginSuccessEffect 
        isActive={showLoginEffect}
        onComplete={handleLoginEffectComplete}
        userName={supabaseProfile?.name || 'Usuario'}
      />
      
      <div className="min-h-screen flex flex-col justify-center items-center p-4 relative animate-fade-in bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black to-gray-950/20"></div>
        
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-white/10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/3 left-1/2 w-0.5 h-0.5 bg-white/15 rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="p-8 bg-black/40 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-800/50 w-full max-w-md relative z-10 transform animate-scale-in">
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/37y33OJ-clLqDjKmKEn8VUHgWWwNkNEj4nv5RZ.png" 
                alt="BarberPOS Logo" 
                className="h-16 w-auto mx-auto filter drop-shadow-2xl"
              />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-light text-white tracking-wider">
                BarberPOS
              </h1>
              <p className="text-gray-300 font-light text-lg">
                Hola <span className="text-white font-normal">{supabaseProfile?.name || 'Usuario'}</span>
              </p>
              <p className="text-gray-500 text-sm animate-pulse font-light tracking-wide">
                {loading ? 'Verificando...' : 'Ingrese su PIN para acceder'}
              </p>
            </div>
          </div>
          
          {renderPinDots()}
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePinChange(num.toString())}
                disabled={loading}
                className="w-16 h-16 text-2xl font-light rounded-xl bg-gray-900/50 hover:bg-gray-800/50 text-white transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95 border border-gray-700/50 hover:border-gray-600/50"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              disabled={loading}
              className="w-16 h-16 text-sm font-light rounded-xl bg-red-900/30 hover:bg-red-800/40 text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95 border border-red-700/30 hover:border-red-600/40"
            >
              Limpiar
            </button>
            <button
              onClick={() => handlePinChange('0')}
              disabled={loading}
              className="w-16 h-16 text-2xl font-light rounded-xl bg-gray-900/50 hover:bg-gray-800/50 text-white transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95 border border-gray-700/50 hover:border-gray-600/50"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              disabled={loading}
              className="w-16 h-16 text-lg font-light rounded-xl bg-yellow-900/30 hover:bg-yellow-800/40 text-yellow-400 hover:text-yellow-300 transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95 border border-yellow-700/30 hover:border-yellow-600/40"
            >
              ←
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
