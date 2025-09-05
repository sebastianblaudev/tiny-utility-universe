
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/contexts/AuthContext';
import { getTurnoActivo, cerrarTurno } from '@/utils/turnosUtils';
import { toast } from 'sonner';
import { Play, StopCircle } from 'lucide-react';
import TurnoForm from '@/components/cashier/TurnoForm';
import CerrarTurnoDialog from '@/components/cashier/CerrarTurnoDialog';

const TurnosList: React.FC = () => {
  const { tenantId } = useAuth();
  const [turnoActivo, setTurnoActivo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCerrarDialog, setShowCerrarDialog] = useState(false);
  
  useEffect(() => {
    if (tenantId) {
      checkTurnoActivo();
    }
  }, [tenantId]);
  
  const checkTurnoActivo = async () => {
    setLoading(true);
    try {
      const turno = await getTurnoActivo(tenantId || '');
      setTurnoActivo(turno);
    } catch (error) {
      console.error("Error checking turno activo:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTurnoChange = () => {
    checkTurnoActivo();
  };
  
  const openCerrarDialog = () => {
    setShowCerrarDialog(true);
  };

  const closeCerrarDialog = () => {
    setShowCerrarDialog(false);
  };
  
  return (
    <div className="w-full">
      <ScrollArea className="h-[calc(100vh-220px)]">
        {/* Full Width Turno Form or Active Turno Info */}
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Cargando...</p>
            </CardContent>
          </Card>
        ) : turnoActivo ? (
          <Card>
            <CardHeader>
              <CardTitle>Turno Activo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cajero</p>
                  <p className="font-medium">{turnoActivo.cajero_nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Apertura</p>
                  <p className="font-medium">{new Date(turnoActivo.fecha_apertura).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monto Inicial</p>
                  <p className="font-medium">${turnoActivo.monto_inicial}</p>
                </div>
                <Button 
                  onClick={openCerrarDialog} 
                  variant="destructive" 
                  className="w-full mt-4"
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  Cerrar Turno
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <h3 className="text-lg font-medium mb-4">Iniciar Turno</h3>
            <TurnoForm onSuccess={handleTurnoChange} />
          </div>
        )}
      </ScrollArea>
      
      {/* Cerrar Turno Dialog */}
      {turnoActivo && (
        <CerrarTurnoDialog
          isOpen={showCerrarDialog}
          onClose={closeCerrarDialog}
          turnoId={turnoActivo.id}
          saldoActual={turnoActivo.monto_inicial || 0}
          onSuccess={handleTurnoChange}
        />
      )}
    </div>
  );
};

export default TurnosList;
