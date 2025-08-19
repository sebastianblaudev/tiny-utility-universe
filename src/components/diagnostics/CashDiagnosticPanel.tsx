import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';
import { runCashDiagnostic, CashDiagnosticReport, CashIssue } from '@/utils/cashReconciliationDiagnostic';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const CashDiagnosticPanel: React.FC = () => {
  const [report, setReport] = useState<CashDiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const fromDate = new Date(dateRange.from).toISOString();
      const toDate = new Date(dateRange.to + 'T23:59:59').toISOString();
      
      const diagnosticReport = await runCashDiagnostic(fromDate, toDate);
      setReport(diagnosticReport);
      
      const criticalIssues = diagnosticReport.issues.filter(i => i.severity === 'CRITICAL').length;
      const highIssues = diagnosticReport.issues.filter(i => i.severity === 'HIGH').length;
      
      if (criticalIssues > 0) {
        toast.error(`Se encontraron ${criticalIssues} problemas críticos en el efectivo`);
      } else if (highIssues > 0) {
        toast.warning(`Se encontraron ${highIssues} problemas importantes en el efectivo`);
      } else {
        toast.success('No se encontraron problemas críticos en el efectivo');
      }
    } catch (error) {
      console.error('Error running diagnostic:', error);
      toast.error('Error ejecutando diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DUPLICATE': return <AlertTriangle className="h-4 w-4" />;
      case 'RECONCILIATION': return <DollarSign className="h-4 w-4" />;
      case 'CALCULATION': return <TrendingUp className="h-4 w-4" />;
      case 'DATA_INTEGRITY': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Diagnóstico de Efectivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Fecha Desde</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Fecha Hasta</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <Button 
              onClick={runDiagnostic} 
              disabled={loading}
              className="px-6"
            >
              {loading ? 'Analizando...' : 'Ejecutar Diagnóstico'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Efectivo</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.summary.totalCashSales)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Posibles Duplicados</p>
                    <p className="text-2xl font-bold text-red-600">{report.summary.possibleDuplicates}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Efectivo Directo</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.summary.directCashSales)}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Efectivo Mixto</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.summary.mixedCashSales)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Problemas Detectados ({report.issues.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {report.issues.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ No se detectaron problemas en el sistema de efectivo
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {report.issues.map((issue, index) => (
                      <Card key={index} className="border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getTypeIcon(issue.type)}
                                <Badge variant={getSeverityColor(issue.severity) as any}>
                                  {issue.severity}
                                </Badge>
                                <Badge variant="outline">{issue.type}</Badge>
                              </div>
                              <p className="font-medium text-sm mb-1">{issue.description}</p>
                              {issue.suggestedFix && (
                                <p className="text-xs text-muted-foreground">
                                  💡 {issue.suggestedFix}
                                </p>
                              )}
                              {issue.details && (
                                <details className="mt-2">
                                  <summary className="text-xs cursor-pointer">Ver detalles</summary>
                                  <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                                    {JSON.stringify(issue.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Recomendaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Ejecutado:</strong> {new Date(report.timestamp).toLocaleString()}
                </div>
                <div>
                  <strong>Tenant ID:</strong> {report.tenantId.substring(0, 8)}...
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CashDiagnosticPanel;