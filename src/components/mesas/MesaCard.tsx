import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, ChefHat } from "lucide-react";
import type { Mesa } from "@/hooks/useMesas";

interface MesaCardProps {
  mesa: Mesa;
  tienePedidoActivo?: boolean;
  onSelect: (mesa: Mesa) => void;
  onEdit?: (mesa: Mesa) => void;
}

const estadoColors = {
  disponible: "bg-green-500",
  ocupada: "bg-red-500", 
  reservada: "bg-yellow-500",
  fuera_servicio: "bg-gray-500"
};

const estadoLabels = {
  disponible: "Disponible",
  ocupada: "Ocupada",
  reservada: "Reservada", 
  fuera_servicio: "Fuera de servicio"
};

export function MesaCard({ mesa, tienePedidoActivo, onSelect, onEdit }: MesaCardProps) {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${
      mesa.estado === 'disponible' ? 'hover:shadow-green-200' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${estadoColors[mesa.estado]}`} />
            <h3 className="font-semibold text-lg">Mesa {mesa.numero}</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {estadoLabels[mesa.estado]}
          </Badge>
        </div>

        {mesa.nombre && (
          <p className="text-sm text-muted-foreground mb-2">{mesa.nombre}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{mesa.capacidad}</span>
          </div>
          {mesa.ubicacion && (
            <span className="text-xs">{mesa.ubicacion}</span>
          )}
        </div>

        {tienePedidoActivo && (
          <div className="flex items-center gap-1 mb-3 text-orange-600">
            <ChefHat className="w-4 h-4" />
            <span className="text-sm font-medium">Pedido activo</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={() => onSelect(mesa)}
            disabled={mesa.estado === 'fuera_servicio'}
            className="flex-1"
            variant={mesa.estado === 'disponible' ? 'default' : 'secondary'}
          >
            {mesa.estado === 'disponible' ? 'Tomar Pedido' : 'Ver Pedido'}
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(mesa);
              }}
            >
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}