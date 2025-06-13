
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useBarber } from '@/contexts/BarberContext';
import { useToast } from '@/hooks/use-toast';
import { Home, MapPin, Phone } from 'lucide-react';

const BranchSettingsComponent = () => {
  const { appSettings, updateAppSettings } = useBarber();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    branchName: appSettings.branchName || '',
    address: appSettings.address || '',
    phone: appSettings.phone || ''
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateAppSettings(formData);
    toast({
      title: "Configuración guardada",
      description: "La información de la sucursal ha sido actualizada correctamente.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Información de la Sucursal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="branchName">Nombre de la Sucursal</Label>
          <Input
            id="branchName"
            value={formData.branchName}
            onChange={(e) => handleInputChange('branchName', e.target.value)}
            placeholder="Ej: Mi Barbería"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Dirección
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Ej: Calle Principal 123, Ciudad"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Teléfono
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Ej: +1 234 567 8900"
          />
        </div>
        
        <Button 
          onClick={handleSave}
          className="w-full bg-barber-600 hover:bg-barber-700"
        >
          Guardar Configuración
        </Button>
      </CardContent>
    </Card>
  );
};

export default BranchSettingsComponent;
