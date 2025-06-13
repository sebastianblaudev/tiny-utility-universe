import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { User } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface ProfileSetupFormProps {
  onProfileCreated?: () => void;
}

const ProfileSetupForm = ({ onProfileCreated }: ProfileSetupFormProps) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'barber'>('barber');
  const [loading, setLoading] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [checkingFirstUser, setCheckingFirstUser] = useState(true);
  const { addUser } = useAuth();
  const { user: supabaseUser } = useSupabaseAuth();
  const { toast } = useToast();

  // Check if this is the first user in the system
  useEffect(() => {
    const checkFirstUser = async () => {
      if (!supabaseUser) {
        setCheckingFirstUser(false);
        return;
      }

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

    checkFirstUser();
  }, [supabaseUser]);

  const validateName = (name: string) => {
    const trimmedName = name.trim();
    return trimmedName.length >= 2 && trimmedName.length <= 50;
  };

  const validatePin = (pin: string) => {
    return /^\d{4}$/.test(pin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabaseUser) {
      toast({
        title: "Error",
        description: "No hay usuario autenticado",
        variant: "destructive",
      });
      return;
    }

    const trimmedName = name.trim();

    // Validaciones
    if (!trimmedName) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!validateName(trimmedName)) {
      toast({
        title: "Error",
        description: "El nombre debe tener entre 2 y 50 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!validatePin(pin)) {
      toast({
        title: "Error",
        description: "El PIN debe tener exactamente 4 dígitos",
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "Error",
        description: "Los PINs no coinciden",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const newUser = {
        id: supabaseUser.id,
        name: trimmedName,
        pin,
        role: isFirstUser ? 'admin' : role,
        branchId: '1'
      };

      console.log('🔄 Creating user profile:', newUser);

      const result = await addUser(newUser);
      
      if (!result.success) {
        console.error('❌ Failed to create user profile:', result.error);
        toast({
          title: "Error",
          description: result.error || "Ocurrió un error al crear el perfil",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Profile created successfully');
      
      toast({
        title: "Perfil creado",
        description: "Tu perfil ha sido configurado correctamente.",
      });

      // Notify parent that profile was created
      if (onProfileCreated) {
        console.log('🔄 Notifying parent of profile creation...');
        onProfileCreated();
      }

    } catch (error) {
      console.error('❌ Error creating profile:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al crear el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingFirstUser) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 relative animate-fade-in bg-black">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black to-gray-950/20"></div>
        
        {/* Minimal floating particles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-white/10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/3 left-1/2 w-0.5 h-0.5 bg-white/15 rounded-full animate-pulse delay-700"></div>
        </div>

        <Card className="w-full max-w-md relative z-10 bg-black/40 backdrop-blur-sm border-gray-800/50">
          <CardContent className="flex items-center justify-center p-8">
            <p className="text-gray-300 font-light">Verificando configuración del sistema...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative animate-fade-in bg-black">
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
            Configurar Perfil
          </p>
          <p className="text-gray-400 text-sm font-light">
            {isFirstUser 
              ? "Completa tu información para configurar tu cuenta de administrador"
              : "Completa tu información para acceder al sistema"
            }
          </p>
          {isFirstUser && (
            <div className="mt-2 p-2 bg-blue-900/20 border border-blue-700/30 rounded-md">
              <p className="text-sm text-blue-400 font-light">
                ℹ️ Como primer usuario, serás configurado automáticamente como administrador
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button 
              type="submit" 
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light tracking-wide"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Configurar Perfil'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetupForm;
