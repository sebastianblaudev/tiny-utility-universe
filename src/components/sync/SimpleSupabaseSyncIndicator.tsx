
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Database, WifiOff } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useBarber } from '@/contexts/BarberContext';

export const SimpleSupabaseSyncIndicator = () => {
  const { user } = useSupabaseAuth();
  const { loading, isDataLoaded } = useBarber();
  const isOnline = navigator.onLine;

  if (!user) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Sin autenticar
      </Badge>
    );
  }

  if (loading) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full" />
        Cargando datos
      </Badge>
    );
  }

  if (!isOnline) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <WifiOff className="h-3 w-3" />
        Sin conexión
      </Badge>
    );
  }

  if (isDataLoaded) {
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-600">
        <CheckCircle className="h-3 w-3" />
        Base de Datos conectado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Database className="h-3 w-3" />
      Inicializando
    </Badge>
  );
};
