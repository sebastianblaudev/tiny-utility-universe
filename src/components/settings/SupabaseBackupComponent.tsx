import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBarber } from "@/contexts/BarberContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { SupabaseBackupService } from "@/services/SupabaseBackupService";
import { useFinalMasterSync } from "@/hooks/useFinalMasterSync";
import { Cloud, CloudDownload, CheckCircle, AlertCircle, Info, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SupabaseBackupComponent = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const barberContext = useBarber();
  const { syncStatus, lastSyncTime, manualPush, isReady, canSync } = useFinalMasterSync();
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [backupExists, setBackupExists] = useState(false);
  const [checkingBackup, setCheckingBackup] = useState(false);
  const [backupInfo, setBackupInfo] = useState<{ fileName: string; lastModified: string } | null>(null);

  const backupService = new SupabaseBackupService();

  // Check if backup exists on component mount
  useEffect(() => {
    if (user) {
      checkBackupStatus();
    }
  }, [user]);

  const checkBackupStatus = async () => {
    setCheckingBackup(true);
    try {
      const exists = await backupService.checkBackupExists();
      setBackupExists(exists);
      
      if (exists) {
        const info = await backupService.getBackupInfo();
        setBackupInfo(info);
      }
    } catch (error) {
      console.error('Error checking backup status:', error);
    } finally {
      setCheckingBackup(false);
    }
  };

  const handleManualBackup = async () => {
    try {
      const success = await manualPush();
      if (success) {
        toast({
          title: "Respaldo manual completado",
          description: "Los datos se han respaldado exitosamente en Supabase Storage",
        });
        await checkBackupStatus();
      } else {
        toast({
          title: "Error",
          description: "No se pudo completar el respaldo manual",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in manual backup:', error);
      toast({
        title: "Error",
        description: "Error al crear el respaldo manual",
        variant: "destructive"
      });
    }
  };

  const handleRestoreFromSupabase = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debe estar autenticado para restaurar desde Supabase",
        variant: "destructive"
      });
      return;
    }

    setRestoreInProgress(true);
    try {
      const backupData = await backupService.restoreFromSupabase();
      
      // Clear existing data and restore from backup
      barberContext.categories.forEach(c => barberContext.deleteCategory(c.id));
      barberContext.barbers.forEach(b => barberContext.deleteBarber(b.id));
      barberContext.services.forEach(s => barberContext.deleteService(s.id));
      barberContext.products.forEach(p => barberContext.deleteProduct(p.id));
      
      // Restore app settings
      if (backupData.appSettings) {
        await barberContext.updateAppSettings(backupData.appSettings);
      }

      // Restore data
      if (backupData.categories) backupData.categories.forEach((category: any) => barberContext.addCategory(category));
      if (backupData.barbers) backupData.barbers.forEach((barber: any) => barberContext.addBarber(barber));
      if (backupData.services) backupData.services.forEach((service: any) => barberContext.addService(service));
      if (backupData.products) backupData.products.forEach((product: any) => barberContext.addProduct(product));
      if (backupData.sales) backupData.sales.forEach((sale: any) => {
        if (!barberContext.sales.some(s => s.id === sale.id)) {
          barberContext.addSale(sale);
        }
      });
      if (backupData.cashAdvances) backupData.cashAdvances.forEach((advance: any) => {
        if (!barberContext.cashAdvances.some(a => a.id === advance.id)) {
          barberContext.addCashAdvance(advance);
        }
      });
      if (backupData.promotions) backupData.promotions.forEach((promotion: any) => {
        if (!barberContext.promotions.some(p => p.id === promotion.id)) {
          barberContext.addPromotion(promotion);
        }
      });

      toast({
        title: "Restauración completada",
        description: "Los datos se han restaurado exitosamente desde Supabase Storage",
      });
    } catch (error) {
      console.error('Error restoring from Supabase:', error);
      toast({
        title: "Error",
        description: "No se pudieron restaurar los datos desde Supabase. Verifique que existe un respaldo.",
        variant: "destructive"
      });
    } finally {
      setRestoreInProgress(false);
    }
  };

  const getSyncStatusInfo = () => {
    switch (syncStatus) {
      case 'pushing':
        return { text: 'Guardando...', variant: 'secondary' as const, icon: RefreshCw };
      case 'pulling':
        return { text: 'Sincronizando...', variant: 'secondary' as const, icon: RefreshCw };
      case 'synced':
        return { text: 'Sincronizado', variant: 'default' as const, icon: CheckCircle };
      case 'idle':
      default:
        return { text: canSync ? 'Listo' : 'Sin conexión', variant: canSync ? 'secondary' as const : 'outline' as const, icon: Cloud };
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Respaldo Automático en Supabase Storage</CardTitle>
          <CardDescription>
            Respaldos automáticos que se activan con cada transacción del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <p>Debe iniciar sesión para acceder a los respaldos automáticos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getSyncStatusInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Respaldo Automático en Supabase Storage
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <statusInfo.icon className={`w-3 h-3 ${(syncStatus === 'pushing' || syncStatus === 'pulling') ? 'animate-spin' : ''}`} />
            {statusInfo.text}
          </Badge>
        </CardTitle>
        <CardDescription>
          Los respaldos se crean automáticamente con cada cambio y se sincronizan al iniciar sesión. Usuario: {user.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Automatic backup status */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          {isReady ? (
            <>
              <CheckCircle className="text-green-500" size={20} />
              <div className="flex-1">
                <p className="font-medium text-green-700 dark:text-green-300">
                  Respaldos automáticos activos
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Se activan automáticamente con cada transacción y sincronizan al iniciar sesión desde otros dispositivos
                </p>
                {lastSyncTime && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Último respaldo: {lastSyncTime.toLocaleString()}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="text-amber-500" size={20} />
              <div className="flex-1">
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  Inicializando sistema de respaldos...
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  El sistema se está preparando para activar los respaldos automáticos
                </p>
              </div>
            </>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          {checkingBackup ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Verificando respaldo...</span>
            </div>
          ) : backupExists ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span>Respaldo disponible en Supabase Storage</span>
              </div>
              {backupInfo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info size={14} />
                  <span>Archivo: {backupInfo.fileName}</span>
                  <span>•</span>
                  <span>Última modificación: {new Date(backupInfo.lastModified).toLocaleString()}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle size={16} />
              <span>No hay respaldo disponible</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={handleManualBackup} 
            disabled={syncStatus === 'pushing' || syncStatus === 'pulling' || !isReady}
            className="flex items-center gap-2"
          >
            <Cloud size={16} />
            {(syncStatus === 'pushing' || syncStatus === 'pulling') ? 'Sincronizando...' : 'Respaldo Manual'}
          </Button>
          
          <Button 
            onClick={handleRestoreFromSupabase} 
            disabled={restoreInProgress || !backupExists}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <CloudDownload size={16} />
            {restoreInProgress ? 'Restaurando...' : 'Restaurar desde Supabase'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <p><strong>Respaldos Automáticos:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Se activan automáticamente con cada venta realizada</li>
            <li>Se activan con cada adelanto en efectivo</li>
            <li>Se activan cuando se agregan productos, servicios o barberos</li>
            <li>Incluyen todas las configuraciones del sistema</li>
            <li>Los respaldos se almacenan de forma segura en Supabase Storage</li>
            <li>Se sincronizan automáticamente al iniciar sesión desde otros dispositivos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseBackupComponent;
