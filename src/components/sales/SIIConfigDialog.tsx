
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { saveSIIConfig, getSIIConfig } from "@/utils/siiChileUtils";
import { toast } from 'sonner';

interface SIIConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIIConfigDialog: React.FC<SIIConfigDialogProps> = ({ isOpen, onClose }) => {
  const { tenantId } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('https://api.simpleapi.cl/api/v1/boletas');
  const [rutEmisor, setRutEmisor] = useState('');
  const [giroEmisor, setGiroEmisor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const loadConfig = async () => {
      if (!tenantId || !isOpen) return;
      
      const config = await getSIIConfig(tenantId);
      if (config) {
        setApiKey(config.apiKey);
        setApiUrl(config.apiUrl);
        setRutEmisor(config.rutEmisor);
        setGiroEmisor(config.giroEmisor);
      }
    };
    
    loadConfig();
  }, [tenantId, isOpen]);
  
  const handleSave = async () => {
    if (!tenantId) {
      toast.error('Error: No se pudo determinar el ID del negocio');
      return;
    }
    
    if (!apiKey || !apiUrl || !rutEmisor || !giroEmisor) {
      toast.error('Por favor complete todos los campos');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await saveSIIConfig(tenantId, {
        apiKey,
        apiUrl,
        rutEmisor,
        giroEmisor
      });
      
      if (success) {
        toast.success('Configuración guardada correctamente');
        onClose();
      } else {
        toast.error('Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración SimpleAPI para SII</DialogTitle>
          <DialogDescription>
            Configure los datos necesarios para conectar con SimpleAPI y enviar documentos a SII
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-key" className="text-right">
              API Key
            </Label>
            <Input
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="col-span-3"
              placeholder="API Key de SimpleAPI"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-url" className="text-right">
              URL de API
            </Label>
            <Input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="col-span-3"
              placeholder="URL de SimpleAPI"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rut-emisor" className="text-right">
              RUT Emisor
            </Label>
            <Input
              id="rut-emisor"
              value={rutEmisor}
              onChange={(e) => setRutEmisor(e.target.value)}
              className="col-span-3"
              placeholder="RUT de su empresa (12345678-9)"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="giro-emisor" className="text-right">
              Giro Emisor
            </Label>
            <Input
              id="giro-emisor"
              value={giroEmisor}
              onChange={(e) => setGiroEmisor(e.target.value)}
              className="col-span-3"
              placeholder="Giro comercial de su empresa"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SIIConfigDialog;
