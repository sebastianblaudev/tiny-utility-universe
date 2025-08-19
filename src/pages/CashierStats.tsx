
import React from 'react';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/ui/page-title';
import CashierSalesStats from '@/components/cashier/CashierSalesStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CashierStats = () => {
  const navigate = useNavigate();
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <PageTitle 
            title="Estadísticas del Cajero" 
            description="Seguimiento de ventas para el turno actual" 
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Main stats card */}
            <CashierSalesStats autoRefresh={true} />
          </div>
          
          <div>
            {/* Info card */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
                <CardDescription>Sobre las estadísticas de ventas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Datos en tiempo real</AlertTitle>
                  <AlertDescription>
                    Estas estadísticas se calculan en base a las ventas realizadas 
                    desde que el cajero inició su turno.
                  </AlertDescription>
                </Alert>
                
                <p className="text-sm text-muted-foreground">
                  Los datos se actualizan automáticamente cada minuto, 
                  o puedes actualizar manualmente usando el botón.
                </p>
                
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/turnos')}
                  >
                    Ir a Gestión de Turnos
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/caja')}
                  >
                    Ir a Caja
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CashierStats;
