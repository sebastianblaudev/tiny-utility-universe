import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, ExternalLink } from "lucide-react";

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LicenseModal = ({ isOpen, onClose }: LicenseModalProps) => {
  const handleTrial = () => {
    // Marcar el inicio de la prueba de 24 horas
    const trialStart = new Date().getTime();
    localStorage.setItem("trial_start", trialStart.toString());
    onClose();
  };

  const handlePurchase = () => {
    // Abrir el enlace de compra en una nueva ventana
    window.open("https://mpago.la/2Z8kRm8", "_blank");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-chile-blue to-chile-red">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-chile-blue">
            ¡Activa tu licencia!
          </DialogTitle>
          <DialogDescription className="text-base">
            Desbloquea todas las funcionalidades de CotiPro Chile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="mb-2">
              <Badge variant="default" className="bg-green-500 text-white text-lg px-4 py-1">
                Solo $9.900
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Pago único - Licencia permanente
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800">Prueba Gratuita</span>
            </div>
            <p className="text-sm text-amber-700">
              O prueba todas las funciones por 24 horas completamente gratis
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button 
            onClick={handlePurchase}
            className="w-full bg-gradient-to-r from-chile-blue to-chile-blue/90 hover:from-chile-blue/90 hover:to-chile-blue"
          >
            <span>Activar Licencia - $9.900</span>
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            onClick={handleTrial}
            variant="outline"
            className="w-full"
          >
            <Clock className="mr-2 h-4 w-4" />
            Probar 24 horas gratis
          </Button>
          
          <Button 
            onClick={onClose}
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseModal;
