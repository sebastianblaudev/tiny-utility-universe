
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { cerrarTurno } from '@/utils/turnosUtils';
import { formatCurrency } from '@/lib/utils';

interface CerrarTurnoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  turnoId: string;
  saldoActual: number;
  onSuccess?: () => void;
}

const CerrarTurnoDialog = ({ isOpen, onClose, turnoId, saldoActual, onSuccess }: CerrarTurnoDialogProps) => {
  const [montoFinal, setMontoFinal] = useState(saldoActual);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    
    try {
      const result = await cerrarTurno(turnoId, montoFinal, observaciones);
      
      if (result) {
        toast.success('Turno cerrado correctamente');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error('Error al cerrar el turno');
      }
    } catch (error) {
      console.error('Error closing turno:', error);
      toast.error('Error al cerrar el turno');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cerrar Turno</DialogTitle>
          <DialogDescription>
            Confirma el monto final y agrega observaciones si es necesario
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Saldo calculado:</span>
              <span className="font-medium">{formatCurrency(saldoActual)}</span>
            </div>
            
            <Label htmlFor="montoFinal">Monto final en caja</Label>
            <Input
              id="montoFinal"
              type="number"
              step="0.01"
              min="0"
              value={montoFinal}
              onChange={(e) => setMontoFinal(Number(e.target.value))}
              required
            />
            
            {montoFinal !== saldoActual && (
              <div className="text-sm">
                <span className="text-yellow-500">
                  Hay una diferencia de {formatCurrency(montoFinal - saldoActual)}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder="Novedades, problemas o comentarios sobre el turno"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Cerrando...' : 'Cerrar Turno'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CerrarTurnoDialog;
