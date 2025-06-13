import { useState } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock, UserPlus, LogIn, User } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';

const SupabaseAuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'barber'>('barber');
  const [loading, setLoading] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [checkingFirstUser, setCheckingFirstUser] = useState(false);
  const { signUp, signIn } = useSupabaseAuth();
  const { toast } = useToast();

  // Check if this is the first user when switching to signup
  const checkFirstUser = async () => {
    if (!isSignUp) return;
    
    setCheckingFirstUser(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Error checking for existing users:', error);
        setIsFirstUser(false);
      } else {
        const isFirst = !data || data.length === 0;
        setIsFirstUser(isFirst);
        
        if (isFirst) {
          setRole('admin');
        }
      }
    } catch (error) {
      console.error('Error checking first user:', error);
      setIsFirstUser(false);
    } finally {
      setCheckingFirstUser(false);
    }
  };

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateName = (name: string) => {
    const trimmedName = name.trim();
    return trimmedName.length >= 2 && trimmedName.length <= 50;
  };

  const validatePin = (pin: string) => {
    return /^\d{4}$/.test(pin);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF']
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic validations
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "El email es requerido",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!password) {
      toast({
        title: "Error",
        description: "La contraseña es requerida",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (isSignUp) {
      // Additional validations for signup
      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Las contraseñas no coinciden",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        toast({
          title: "Error",
          description: "El nombre es requerido",
        variant: "destructive",
      });
        setLoading(false);
        return;
      }

      if (!validateName(trimmedName)) {
        toast({
          title: "Error",
          description: "El nombre debe tener entre 2 y 50 caracteres",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!validatePin(pin)) {
        toast({
          title: "Error",
          description: "El PIN debe tener exactamente 4 dígitos",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (pin !== confirmPin) {
        toast({
          title: "Error",
          description: "Los PINs no coinciden",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        console.log('Registering user with data:', {
          email: email.trim(),
          name: name.trim(),
          pin: pin,
          role: isFirstUser ? 'admin' : role
        });

        // Registration with additional data in metadata
        const { error } = await signUp(email.trim(), password, {
          name: name.trim(),
          pin: pin,
          role: isFirstUser ? 'admin' : role
        });

        if (error) {
          console.error('Registration error:', error);
          let errorMessage = "Ocurrió un error inesperado";
          
          if (error.message?.includes('User already registered')) {
            errorMessage = "Este email ya está registrado. Intenta iniciar sesión.";
          } else if (error.message?.includes('Password should be at least 6 characters')) {
            errorMessage = "La contraseña debe tener al menos 6 caracteres";
          } else if (error.message?.includes('Unable to validate email address')) {
            errorMessage = "Email inválido";
          } else if (error.message) {
            errorMessage = error.message;
          }

          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          // Trigger confetti only after successful registration
          triggerConfetti();
          
          toast({
            title: "¡Registro exitoso!",
            description: "Tu cuenta ha sido creada correctamente.",
          });
          
          // Don't redirect immediately, let the profile load naturally
        }
      } else {
        // Normal login
        const { error } = await signIn(email.trim(), password);

        if (error) {
          let errorMessage = "Ocurrió un error inesperado";
          
          if (error.message?.includes('Invalid login credentials')) {
            errorMessage = "Email o contraseña incorrectos";
          } else if (error.message?.includes('Email not confirmed')) {
            errorMessage = "Por favor confirma tu email antes de iniciar sesión";
          } else if (error.message) {
            errorMessage = error.message;
          }

          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          // Successful login - redirect will be handled by LoginPage
          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente",
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    const newMode = !isSignUp;
    setIsSignUp(newMode);
    
    // Clear form when switching modes
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPin('');
    setConfirmPin('');
    setRole('barber');
    
    // Check first user when switching to signup
    if (newMode) {
      checkFirstUser();
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center p-4 relative bg-black"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black to-gray-950/20"></div>
      
      {/* Minimal floating particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-white/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/2 w-0.5 h-0.5 bg-white/15 rounded-full animate-pulse delay-700"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-black/40 backdrop-blur-sm border-gray-800/50">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center mb-4 mx-auto">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/37y33OJ-clLqDjKmKEn8VUHgWWwNkNEj4nv5RZ.png" 
              alt="BarberPOS Logo" 
              className="h-16 w-auto filter drop-shadow-2xl"
            />
          </div>
          <h1 className="text-2xl font-light text-white tracking-wider mb-2">
            BarberPOS
          </h1>
          <p className="text-gray-400 text-xs font-light tracking-widest uppercase">
            {isSignUp ? 'Crea tu cuenta' : 'Inicia sesión'}
          </p>
          {isSignUp && isFirstUser && (
            <div className="mt-2 p-2 bg-blue-900/20 border border-blue-700/30 rounded-md">
              <p className="text-sm text-blue-400 font-light">
                ℹ️ Como primer usuario, serás configurado automáticamente como administrador
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {checkingFirstUser ? (
            <div className="text-center py-4">
              <p className="text-gray-300 font-light">Verificando configuración del sistema...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <Label htmlFor="name" className="text-gray-300 text-sm font-light">Nombre completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="pl-10 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-white/20"
                      required
                      disabled={loading}
                      maxLength={50}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-gray-300 text-sm font-light">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="pl-10 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-white/20"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="password" className="text-gray-300 text-sm font-light">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-white/20"
                    required
                    minLength={6}
                    disabled={loading}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                </div>
              </div>

              {isSignUp && (
                <>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-gray-300 text-sm font-light">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-white/20"
                        required
                        minLength={6}
                        disabled={loading}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {!isFirstUser && (
                    <div>
                      <Label htmlFor="role" className="text-gray-300 text-sm font-light">Rol en el sistema</Label>
                      <Select value={role} onValueChange={(value) => setRole(value as 'owner' | 'admin' | 'barber')} disabled={loading}>
                        <SelectTrigger className="bg-gray-900/50 border-gray-700/50 text-white focus:border-white/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 text-white">
                          <SelectItem value="owner" className="text-white hover:bg-gray-800">Propietario</SelectItem>
                          <SelectItem value="admin" className="text-white hover:bg-gray-800">Administrador</SelectItem>
                          <SelectItem value="barber" className="text-white hover:bg-gray-800">Barbero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="pin" className="text-gray-300 text-sm font-light">PIN de acceso (4 dígitos)</Label>
                    <Input
                      id="pin"
                      type="password"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="bg-gray-900/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-white/20"
                      required
                      disabled={loading}
                      pattern="\d{4}"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPin" className="text-gray-300 text-sm font-light">Confirmar PIN</Label>
                    <Input
                      id="confirmPin"
                      type="password"
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="bg-gray-900/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-white/20"
                      required
                      disabled={loading}
                      pattern="\d{4}"
                    />
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light tracking-wide"
                disabled={loading || checkingFirstUser}
              >
                {loading ? (
                  'Procesando...'
                ) : (
                  <>
                    {isSignUp ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Registrarse
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Iniciar Sesión
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleModeSwitch}
              className="text-gray-400 hover:text-white text-sm font-light tracking-wide transition-colors"
              disabled={loading || checkingFirstUser}
            >
              {isSignUp 
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseAuthForm;
