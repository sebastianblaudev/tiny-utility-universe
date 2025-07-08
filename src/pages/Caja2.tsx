import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/ui/page-title';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getActiveCashRegister,
  closeCashRegister,
  getCashRegisterTransactions,
  addCashRegisterTransaction,
  calculateCashRegisterBalance
} from '@/utils/cashRegisterUtils';
import { formatCurrency, formatDate } from '@/lib/utils';

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

const Caja2 = () => {
  const { tenantId } = useAuth();
  const [cajaActiva, setCajaActiva] = useState<any>(null);
  const [transacciones, setTransacciones] = useState<CashRegisterEntry[]>([]);
  const [tipoTransaccion, setTipoTransaccion] = useState('ingreso');
  const [montoTransaccion, setMontoTransaccion] = useState('');
  const [metodoPagoTransaccion, setMetodoPagoTransaccion] = useState('efectivo');
  const [descripcionTransaccion, setDescripcionTransaccion] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCajaActiva();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const loadCajaActiva = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const caja = await getActiveCashRegister(tenantId);
      setCajaActiva(caja);
      if (caja) {
        await loadTransacciones();
      }
    } catch (error) {
      console.error('Error cargando caja activa:', error);
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
      console.error('Error cargando transacciones:', error);
      toast.error('Error al cargar las transacciones');
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
          title="Caja Registradora"
          description="Gestiona las transacciones de tu caja"
        />

        {loading && <p>Cargando...</p>}

        {!cajaActiva ? (
          <Card>
            <CardHeader>
              <CardTitle>Caja Cerrada</CardTitle>
            </CardHeader>
            <CardContent>
              <p>No hay una caja activa. Por favor, abre una caja para comenzar.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Caja Activa</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Caja activa desde: {formatDate(cajaActiva.fecha_apertura)}</p>
                <p>Cajero: {cajaActiva.nombre_cajero}</p>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCerrarCaja} disabled={loading}>
                  {loading ? 'Cerrando...' : 'Cerrar Caja'}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agregar Transacción</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAgregarTransaccion} className="space-y-4">
                  <div>
                    <Label htmlFor="tipoTransaccion">Tipo de Transacción</Label>
                    <Select value={tipoTransaccion} onValueChange={setTipoTransaccion}>
                      <SelectTrigger id="tipoTransaccion">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingreso">Ingreso</SelectItem>
                        <SelectItem value="egreso">Egreso</SelectItem>
                        <SelectItem value="venta">Venta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="montoTransaccion">Monto</Label>
                    <Input
                      type="number"
                      id="montoTransaccion"
                      value={montoTransaccion}
                      onChange={(e) => setMontoTransaccion(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="metodoPagoTransaccion">Método de Pago</Label>
                    <Select value={metodoPagoTransaccion} onValueChange={setMetodoPagoTransaccion}>
                      <SelectTrigger id="metodoPagoTransaccion">
                        <SelectValue placeholder="Selecciona un método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="descripcionTransaccion">Descripción</Label>
                    <Input
                      type="text"
                      id="descripcionTransaccion"
                      value={descripcionTransaccion}
                      onChange={(e) => setDescripcionTransaccion(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Agregando...' : 'Agregar Transacción'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transacciones</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método de Pago</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacciones.map((transaccion) => (
                      <TableRow key={transaccion.id}>
                        <TableCell>{formatDate(transaccion.fecha)}</TableCell>
                        <TableCell>{transaccion.tipo}</TableCell>
                        <TableCell>{formatCurrency(transaccion.monto)}</TableCell>
                        <TableCell>{transaccion.metodo_pago}</TableCell>
                        <TableCell>{transaccion.descripcion}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Caja2;
