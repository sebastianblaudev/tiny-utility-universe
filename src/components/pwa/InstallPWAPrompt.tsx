
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Shield, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWAPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Don't show immediately, wait a bit for user to see the app
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      toast({
        title: "¡App instalada exitosamente!",
        description: "BarberPOS ahora está disponible en tu dispositivo",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
        toast({
          title: "Instalando app...",
          description: "BarberPOS se está instalando en tu dispositivo",
        });
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast({
        title: "Error al instalar",
        description: "No se pudo instalar la aplicación",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Show again after 24 hours
    setTimeout(() => {
      if (!isInstalled && deferredPrompt) {
        setShowPrompt(true);
      }
    }, 24 * 60 * 60 * 1000);
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-none text-white shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Instalar BarberPOS
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Protege tus datos y mejora tu experiencia
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="h-5 w-5 mt-0.5 text-blue-200" />
            <div className="text-sm text-blue-100">
              <p className="font-medium mb-1">¿Por qué instalar la app?</p>
              <ul className="space-y-1 text-xs">
                <li>• Tus datos no se perderán al cambiar de navegador</li>
                <li>• Acceso más rápido desde tu dispositivo</li>
                <li>• Funciona sin conexión a internet</li>
                <li>• Experiencia similar a una app nativa</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
            >
              <Download className="h-4 w-4 mr-2" />
              Instalar Ahora
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20"
            >
              Más tarde
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPWAPrompt;
