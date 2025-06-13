
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SystemCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

const SystemReadinessCheck = () => {
  const { user: supabaseUser, session } = useSupabaseAuth();
  const { currentUser } = useAuth();
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'pass' | 'fail' | 'warning'>('pass');

  const runSystemChecks = async () => {
    setIsRunning(true);
    const systemChecks: SystemCheck[] = [];

    // Check 1: Base de Datos Connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      systemChecks.push({
        name: 'Conexión a Base de Datos',
        status: error ? 'fail' : 'pass',
        message: error ? `Error: ${error.message}` : 'Conexión establecida correctamente',
        critical: true
      });
    } catch (error) {
      systemChecks.push({
        name: 'Conexión a Base de Datos',
        status: 'fail',
        message: 'No se pudo conectar a Base de Datos',
        critical: true
      });
    }

    // Check 2: Authentication System
    systemChecks.push({
      name: 'Sistema de Autenticación',
      status: supabaseUser && session ? 'pass' : 'fail',
      message: supabaseUser && session ? 'Usuario autenticado correctamente' : 'Usuario no autenticado',
      critical: true
    });

    // Check 3: User Profile Setup
    if (supabaseUser) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        systemChecks.push({
          name: 'Perfil de Usuario',
          status: profile && profile.pin && profile.name ? 'pass' : 'warning',
          message: profile && profile.pin && profile.name 
            ? 'Perfil configurado completamente' 
            : 'Perfil incompleto - falta PIN o nombre',
          critical: false
        });
      } catch (error) {
        systemChecks.push({
          name: 'Perfil de Usuario',
          status: 'fail',
          message: 'Error al cargar perfil de usuario',
          critical: false
        });
      }
    }

    // Check 4: Local Storage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      systemChecks.push({
        name: 'Almacenamiento Local',
        status: 'pass',
        message: 'Almacenamiento local disponible',
        critical: true
      });
    } catch (error) {
      systemChecks.push({
        name: 'Almacenamiento Local',
        status: 'fail',
        message: 'Almacenamiento local no disponible',
        critical: true
      });
    }

    // Check 5: Network Connectivity
    systemChecks.push({
      name: 'Conectividad de Red',
      status: navigator.onLine ? 'pass' : 'warning',
      message: navigator.onLine ? 'Conectado a internet' : 'Sin conexión a internet (modo offline)',
      critical: false
    });

    // Check 6: Required Tables - using literal table names
    try {
      const { error: profilesError } = await supabase.from('profiles').select('id').limit(1);
      systemChecks.push({
        name: 'Tabla: profiles',
        status: profilesError ? 'fail' : 'pass',
        message: profilesError ? 'Error en tabla profiles' : 'Tabla profiles disponible',
        critical: true
      });
    } catch (error) {
      systemChecks.push({
        name: 'Tabla: profiles',
        status: 'fail',
        message: 'Tabla profiles no encontrada',
        critical: true
      });
    }

    // Check 7: Application Data
    const userData = localStorage.getItem('barberpos_users');
    systemChecks.push({
      name: 'Datos de Aplicación',
      status: userData ? 'pass' : 'warning',
      message: userData ? 'Datos locales encontrados' : 'No hay datos locales (primera ejecución)',
      critical: false
    });

    setChecks(systemChecks);

    // Determine overall status
    const hasFailures = systemChecks.some(check => check.status === 'fail' && check.critical);
    const hasWarnings = systemChecks.some(check => check.status === 'warning' || check.status === 'fail');
    
    if (hasFailures) {
      setOverallStatus('fail');
    } else if (hasWarnings) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('pass');
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runSystemChecks();
  }, [supabaseUser, session]);

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary'
    } as const;

    const labels = {
      pass: 'Correcto',
      fail: 'Error',
      warning: 'Advertencia'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getOverallMessage = () => {
    switch (overallStatus) {
      case 'pass':
        return 'El sistema está listo para distribución';
      case 'fail':
        return 'El sistema tiene errores críticos que deben resolverse';
      case 'warning':
        return 'El sistema funciona pero tiene advertencias';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            Estado del Sistema
          </CardTitle>
          <Button 
            onClick={runSystemChecks} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Verificar
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(overallStatus)}
          <span className="text-sm text-gray-600">{getOverallMessage()}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <div className="font-medium">{check.name}</div>
                  <div className="text-sm text-gray-600">{check.message}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {check.critical && (
                  <Badge variant="outline" className="text-xs">
                    Crítico
                  </Badge>
                )}
                {getStatusBadge(check.status)}
              </div>
            </div>
          ))}
        </div>

        {overallStatus === 'fail' && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">Acciones Requeridas:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {checks
                .filter(check => check.status === 'fail' && check.critical)
                .map((check, index) => (
                  <li key={index}>• {check.name}: {check.message}</li>
                ))}
            </ul>
          </div>
        )}

        {overallStatus === 'pass' && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">✅ Sistema Listo</h3>
            <p className="text-sm text-green-700">
              Todos los componentes críticos están funcionando correctamente. 
              El sistema está listo para distribución.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemReadinessCheck;
