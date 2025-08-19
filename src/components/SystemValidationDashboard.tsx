import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Shield, 
  Calculator,
  CreditCard,
  Package,
  Weight,
  Banknote,
  Database,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { systemValidator, SystemIntegrityReport, ValidationResult } from '@/utils/systemIntegrityValidator';

const SystemValidationDashboard: React.FC = () => {
  const [report, setReport] = useState<SystemIntegrityReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  const runFullValidation = async () => {
    setIsValidating(true);
    try {
      const validationReport = await systemValidator.validateSystemIntegrity();
      setReport(validationReport);
      setLastValidation(new Date());
      
      if (validationReport.isValid) {
        toast.success('Validación completa: Sistema operando correctamente');
      } else {
        toast.warning(`Validación completa: ${validationReport.criticalIssues.length} problemas críticos encontrados`);
      }
    } catch (error) {
      console.error('Error running validation:', error);
      toast.error('Error al ejecutar validación del sistema');
    } finally {
      setIsValidating(false);
    }
  };

  const runQuickCheck = async () => {
    try {
      const result = await systemValidator.quickValidation();
      if (result.isHealthy) {
        toast.success('Verificación rápida: Sistema saludable');
      } else {
        toast.warning(`Verificación rápida: ${result.criticalIssues} problemas críticos`);
      }
    } catch (error) {
      toast.error('Error en verificación rápida');
    }
  };

  const getValidationIcon = (validation: ValidationResult) => {
    if (validation.passed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (validation.issues.some(issue => issue.includes('CRÍTICO'))) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getValidationStatus = (validation: ValidationResult) => {
    if (validation.passed) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Correcto</Badge>;
    } else if (validation.issues.some(issue => issue.includes('CRÍTICO'))) {
      return <Badge variant="destructive">Crítico</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Advertencias</Badge>;
    }
  };

  const validationSections = [
    {
      key: 'salesCalculations',
      title: 'Cálculos de Ventas',
      icon: Calculator,
      description: 'Verifica que los totales de ventas coincidan con la suma de items'
    },
    {
      key: 'paymentMethods',
      title: 'Métodos de Pago',
      icon: CreditCard,
      description: 'Valida la consistencia de métodos de pago registrados'
    },
    {
      key: 'stockManagement',
      title: 'Gestión de Stock',
      icon: Package,
      description: 'Revisa stock negativo y productos sin stock definido'
    },
    {
      key: 'weightProducts',
      title: 'Productos por Peso',
      icon: Weight,
      description: 'Valida configuración de productos vendidos por peso'
    },
    {
      key: 'mixedPayments',
      title: 'Pagos Mixtos',
      icon: CreditCard,
      description: 'Verifica que los pagos mixtos sumen correctamente'
    },
    {
      key: 'cashHandling',
      title: 'Manejo de Efectivo',
      icon: Banknote,
      description: 'Valida turnos y transacciones de efectivo'
    },
    {
      key: 'dataConsistency',
      title: 'Consistencia de Datos',
      icon: Database,
      description: 'Verifica integridad referencial y datos huérfanos'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Validación del Sistema</h2>
          <p className="text-muted-foreground">
            Verifica la integridad de todas las operaciones del POS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runQuickCheck}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Verificación Rápida
          </Button>
          <Button
            onClick={runFullValidation}
            disabled={isValidating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Validando...' : 'Validar Sistema'}
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Estado General del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {report.isValid ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                <span className="text-lg font-semibold">
                  {report.isValid ? 'Sistema Operando Correctamente' : 'Problemas Detectados'}
                </span>
              </div>
              {lastValidation && (
                <span className="text-sm text-muted-foreground">
                  Última validación: {lastValidation.toLocaleString()}
                </span>
              )}
            </div>

            {report.criticalIssues.length > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Problemas Críticos Encontrados:</strong>
                  <ul className="list-disc ml-4 mt-2">
                    {report.criticalIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {report.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recomendaciones:</h4>
                <ul className="space-y-1">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Validation Results */}
      {report && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {validationSections.map((section) => {
            const validation = report.validations[section.key as keyof typeof report.validations];
            const IconComponent = section.icon;
            
            return (
              <Card key={section.key}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {section.title}
                    </div>
                    {getValidationIcon(validation)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Estado:</span>
                      {getValidationStatus(validation)}
                    </div>

                    {validation.details && (
                      <div className="text-xs text-muted-foreground">
                        <Separator className="my-2" />
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(validation.details).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="font-mono">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {validation.issues.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-red-600">Problemas:</span>
                        <ul className="space-y-1">
                          {validation.issues.slice(0, 3).map((issue, index) => (
                            <li key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              {issue}
                            </li>
                          ))}
                          {validation.issues.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{validation.issues.length - 3} problemas más...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {validation.warnings.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-yellow-600">Advertencias:</span>
                        <ul className="space-y-1">
                          {validation.warnings.slice(0, 2).map((warning, index) => (
                            <li key={index} className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                              {warning}
                            </li>
                          ))}
                          {validation.warnings.length > 2 && (
                            <li className="text-xs text-muted-foreground">
                              +{validation.warnings.length - 2} advertencias más...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!report && (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sistema Listo para Validación</h3>
            <p className="text-muted-foreground mb-4">
              Ejecute una validación completa para verificar la integridad de todas las operaciones del sistema.
            </p>
            <Button onClick={runFullValidation} disabled={isValidating}>
              {isValidating ? 'Validando...' : 'Iniciar Validación'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemValidationDashboard;