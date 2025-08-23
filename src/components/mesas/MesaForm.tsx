import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Mesa } from "@/hooks/useMesas";

interface MesaFormProps {
  mesa?: Mesa;
  isOpen: boolean;
  onClose: () => void;
  onSave: (mesa: Omit<Mesa, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => void;
}

export function MesaForm({ mesa, isOpen, onClose, onSave }: MesaFormProps) {
  const [formData, setFormData] = useState({
    numero: mesa?.numero || 0,
    nombre: mesa?.nombre || '',
    capacidad: mesa?.capacidad || 4,
    estado: mesa?.estado || 'disponible' as const,
    ubicacion: mesa?.ubicacion || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mesa ? 'Editar Mesa' : 'Nueva Mesa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="numero">Número de Mesa *</Label>
            <Input
              id="numero"
              type="number"
              min="1"
              required
              value={formData.numero || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                numero: parseInt(e.target.value) || 0 
              }))}
            />
          </div>

          <div>
            <Label htmlFor="nombre">Nombre (opcional)</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                nombre: e.target.value 
              }))}
              placeholder="Ej: Terraza, VIP, etc."
            />
          </div>

          <div>
            <Label htmlFor="capacidad">Capacidad</Label>
            <Input
              id="capacidad"
              type="number"
              min="1"
              max="20"
              value={formData.capacidad}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                capacidad: parseInt(e.target.value) || 4 
              }))}
            />
          </div>

          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value: 'disponible' | 'ocupada' | 'reservada' | 'fuera_servicio') => 
                setFormData(prev => ({ ...prev, estado: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="ocupada">Ocupada</SelectItem>
                <SelectItem value="reservada">Reservada</SelectItem>
                <SelectItem value="fuera_servicio">Fuera de servicio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="ubicacion">Ubicación (opcional)</Label>
            <Input
              id="ubicacion"
              value={formData.ubicacion}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                ubicacion: e.target.value 
              }))}
              placeholder="Ej: Planta baja, Piso 2, etc."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {mesa ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}