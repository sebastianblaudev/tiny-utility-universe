import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/ui/page-title';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  getActiveCashRegister, 
  openCashRegister, 
  closeCashRegister,
  getCashRegisterTransactions,
  addCashRegisterTransaction,
  calculateCashRegisterBalance
} from '@/utils/cashRegisterUtils';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';

interface CashRegisterEntry {
  id: string;
  fecha: string;
  hora: string;
  tipo: 'ingreso' | 'egreso' | 'venta';
  monto: number;
  metodo_pago: string;
  descripcion?: string;
  caja_id: string;
  tenant_id: string;
}

const Caja = () => {
  const { tenantId } = useAuth();
  const [cajaActiva, setCajaActiva] = useState<any>(null);
  const [transacciones, setTransacciones] = useState<CashRegisterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [montoInicial, setMontoInicial] = useState('');
  const [tipoTransaccion, setTipoTransaccion] = useState('ingreso');
  const [montoTransaccion, setMontoTransaccion] = useState('');
  const [metodoPagoTransaccion, setMetodoPagoTransaccion] = useState('efectivo');
  const [descripcionTransaccion, setDescripcionTransaccion] = useState('');

  useEffect(() => {
    loadCajaActiva();
    loadTransacciones();
  }, [tenantId]);

  const loadCajaActiva = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const caja = await getActiveCashRegister(tenantId);
      setCajaActiva(caja);
    } catch (error) {
      console.error('Error obteniendo caja activa:', error);
      toast.error('Error al cargar la caja activa');
    } finally {
      setLoading(false);
    }
  };

  const loadTransacciones = async () => {
    if (!cajaActiva?.id) return;

    setLoading(true);
    try {
      const transacciones = await getCashRegisterTransactions(cajaActiva.id);
      setTransacciones(transacciones);
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      toast.error('Error al cargar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCaja = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const nuevaCaja = await openCashRegister(tenantId, 'Cajero', parseFloat(montoInicial));
      setCajaActiva(nuevaCaja);
      toast.success('Caja abierta exitosamente');
    } catch (error) {
      console.error('Error abriendo caja:', error);
      toast.error('Error al abrir la caja');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarCaja = async () => {
    if (!cajaActiva?.id) return;

    setLoading(true);
    try {
      const balance = await calculateCashRegisterBalance(cajaActiva.id);
      await closeCashRegister(cajaActiva.id, balance);
      await loadCajaActiva();
      toast.success('Caja cerrada exitosamente');
    } catch (error) {
      console.error('Error cerrando caja:', error);
      toast.error('Error al cerrar la caja');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarTransaccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cajaActiva?.id || !tenantId) return;

    setLoading(true);
    try {
      const now = new Date();
      const transactionData = {
        caja_id: cajaActiva.id,
        tipo: tipoTransaccion as 'ingreso' | 'egreso' | 'venta',
        monto: parseFloat(montoTransaccion),
        metodo_pago: metodoPagoTransaccion,
        descripcion: descripcionTransaccion,
        fecha: now.toISOString(),
        hora: now.toTimeString().slice(0, 8)
      };

      await addCashRegisterTransaction(transactionData);
      await loadTransacciones();
      await loadCajaActiva();
      
      // Clear form
      setTipoTransaccion('ingreso');
      setMontoTransaccion('');
      setMetodoPagoTransaccion('efectivo');
      setDescripcionTransaccion('');
      
      toast.success('Transacción agregada exitosamente');
    } catch (error) {
      console.error('Error agregando transacción:', error);
      toast.error('Error al agregar la transacción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <PageTitle
          title="Caja"
          description="Gestiona las transacciones de tu caja"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {cajaActiva ? 'Cerrar Caja' : 'Abrir Caja'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cajaActiva ? (
                <>
                  <p>Caja activa desde: {new Date(cajaActiva.fecha_apertura).toLocaleString()}</p>
                  <Button onClick={handleCerrarCaja} disabled={loading}>
                    {loading ? 'Cerrando...' : 'Cerrar Caja'}
                  </Button>
                </>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleAbrirCaja();
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="montoInicial">Monto Inicial</Label>
                      <Input
                        id="montoInicial"
                        type="number"
                        value={montoInicial}
                        onChange={(e) => setMontoInicial(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Abriendo...' : 'Abrir Caja'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
            {cajaActiva && (
              <CardFooter>
                <p>Balance actual: {formatCurrency(cajaActiva.monto_final)}</p>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agregar Transacción</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAgregarTransaccion}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tipoTransaccion">Tipo de Transacción</Label>
                    <select
                      id="tipoTransaccion"
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                      value={tipoTransaccion}
                      onChange={(e) => setTipoTransaccion(e.target.value)}
                    >
                      <option value="ingreso">Ingreso</option>
                      <option value="egreso">Egreso</option>
                      <option value="venta">Venta</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="montoTransaccion">Monto</Label>
                    <Input
                      id="montoTransaccion"
                      type="number"
                      value={montoTransaccion}
                      onChange={(e) => setMontoTransaccion(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="metodoPagoTransaccion">Método de Pago</Label>
                    <select
                      id="metodoPagoTransaccion"
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                      value={metodoPagoTransaccion}
                      onChange={(e) => setMetodoPagoTransaccion(e.target.value)}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="descripcionTransaccion">Descripción</Label>
                    <Input
                      id="descripcionTransaccion"
                      type="text"
                      value={descripcionTransaccion}
                      onChange={(e) => setDescripcionTransaccion(e.target.value)}
                      placeholder="Descripción de la transacción"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Agregando...' : 'Agregar Transacción'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Cargando transacciones...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método de Pago
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-800">
                    {transacciones.map((transaccion) => (
                      <tr key={transaccion.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(transaccion.fecha).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaccion.tipo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatCurrency(transaccion.monto)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaccion.metodo_pago}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaccion.descripcion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Caja;
