
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { abrirTurno, cerrarTurno, getTurnoActivo } from '@/utils/turnosUtils';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';

interface CajeroAbrirCerrarTurnoProps {
  onTurnoChange: () => void;
  turnoActivo: any | null;
}

const CajeroAbrirCerrarTurno = ({ onTurnoChange, turnoActivo }: CajeroAbrirCerrarTurnoProps) => {
  const { tenantId } = useAuth();
  const [cajeroNombre, setCajeroNombre] = useState('');
  const [montoInicial, setMontoInicial] = useState('0');
  const [montoFinal, setMontoFinal] = useState('0');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAbrirTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      toast.error('No se pudo identificar el tenant');
      return;
    }

    if (!cajeroNombre.trim()) {
      toast.error('Debe ingresar un nombre de cajero');
      return;
    }

    setLoading(true);
    try {
      const resultado = await abrirTurno(
        cajeroNombre, 
        parseFloat(montoInicial), 
        tenantId
      );

      if (resultado) {
        toast.success('Turno abierto exitosamente');
        setCajeroNombre('');
        setMontoInicial('0');
        onTurnoChange();
      } else {
        toast.error('Error al abrir el turno');
      }
    } catch (error) {
      console.error('Error al abrir turno:', error);
      toast.error('Ocurrió un error al abrir el turno');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoActivo?.id) {
      toast.error('No hay un turno activo para cerrar');
      return;
    }

    setLoading(true);
    try {
      const resultado = await cerrarTurno(
        turnoActivo.id,
        parseFloat(montoFinal),
        observaciones
      );

      if (resultado) {
        toast.success('Turno cerrado exitosamente');
        setMontoFinal('0');
        setObservaciones('');
        onTurnoChange();
      } else {
        toast.error('Error al cerrar el turno');
      }
    } catch (error) {
      console.error('Error al cerrar turno:', error);
      toast.error('Ocurrió un error al cerrar el turno');
    } finally {
      setLoading(false);
    }
  };

  if (turnoActivo) {
    // Mostrar formulario de cierre si hay un turno activo
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cerrar Turno</CardTitle>
          <CardDescription>
            Turno activo de {turnoActivo.cajero_nombre} - Iniciado {new Date(turnoActivo.fecha_apertura).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCerrarTurno}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="montoFinal">Monto Final</Label>
                <Input
                  id="montoFinal"
                  type="number"
                  step="0.01"
                  value={montoFinal}
                  onChange={(e) => setMontoFinal(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones sobre el cierre de turno"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={loading}
            >
              {loading ? 'Cerrando...' : 'Cerrar Turno'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-start text-sm">
          <div className="flex justify-between w-full">
            <span>Monto inicial:</span>
            <span>{formatCurrency(turnoActivo.monto_inicial)}</span>
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Mostrar formulario de apertura si no hay turno activo
  return (
    <Card>
      <CardHeader>
        <CardTitle>Abrir Turno</CardTitle>
        <CardDescription>Complete los datos para abrir un nuevo turno</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAbrirTurno}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cajeroNombre">Nombre del Cajero</Label>
              <Input
                id="cajeroNombre"
                value={cajeroNombre}
                onChange={(e) => setCajeroNombre(e.target.value)}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <Label htmlFor="montoInicial">Monto Inicial</Label>
              <Input
                id="montoInicial"
                type="number"
                step="0.01"
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full mt-4"
            disabled={loading}
          >
            {loading ? 'Abriendo...' : 'Abrir Turno'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CajeroAbrirCerrarTurno;
