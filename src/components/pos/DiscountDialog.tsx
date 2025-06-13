
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscountType, Discount } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useLanguageCurrency } from "@/hooks/useLanguageCurrency";

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTotal: number;
  onApplyDiscount: (discount: Discount) => void;
}

const DiscountDialog = ({
  open,
  onOpenChange,
  currentTotal,
  onApplyDiscount,
}: DiscountDialogProps) => {
  const [discountType, setDiscountType] = useState<DiscountType>(DiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [finalAmount, setFinalAmount] = useState<number>(currentTotal);
  const { toast } = useToast();
  const { formatCurrency, getText, config } = useLanguageCurrency();

  useEffect(() => {
    // Calculate the final amount after discount
    const value = parseFloat(discountValue) || 0;
    
    if (discountType === DiscountType.PERCENTAGE) {
      if (value > 100) {
        setFinalAmount(0);
      } else {
        setFinalAmount(currentTotal * (1 - value / 100));
      }
    } else {
      setFinalAmount(Math.max(0, currentTotal - value));
    }
  }, [discountType, discountValue, currentTotal]);

  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue);
    
    if (isNaN(value) || value <= 0) {
      toast({
        title: getText("Valor inválido", "Invalid value"),
        description: getText("Por favor, introduce un valor de descuento válido", "Please enter a valid discount value"),
        variant: "destructive",
      });
      return;
    }

    if (discountType === DiscountType.PERCENTAGE && value > 100) {
      toast({
        title: getText("Porcentaje inválido", "Invalid percentage"),
        description: getText("El porcentaje de descuento no puede ser mayor al 100%", "Discount percentage cannot be greater than 100%"),
        variant: "destructive",
      });
      return;
    }

    const discount: Discount = {
      type: discountType,
      value,
      reason: reason.trim() || undefined,
    };

    onApplyDiscount(discount);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setDiscountType(DiscountType.PERCENTAGE);
    setDiscountValue("");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getText("Aplicar descuento", "Apply discount")}</DialogTitle>
          <DialogDescription>
            {getText("Selecciona el tipo de descuento y su valor.", "Select the discount type and value.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discount-type" className="text-right">
              {getText("Tipo", "Type")}
            </Label>
            <Select
              value={discountType}
              onValueChange={(value) => setDiscountType(value as DiscountType)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={getText("Selecciona el tipo de descuento", "Select discount type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DiscountType.PERCENTAGE}>
                  {getText("Porcentaje (%)", "Percentage (%)")}
                </SelectItem>
                <SelectItem value={DiscountType.FIXED}>
                  {getText("Monto fijo ($)", "Fixed amount ($)")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discount-value" className="text-right">
              {getText("Valor", "Value")}
            </Label>
            <Input
              id="discount-value"
              type="number"
              min="0"
              max={discountType === DiscountType.PERCENTAGE ? "100" : undefined}
              step={config.decimals === 2 ? "0.01" : "1"}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="col-span-3"
              placeholder={discountType === DiscountType.PERCENTAGE ? "0-100" : getText("Monto", "Amount")}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              {getText("Motivo", "Reason")}
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="col-span-3"
              placeholder={getText("Cliente frecuente, promoción especial, etc.", "Frequent customer, special promotion, etc.")}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 mt-2">
            <div className="bg-muted p-3 rounded-md">
              <div className="flex justify-between text-sm mb-1">
                <span>{getText("Total original:", "Original total:")}</span>
                <span>{formatCurrency(currentTotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>{getText("Descuento:", "Discount:")}</span>
                <span>
                  {discountType === DiscountType.PERCENTAGE
                    ? `${parseFloat(discountValue) || 0}%`
                    : formatCurrency(parseFloat(discountValue) || 0)}
                </span>
              </div>
              <div className="flex justify-between font-bold mt-1 pt-1 border-t">
                <span>{getText("Nuevo total:", "New total:")}</span>
                <span>{formatCurrency(finalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            {getText("Cancelar", "Cancel")}
          </Button>
          <Button
            onClick={handleApplyDiscount}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {getText("Aplicar descuento", "Apply discount")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountDialog;
