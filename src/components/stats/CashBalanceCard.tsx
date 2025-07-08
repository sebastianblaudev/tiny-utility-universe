
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormat';
import { getTurnos, getTurnoTransacciones } from '@/utils/turnosUtils';
import { useAuth } from '@/contexts/AuthContext';

interface CashBalanceData {
  totalCashInRegister: number;
  activeTurnos: number;
  lastMovements: Array<{
    type: string;
    amount: number;
    date: string;
    description: string;
  }>;
}

const CashBalanceCard: React.FC = () => {
  const [cashBalance, setCashBalance] = useState<CashBalanceData>({
    totalCashInRegister: 0,
    activeTurnos: 0,
    lastMovements: []
  });
  const [loading, setLoading] = useState(true);
  const { tenantId } = useAuth();

  useEffect(() => {
    const calculateCashBalance = async () => {
      if (!tenantId) return;
      
      setLoading(true);
      try {
        // Obtener todos los turnos
        const turnos = await getTurnos(tenantId);
        
        let totalCash = 0;
        let activeTurnosCount = 0;
        const movements: Array<{
          type: string;
          amount: number;
          date: string;
          description: string;
        }> = [];

        // Procesar cada turno
        for (const turno of turnos) {
          const montoInicial = Number(turno.monto_inicial) || 0;
          
          if (turno.estado === 'abierto') {
            activeTurnosCount++;
            // Para turnos abiertos, sumar el monto inicial
            totalCash += montoInicial;
            
            // Obtener transacciones del turno
            const transacciones = await getTurnoTransacciones(turno.id);
            
            // Procesar transacciones solo de efectivo
            transacciones.forEach(trans => {
              const monto = Number(trans.monto) || 0;
              
              if (trans.metodo_pago === 'efectivo' || trans.metodo_pago === 'cash') {
                if (trans.tipo === 'ingreso' || trans.tipo === 'venta') {
                  totalCash += monto;
                } else if (trans.tipo === 'egreso') {
                  totalCash -= monto;
                }
                
                // Agregar a movimientos recientes
                movements.push({
                  type: trans.tipo,
                  amount: monto,
                  date: trans.fecha,
                  description: trans.descripcion || `${trans.tipo} - ${turno.cajero_nombre}`
                });
              }
            });
          } else if (turno.estado === 'cerrado') {
            // Para turnos cerrados, el efectivo ya fue retirado
            // No suma al total actual en caja
          }
        }

        // Ordenar movimientos por fecha (más recientes primero)
        movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setCashBalance({
          totalCashInRegister: totalCash,
          activeTurnos: activeTurnosCount,
          lastMovements: movements.slice(0, 5) // Solo los últimos 5 movimientos
        });
      } catch (error) {
        console.error('Error calculating cash balance:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateCashBalance();
  }, [tenantId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          Calculando efectivo en caja...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign size={16} />
            Efectivo Actual en Caja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(cashBalance.totalCashInRegister)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {cashBalance.activeTurnos} turno(s) activo(s)
          </p>
        </CardContent>
      </Card>

      {cashBalance.lastMovements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Últimos Movimientos de Efectivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cashBalance.lastMovements.map((movement, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {movement.type === 'ingreso' || movement.type === 'venta' ? (
                      <TrendingUp size={14} className="text-green-500" />
                    ) : (
                      <TrendingDown size={14} className="text-red-500" />
                    )}
                    <span className="truncate max-w-[200px]">
                      {movement.description}
                    </span>
                  </div>
                  <span className={`font-medium ${
                    movement.type === 'ingreso' || movement.type === 'venta'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {movement.type === 'ingreso' || movement.type === 'venta' ? '+' : '-'}
                    {formatCurrency(movement.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CashBalanceCard;
