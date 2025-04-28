
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Order, Customer } from "@/lib/db";

type CustomerLastOrderDialogProps = {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  order: Order | null;
};

export function CustomerLastOrderDialog({
  open,
  onClose,
  customer,
  order,
}: CustomerLastOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E2129] border-[#333333] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {customer ? `Última compra de ${customer.name}` : "Última compra"}
          </DialogTitle>
        </DialogHeader>
        {order ? (
          <div className="space-y-2 mt-4">
            <div>
              <span className="font-bold">Fecha:</span>{" "}
              {new Date(order.createdAt).toLocaleString("es-AR")}
            </div>
            <div>
              <span className="font-bold">Total:</span>{" "}
              {order.total?.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
              })}
            </div>
            <div>
              <span className="font-bold">Estado:</span>{" "}
              {order.status}
            </div>
            <div>
              <span className="font-bold">Productos:</span>
              <ul className="ml-6 list-disc">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.quantity}x {item.name}
                    {item.size ? ` (${item.size})` : ""} —{" "}
                    {item.price.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-300">
            Este cliente aún no tiene compras registradas.
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-[#1A1A1A] hover:bg-[#252525] border-[#333333] text-white"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
