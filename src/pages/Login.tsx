import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { LoadingIndicator } from '@/components/ui/skeleton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      // Redirigir según el tipo de dispositivo
      if (isMobile) {
        navigate('/admin'); // Panel Admin para móviles
      } else {
        navigate('/pos'); // POS para escritorio
      }
    } catch (error) {
      console.error('Login error:', error);
      // Toast is already handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'} animate-in`}>
        <Card className="glass-morph border-0">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura.PNG-dde30VtfYzHLUdcOvDHgQYHl2z3yfa.png" 
                alt="Logo VentaPOS" 
                className="h-16 w-auto"
              />
            </div>
            <CardDescription className="text-center">
              Ingresa a tu cuenta para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-all duration-200 pr-10"
                  />
                  <button 
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full transition-all duration-300" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <LoadingIndicator size="sm" />
                    Iniciando sesión...
                  </span>
                ) : 'Iniciar sesión'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className={`text-${isMobile ? 'xs' : 'sm'} text-center text-gray-500 dark:text-gray-400`}>
              <Link 
                to="/reset-password" 
                className="text-blue-500 hover:text-blue-700 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className={`text-${isMobile ? 'xs' : 'sm'} text-center text-gray-500 dark:text-gray-400`}>
              ¿No tienes una cuenta?{' '}
              <Link 
                to="/register" 
                className="text-blue-500 hover:text-blue-700 transition-colors"
              >
                Regístrate
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
