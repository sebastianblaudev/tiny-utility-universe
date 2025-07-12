
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getAllCashiers } from '@/utils/cashRegisterUtils';
import { abrirTurno, getTurnoActivo } from '@/utils/turnosUtils';
import { Play } from 'lucide-react';

const turnoSchema = z.object({
  cajeroNombre: z.string().min(1, "El nombre del cajero es requerido"),
  cajeroId: z.string().optional(),
  montoInicial: z.coerce.number().min(0, "El monto inicial debe ser mayor o igual a cero")
});

type TurnoFormProps = {
  onSuccess?: () => void;
};

const TurnoForm = ({ onSuccess }: TurnoFormProps) => {
  const { tenantId } = useAuth();
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [turnoActivo, setTurnoActivo] = useState<any>(null);
  
  const form = useForm<z.infer<typeof turnoSchema>>({
    resolver: zodResolver(turnoSchema),
    defaultValues: {
      cajeroNombre: '',
      montoInicial: 0,
    },
  });
  
  // Cargar cajeros y verificar turno activo
  useEffect(() => {
    if (tenantId) {
      loadCashiers();
      checkActiveTurno();
    }
  }, [tenantId]);
  
  const loadCashiers = async () => {
    try {
      const cashiersList = await getAllCashiers(tenantId || '');
      setCashiers(cashiersList || []);
    } catch (error) {
      console.error("Error cargando cajeros:", error);
    }
  };
  
  const checkActiveTurno = async () => {
    if (!tenantId) return;
    
    try {
      const turno = await getTurnoActivo(tenantId);
      setTurnoActivo(turno);
    } catch (error) {
      console.error("Error verificando turno activo:", error);
    }
  };
  
  const onSelectCashier = (id: string) => {
    const selectedCashier = cashiers.find(c => c.id === id);
    if (selectedCashier) {
      form.setValue('cajeroNombre', selectedCashier.name);
      form.setValue('cajeroId', selectedCashier.id);
    }
  };
  
  const onSubmit = async (values: z.infer<typeof turnoSchema>) => {
    if (!tenantId) {
      toast.error("No se pudo identificar el inquilino");
      return;
    }
    
    setLoading(true);
    try {
      const result = await abrirTurno(
        values.cajeroNombre,
        values.montoInicial,
        tenantId,
        values.cajeroId
      );
      
      if (result) {
        toast.success("Turno abierto correctamente");
        form.reset();
        if (onSuccess) onSuccess();
        await checkActiveTurno();
      } else {
        toast.error("No se pudo abrir el turno");
      }
    } catch (error) {
      console.error("Error al abrir turno:", error);
      toast.error("Error al abrir turno");
    } finally {
      setLoading(false);
    }
  };
  
  if (turnoActivo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turno Activo</CardTitle>
          <CardDescription>
            Ya hay un turno abierto por {turnoActivo.cajero_nombre}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Fecha de apertura:</span>
              <span className="font-medium">
                {new Date(turnoActivo.fecha_apertura).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Monto inicial:</span>
              <span className="font-medium">${turnoActivo.monto_inicial}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/turnos'}>
            Ver detalles del turno
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar nuevo turno</CardTitle>
        <CardDescription>
          Complete la información para iniciar un nuevo turno de cajero
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {cashiers.length > 0 && (
              <div className="mb-4">
                <FormLabel>Seleccionar cajero registrado</FormLabel>
                <Select onValueChange={onSelectCashier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cajero" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashiers.map((cashier) => (
                      <SelectItem key={cashier.id} value={cashier.id}>
                        {cashier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="cajeroNombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del cajero</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="montoInicial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto inicial</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              {loading ? "Abriendo turno..." : "Iniciar turno"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TurnoForm;
