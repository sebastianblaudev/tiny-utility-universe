
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAutoBackup } from "@/hooks/useAutoBackup";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Globe, TestTube, CheckCircle, AlertCircle, User } from "lucide-react";

const AutoWebhookBackupComponent = () => {
  const { toast } = useToast();
  const { createBackup, isEnabled, userEmail, webhookUrl } = useAutoBackup();
  const { user } = useSupabaseAuth();

  const handleTest = async () => {
    if (!isEnabled) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión con Supabase para usar los respaldos automáticos",
        variant: "destructive"
      });
      return;
    }

    try {
      await createBackup();
      toast({
        title: "Prueba exitosa",
        description: "El respaldo de prueba se envió correctamente",
      });
    } catch (error) {
      toast({
        title: "Error en la prueba",
        description: "No se pudo enviar el respaldo de prueba",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe size={20} />
          Respaldos Automáticos via Webhook
        </CardTitle>
        <CardDescription>
          Sistema de respaldos automáticos integrado que funciona automáticamente con tu cuenta de Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado del sistema */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          {isEnabled ? (
            <>
              <CheckCircle className="text-green-500" size={20} />
              <div className="flex-1">
                <p className="font-medium text-green-700 dark:text-green-300">
                  Respaldos automáticos activos
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Se realizarán respaldos automáticamente cuando haya cambios
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="text-amber-500" size={20} />
              <div className="flex-1">
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  Respaldos automáticos desactivados
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Inicia sesión con Supabase para activar los respaldos automáticos
                </p>
              </div>
            </>
          )}
        </div>

        {/* Información del usuario */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User size={16} />
            <span className="text-sm font-medium">Usuario autenticado:</span>
          </div>
          <div className="pl-6">
            {user ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                {user.email}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay usuario autenticado
              </p>
            )}
          </div>
        </div>

        {/* URL del webhook (solo informativa) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe size={16} />
            <span className="text-sm font-medium">URL del Webhook:</span>
          </div>
          <div className="pl-6">
            <p className="text-xs text-muted-foreground font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
              {webhookUrl}
            </p>
          </div>
        </div>

        {/* Botón de prueba */}
        <div className="pt-4">
          <Button 
            onClick={handleTest} 
            variant="outline" 
            className="flex items-center gap-2 w-full"
            disabled={!isEnabled}
          >
            <TestTube size={16} />
            Probar Respaldo Automático
          </Button>
        </div>

        {/* Información adicional */}
        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <p><strong>Funcionamiento automático:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Los respaldos se envían automáticamente cuando hay cambios en los datos</li>
            <li>Se usa automáticamente el email de tu cuenta de Supabase</li>
            <li>No requiere configuración manual</li>
            <li>Los respaldos se almacenan en el servidor con tu email como identificador</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoWebhookBackupComponent;
