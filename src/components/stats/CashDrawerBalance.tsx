import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormat';
import { getAllTurnos, getTurnoTransacciones } from '@/utils/turnosUtils';
import { useAuth } from '@/contexts/AuthContext';

interface CashDrawerData {
  initialAmount: number;
  activeTurnos: number;
  cajeroNombre: string;
}

const CashDrawerBalance: React.FC = () => {
  const [drawerBalance, setDrawerBalance] = useState<CashDrawerData>({
    initialAmount: 0,
    activeTurnos: 0,
    cajeroNombre: ''
  });
  const [loading, setLoading] = useState(true);
  const { tenantId } = useAuth();

  useEffect(() => {
    const getInitialAmount = async () => {
      if (!tenantId) return;
      
      setLoading(true);
      try {
        // Obtener todos los turnos y filtrar por tenant
        const allTurnos = await getAllTurnos();
        const turnos = allTurnos.filter(turno => turno.tenant_id === tenantId);
        
        let initialAmount = 0;
        let activeTurnosCount = 0;
        let cajeroNombre = '';

        // Buscar turno activo
        const turnoActivo = turnos.find(turno => turno.estado === 'abierto');
        
        if (turnoActivo) {
          activeTurnosCount = 1;
          initialAmount = Number(turnoActivo.monto_inicial) || 0;
          cajeroNombre = turnoActivo.cajero_nombre || '';
        }

        setDrawerBalance({
          initialAmount,
          activeTurnos: activeTurnosCount,
          cajeroNombre
        });
      } catch (error) {
        console.error('Error getting initial amount:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialAmount();
  }, [tenantId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          Cargando información del turno...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Wallet size={16} />
          Monto Inicio de Caja
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-emerald-600">
          {formatCurrency(drawerBalance.initialAmount)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Monto con el que se inició el turno
        </p>
        {drawerBalance.activeTurnos > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Cajero: {drawerBalance.cajeroNombre}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CashDrawerBalance;