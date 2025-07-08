import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { getTurnoActivo, getCurrentCashierSalesTotals } from '@/utils/turnosUtils';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fixMissingSaleTurnoIds } from '@/utils/salesUtils';
import { toast } from 'sonner';

import GestionHeader from '@/components/gestion/GestionHeader';
import CajeroAbrirCerrarTurno from '@/components/gestion/CajeroAbrirCerrarTurno';
import CajeroVentas from '@/components/gestion/CajeroVentas';

const Gestion = () => {
  const { tenantId } = useAuth();
  const isOnline = useOnlineStatus();
  const [turnoActivo, setTurnoActivo] = useState<any | null>(null);
  const [ventas, setVentas] = useState<{
    totalSales: number;
    byPaymentMethod: Record<string, number>;
  }>({
    totalSales: 0,
    byPaymentMethod: {}
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fixingMissingSales, setFixingMissingSales] = useState(false);

  const loadData = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      // Obtener el turno activo
      const turno = await getTurnoActivo(tenantId);
      setTurnoActivo(turno);
      
      // Si hay un turno activo, obtener las ventas
      if (turno) {
        const ventasTotales = await getCurrentCashierSalesTotals();
        setVentas(ventasTotales);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId]);

  // Función para refrescar los datos
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Función que se ejecuta cuando hay cambios en el turno
  const handleTurnoChange = () => {
    loadData();
  };

  // Función para corregir las ventas sin turno_id
  const handleFixMissingSales = async () => {
    if (!tenantId || fixingMissingSales) return;
    
    setFixingMissingSales(true);
    try {
      const result = await fixMissingSaleTurnoIds(tenantId);
      
      if (result.fixed > 0) {
        toast.success(`Se han corregido ${result.fixed} de ${result.total} ventas sin turno asignado.`);
        // Recargar datos
        await loadData();
      } else if (result.total > 0) {
        toast.info(`No se pudieron corregir ${result.total} ventas sin turno asignado. Asegúrese de que los cajeros y turnos coincidan.`);
      } else {
        toast.success("Todas las ventas ya tienen un turno asignado.");
      }
    } catch (error) {
      console.error("Error corrigiendo ventas:", error);
      toast.error("Error al intentar corregir ventas sin turno.");
    } finally {
      setFixingMissingSales(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <GestionHeader turnoActivo={turnoActivo} />
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing || !isOnline}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleFixMissingSales}
              disabled={fixingMissingSales || !isOnline}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${fixingMissingSales ? 'animate-spin' : ''}`} />
              Corregir ventas sin turno
            </Button>
          </div>
        </div>

        {!isOnline && (
          <Card className="mb-4 border-yellow-400 bg-yellow-50">
            <CardContent className="py-3">
              <p className="text-yellow-700 text-center">
                Estás en modo sin conexión. Algunas funciones pueden no estar disponibles.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Componente para abrir/cerrar turno */}
          <div>
            <CajeroAbrirCerrarTurno 
              onTurnoChange={handleTurnoChange} 
              turnoActivo={turnoActivo} 
            />
          </div>

          {/* Componente para mostrar ventas */}
          <div>
            {turnoActivo ? (
              <CajeroVentas 
                ventas={ventas} 
                cajeroNombre={turnoActivo.cajero_nombre} 
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="py-6 text-center text-muted-foreground">
                  {loading ? (
                    <p>Cargando información...</p>
                  ) : (
                    <p>Abra un turno para ver las estadísticas de ventas</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Gestion;
