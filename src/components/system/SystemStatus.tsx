
import React from 'react';
import { CheckCircle, AlertCircle, Wifi, WifiOff, Database, HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOptimizedMasterSync } from '@/hooks/useOptimizedMasterSync';
import { useBarber } from '@/contexts/BarberContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const SystemStatus = () => {
  const { user } = useSupabaseAuth();
  const { syncStatus, isReady, canSync } = useOptimizedMasterSync();
  const barberContext = useBarber();
  const financialContext = useFinancial();

  const isOnline = navigator.onLine;
  
  const getDataStats = () => {
    return {
      barbers: barberContext.barbers.length,
      services: barberContext.services.length,
      products: barberContext.products.length,
      sales: barberContext.sales.length,
      advances: barberContext.cashAdvances.length,
      commissions: financialContext.barberCommissions.length,
      expenses: financialContext.operationalExpenses.length
    };
  };

  const stats = getDataStats();
  const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);

  const getSystemStatusColor = () => {
    if (!isOnline) return 'destructive';
    if (!isReady) return 'secondary';
    if (syncStatus === 'error') return 'destructive';
    if (syncStatus === 'synced') return 'default';
    return 'secondary';
  };

  const getSystemStatusText = () => {
    if (!isOnline) return 'Sin conexión';
    if (!isReady) return 'Inicializando';
    if (syncStatus === 'error') return 'Error de sync';
    if (syncStatus === 'synced') return 'Todo funcionando';
    return 'Sincronizando';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Estado del Sistema
        </CardTitle>
        <CardDescription>
          Información general del funcionamiento de la aplicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado general */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado general:</span>
          <Badge variant={getSystemStatusColor()} className="flex items-center gap-1">
            {getSystemStatusColor() === 'default' ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {getSystemStatusText()}
          </Badge>
        </div>

        {/* Conectividad */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Conectividad:</span>
          <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Conectado' : 'Sin conexión'}
          </Badge>
        </div>

        {/* Usuario autenticado */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Usuario:</span>
          <Badge variant={user ? 'default' : 'outline'}>
            {user ? user.email : 'No autenticado'}
          </Badge>
        </div>

        {/* Sincronización */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Sincronización:</span>
          <Badge variant={canSync ? 'default' : 'outline'}>
            {canSync ? 'Habilitada' : 'Deshabilitada'}
          </Badge>
        </div>

        {/* Datos locales */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            <span className="text-sm font-medium">Datos locales: {totalRecords} registros</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Barberos: {stats.barbers}</div>
            <div>Servicios: {stats.services}</div>
            <div>Productos: {stats.products}</div>
            <div>Ventas: {stats.sales}</div>
            <div>Adelantos: {stats.advances}</div>
            <div>Comisiones: {stats.commissions}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
