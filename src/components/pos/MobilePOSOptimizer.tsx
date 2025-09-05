import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Zap, ShoppingCart, CreditCard, Users } from 'lucide-react';

interface MobilePOSOptimizerProps {
  onActivate: () => void;
  onDismiss: () => void;
}

export const MobilePOSOptimizer: React.FC<MobilePOSOptimizerProps> = ({ onActivate, onDismiss }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center p-4">
      <Card className="w-full max-w-sm mx-auto p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">🚀 POS Móvil Optimizado</h2>
          <p className="text-muted-foreground text-sm">
            Detectamos que estás en un dispositivo móvil. ¡Activa el POS optimizado para mejor experiencia!
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Zap className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Ventas Ultra-Rápidas</p>
              <p className="text-xs text-muted-foreground">Interfaz optimizada para touch</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Carrito Inteligente</p>
              <p className="text-xs text-muted-foreground">Gestión de productos simplificada</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Pagos Rápidos</p>
              <p className="text-xs text-muted-foreground">Efectivo, tarjeta y mixto</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={onActivate} className="w-full h-12 text-base">
            <Smartphone className="h-4 w-4 mr-2" />
            Activar POS Móvil
          </Button>
          
          <Button variant="ghost" onClick={onDismiss} className="w-full text-sm">
            Mantener POS Normal
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Optimizado para UX móvil
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};