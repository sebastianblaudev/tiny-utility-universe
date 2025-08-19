import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Phone, Home } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomerFormProps {
  initialData?: any;
  onSubmit: (customerData: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<any>(
    initialData || {
      name: '',
      phone: '',
      address: '',
      notes: ''
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.name.trim() === '') {
      toast({
        title: "Error",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive"
      });
      return;
    }
    
    const cleanedData = {
      ...formData,
      name: formData.name?.trim(),
      phone: formData.phone?.trim() || null,
      address: formData.address?.trim() || null,
      notes: formData.notes?.trim() || null
    };
    
    onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User size={16} />
          Nombre
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          required
          placeholder="Nombre del cliente"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone size={16} />
          Teléfono
        </Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone || ''}
          onChange={handleChange}
          placeholder="Teléfono (opcional)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-2">
          <Home size={16} />
          Dirección
        </Label>
        <Textarea
          id="address"
          name="address"
          value={formData.address || ''}
          onChange={handleChange}
          placeholder="Dirección (opcional)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder="Notas adicionales (opcional)"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Guardar Cliente'}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;