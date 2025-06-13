
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface LicenseActivationModalProps {
  onRetry: () => void;
  isChecking: boolean;
}

const LicenseActivationModal: React.FC<LicenseActivationModalProps> = ({ 
  onRetry, 
  isChecking 
}) => {
  const { signOut } = useSupabaseAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center mb-4 mx-auto">
            <img 
              src="/lovable-uploads/511104df-026a-46d9-bf3f-fc3dd4b01357.png" 
              alt="BarberPOS Logo" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-xl text-red-600 flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Activar Licencia
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Su licencia de BarberPOS ha expirado o su cuenta no está activa.
          </p>
          <p className="text-sm text-gray-500">
            Para seguir usando el sistema, necesita activar su licencia o contactar con soporte.
          </p>
          
          <div className="space-y-3 pt-4">
            <Button 
              onClick={onRetry}
              disabled={isChecking}
              className="w-full"
              variant="outline"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Reintentar Verificación'
              )}
            </Button>
            
            <Button 
              onClick={handleSignOut}
              className="w-full"
              variant="destructive"
            >
              Cerrar Sesión
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-400">
              ¿Necesita ayuda? Contacte con soporte técnico
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseActivationModal;
