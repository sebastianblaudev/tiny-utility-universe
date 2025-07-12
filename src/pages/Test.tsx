import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { getTurnoActivo, getTurnoSalesByPaymentMethod } from '@/utils/turnosUtils';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CajeroVentas from '@/components/gestion/CajeroVentas';
import { toast } from 'sonner';

const Test = () => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [turnoActivo, setTurnoActivo] = useState<any | null>(null);
  const [ventas, setVentas] = useState<{
    totalSales: number;
    byPaymentMethod: Record<string, number>;
  }>({
    totalSales: 0,
    byPaymentMethod: {}
  });
  const [refreshing, setRefreshing] = useState(false);
  
  const loadData = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const turno = await getTurnoActivo(tenantId);
      setTurnoActivo(turno);
      
      if (turno) {
        console.log("Turno activo encontrado:", turno.id);
        
        const salesByMethod = await getTurnoSalesByPaymentMethod(turno.id);
        console.log("Ventas por método de pago:", salesByMethod);
        
        setVentas(salesByMethod);
      } else {
        console.log("No se encontró un turno activo");
        toast.warning("No hay un turno activo. Abre un turno para registrar ventas.");
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los datos de ventas");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId]);
  
  useEffect(() => {
    if (!tenantId) return;
    
    const channel = supabase
      .channel('sales-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          console.log('Nueva venta detectada:', payload);
          toast.info("Nueva venta detectada, actualizando datos...");
          loadData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Página de Prueba</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Cajero</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando información...</p>
              ) : turnoActivo ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Cajero:</span>
                    <span className="text-lg">{turnoActivo.cajero_nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Estado:</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Turno Activo
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Inicio del turno:</span>
                    <span>
                      {new Date(turnoActivo.fecha_apertura).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">ID del turno:</span>
                    <span className="text-xs text-muted-foreground">
                      {turnoActivo.id}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  No hay un turno activo actualmente
                </p>
              )}
            </CardContent>
          </Card>
          
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
                    <p>No hay un turno activo para mostrar ventas</p>
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

export default Test;
