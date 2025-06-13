
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Promotion } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Tag, Calendar } from "lucide-react";

interface PromotionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotions: Promotion[];
  onApplyPromotion: (promotion: Promotion) => void;
  cartTotal: number;
}

const PromotionsDialog = ({
  open,
  onOpenChange,
  promotions,
  onApplyPromotion,
  cartTotal,
}: PromotionsDialogProps) => {
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>("");
  const { toast } = useToast();

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedPromotionId("");
    }
  }, [open]);

  const handleApplyPromotion = () => {
    if (!selectedPromotionId) {
      toast({
        title: "Ninguna promoción seleccionada",
        description: "Por favor, selecciona una promoción para aplicar",
        variant: "destructive",
      });
      return;
    }

    const promotion = promotions.find((p) => p.id === selectedPromotionId);
    if (!promotion) return;

    // Check minimum purchase if applicable
    if (promotion.minimumPurchase && cartTotal < promotion.minimumPurchase) {
      toast({
        title: "No cumple con el monto mínimo",
        description: `Esta promoción requiere un monto mínimo de compra de $${promotion.minimumPurchase.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    onApplyPromotion(promotion);
    onOpenChange(false);
  };

  // Filter active promotions
  const activePromotions = promotions.filter(
    (p) => p.active && new Date() >= new Date(p.startDate) && new Date() <= new Date(p.endDate)
  );

  const formatDate = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aplicar promoción</DialogTitle>
          <DialogDescription>
            Selecciona una promoción para aplicar a la venta actual.
          </DialogDescription>
        </DialogHeader>

        {activePromotions.length === 0 ? (
          <div className="py-6 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
            <p className="text-muted-foreground">No hay promociones activas disponibles</p>
          </div>
        ) : (
          <RadioGroup
            value={selectedPromotionId}
            onValueChange={setSelectedPromotionId}
            className="gap-4 py-4"
          >
            {activePromotions.map((promotion) => (
              <div
                key={promotion.id}
                className={`flex items-start space-x-3 rounded-lg border p-3 ${
                  selectedPromotionId === promotion.id ? "border-purple-500 bg-purple-50" : ""
                }`}
              >
                <RadioGroupItem value={promotion.id} id={promotion.id} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={promotion.id}
                      className="text-base font-medium cursor-pointer"
                    >
                      {promotion.name}
                    </Label>
                    {promotion.requiresOwnerPin && (
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                        Requiere PIN
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {promotion.description}
                  </p>
                  
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                      </span>
                    </div>
                    {promotion.minimumPurchase && (
                      <span>
                        Min: ${promotion.minimumPurchase.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleApplyPromotion}
            disabled={activePromotions.length === 0 || !selectedPromotionId}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Aplicar promoción
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionsDialog;
