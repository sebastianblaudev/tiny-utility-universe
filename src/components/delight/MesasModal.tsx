import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, DollarSign, Utensils } from 'lucide-react';

interface Mesa {
  id: string;
  numero: number;
  nombre: string;
  estado: 'disponible' | 'ocupada' | 'reservada';
  pedido_activo?: {
    id: string;
    items_count: number;
    total: number;
  };
}

interface MesasModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesas: Mesa[];
  onSelectMesa: (mesa: Mesa) => void;
  onViewMesaDetails: (mesa: Mesa) => void;
  loading: boolean;
}

export const MesasModal: React.FC<MesasModalProps> = ({
  isOpen,
  onClose,
  mesas,
  onSelectMesa,
  onViewMesaDetails,
  loading
}) => {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reservada':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <Users className="h-4 w-4" />;
      case 'ocupada':
        return <Utensils className="h-4 w-4" />;
      case 'reservada':
        return <Clock className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Cargando mesas...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Gestión de Mesas - Delight
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
          {mesas.map((mesa) => (
            <Card
              key={mesa.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                mesa.estado === 'disponible' 
                  ? 'hover:border-green-300 hover:bg-green-50/50' 
                  : 'hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{mesa.nombre}</h3>
                    <Badge
                      variant="outline"
                      className={getEstadoColor(mesa.estado)}
                    >
                      {getEstadoIcon(mesa.estado)}
                      <span className="ml-1 capitalize">{mesa.estado}</span>
                    </Badge>
                  </div>

                  {/* Mesa info */}
                  <div className="text-sm text-muted-foreground">
                    Mesa #{mesa.numero}
                  </div>

                  {/* Order info if occupied */}
                  {mesa.pedido_activo && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Items:</span>
                        <span className="font-medium">{mesa.pedido_activo.items_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium text-primary flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${mesa.pedido_activo.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    {mesa.estado === 'disponible' ? (
                      <Button
                        onClick={() => onSelectMesa(mesa)}
                        className="w-full"
                        size="sm"
                      >
                        Seleccionar Mesa
                      </Button>
                    ) : (
                      <div className="space-y-1">
                        <Button
                          onClick={() => onViewMesaDetails(mesa)}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          Ver Detalles
                        </Button>
                        <Button
                          onClick={() => onSelectMesa(mesa)}
                          className="w-full"
                          size="sm"
                        >
                          Retomar Mesa
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mesas.length === 0 && (
          <div className="flex items-center justify-center h-40">
            <div className="text-center text-muted-foreground">
              <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay mesas disponibles</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};