
import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingIndicator } from '@/components/ui/skeleton';

interface UnlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  itemName: string;
}

const UnlockDialog: React.FC<UnlockDialogProps> = ({ 
  isOpen, 
  onClose, 
  onUnlock, 
  itemName
}) => {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { user } = useAuth();

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      toast.error('Por favor ingrese su contraseña');
      return;
    }

    setIsVerifying(true);
    try {
      // Intenta iniciar sesión con la contraseña proporcionada
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password,
      });

      if (error) {
        toast.error('Contraseña incorrecta', {
          description: 'No se pudo desbloquear este elemento.'
        });
        return;
      }
      
      // Si llega aquí, la contraseña es correcta
      toast.success(`${itemName} desbloqueado`, {
        description: 'Ahora puede acceder a esta funcionalidad.'
      });
      onUnlock();
      onClose();

    } catch (error) {
      console.error('Error al verificar contraseña:', error);
      toast.error('Error al verificar la contraseña');
    } finally {
      setIsVerifying(false);
      setPassword('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={18} /> Desbloquear {itemName}
          </DialogTitle>
          <DialogDescription>
            Ingrese su contraseña de administrador para desbloquear esta funcionalidad.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleVerifyPassword();
              }
            }}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleVerifyPassword} 
            disabled={isVerifying}
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <LoadingIndicator size="sm" />
                Verificando...
              </span>
            ) : 'Desbloquear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnlockDialog;
