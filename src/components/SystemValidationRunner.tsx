import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Play,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { runComprehensiveValidation, ComprehensiveValidationReport } from '@/utils/comprehensiveSystemValidator';

const SystemValidationRunner: React.FC = () => {
  const [report, setReport] = useState<ComprehensiveValidationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runValidation = async () => {
    setIsRunning(true);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      console.log('🚀 EJECUTANDO VALIDACIÓN INTEGRAL DEL SISTEMA...');
      const validationReport = await runComprehensiveValidation();
      
      clearInterval(progressInterval);
      setProgress(100);
      setReport(validationReport);

      // Show results
      const { overallStatus, summary } = validationReport;
      if (overallStatus === 'HEALTHY') {
        toast.success('✅ Sistema completamente validado - Sin problemas detectados', {
          description: `${summary.totalChecked} validaciones completadas, ${summary.autoFixed} correcciones automáticas`
        });
      } else if (overallStatus === 'WARNING') {
        toast.warning(`⚠️ Validación completada con advertencias`, {
          description: `${summary.warningsFound} advertencias encontradas, ${summary.autoFixed} auto-corregidas`
        });
      } else if (overallStatus === 'CRITICAL') {
        toast.error(`🚨 Problemas críticos detectados`, {
          description: `${summary.errorsFound} errores críticos requieren atención inmediata`
        });
      } else {
        toast.error('❌ Error durante la validación', {
          description: 'No se pudo completar la validación del sistema'
        });
      }

    } catch (error) {
      console.error('Error during validation:', error);
      toast.error('Error ejecutando validación del sistema');
    } finally {
      setIsRunning(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  // Auto-run validation on mount
  useEffect(() => {
    const autoRun = sessionStorage.getItem('auto-validation-run');
    if (!autoRun) {
      sessionStorage.setItem('auto-validation-run', 'true');
      setTimeout(() => runValidation(), 1000);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-green-600';
      case 'WARNING': return 'text-yellow-600';
      case 'FAIL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'FAIL': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOverallStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <Badge className="bg-green-100 text-green-800 border-green-200">✅ SISTEMA SALUDABLE</Badge>;
      case 'WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⚠️ ADVERTENCIAS</Badge>;
      case 'CRITICAL':
        return <Badge variant="destructive">🚨 CRÍTICO</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">❌ ERROR</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Validación Integral del Sistema
          </h2>
          <p className="text-muted-foreground">
            Verificación completa de ventas, pagos, stock y separación entre tenants
          </p>
        </div>
        <Button
          onClick={runValidation}
          disabled={isRunning}
          className="flex items-center gap-2"
          size="lg"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunning ? 'Validando...' : 'Ejecutar Validación'}
        </Button>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Ejecutando validaciones...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {report && (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Estado General del Sistema</span>
                {getOverallStatusBadge(report.overallStatus)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{report.summary.totalChecked}</div>
                  <div className="text-sm text-muted-foreground">Validaciones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{report.summary.errorsFound}</div>
                  <div className="text-sm text-muted-foreground">Errores Críticos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{report.summary.warningsFound}</div>
                  <div className="text-sm text-muted-foreground">Advertencias</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{report.summary.autoFixed}</div>
                  <div className="text-sm text-muted-foreground">Auto-corregidos</div>
                </div>
              </div>

              {report.criticalIssues.length > 0 && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Problemas Críticos Detectados:</strong>
                    <ul className="list-disc ml-4 mt-2 space-y-1">
                      {report.criticalIssues.slice(0, 5).map((issue, index) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                      {report.criticalIssues.length > 5 && (
                        <li className="text-sm text-muted-foreground">
                          +{report.criticalIssues.length - 5} problemas más...
                        </li>
                      )}
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

          {/* Detailed Results */}
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(report.validations).map(([key, validation]) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    {getStatusIcon(validation.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estado:</span>
                      <span className={`text-sm font-medium ${getStatusColor(validation.status)}`}>
                        {validation.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {validation.message}
                    </p>

                    {validation.issuesFound.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-red-600">
                          Problemas ({validation.issuesFound.length}):
                        </span>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {validation.issuesFound.slice(0, 3).map((issue, index) => (
                            <div key={index} className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-200">
                              {issue}
                            </div>
                          ))}
                          {validation.issuesFound.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center py-1">
                              +{validation.issuesFound.length - 3} problemas más...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {validation.autoFixed.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-green-600">
                          Auto-corregidos ({validation.autoFixed.length}):
                        </span>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {validation.autoFixed.slice(0, 2).map((fixed, index) => (
                            <div key={index} className="text-xs bg-green-50 p-2 rounded border-l-2 border-green-200">
                              {fixed}
                            </div>
                          ))}
                          {validation.autoFixed.length > 2 && (
                            <div className="text-xs text-muted-foreground text-center py-1">
                              +{validation.autoFixed.length - 2} correcciones más...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Metadata */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Tenant ID: {report.tenantId}</span>
                <span>Validación ejecutada: {new Date(report.timestamp).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Initial State */}
      {!report && !isRunning && (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Validación del Sistema POS</h3>
            <p className="text-muted-foreground mb-6">
              Ejecute una validación completa para verificar:<br/>
              • Cálculos de ventas y totales por método de pago<br/>
              • Pagos mixtos y manejo de efectivo<br/>
              • Stock de productos normales y por peso<br/>
              • Separación correcta entre tenants<br/>
              • Integridad general de datos
            </p>
            <Button onClick={runValidation} size="lg" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Iniciar Validación Integral
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemValidationRunner;