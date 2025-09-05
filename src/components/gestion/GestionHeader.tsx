
import React from 'react';
import { CalendarClock, LogOut, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GestionHeaderProps {
  turnoActivo: any | null;
}

const GestionHeader = ({ turnoActivo }: GestionHeaderProps) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-2">Gestión de Caja</h1>
      
      <div className="flex items-center gap-2 text-muted-foreground">
        {turnoActivo ? (
          <>
            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
              <User className="h-3 w-3 mr-1" />
              {turnoActivo.cajero_nombre}
            </Badge>
            
            <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              <CalendarClock className="h-3 w-3 mr-1" />
              Turno abierto: {new Date(turnoActivo.fecha_apertura).toLocaleString()}
            </Badge>
          </>
        ) : (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <LogOut className="h-3 w-3 mr-1" />
            No hay turno activo
          </Badge>
        )}
      </div>
    </div>
  );
};

export default GestionHeader;
