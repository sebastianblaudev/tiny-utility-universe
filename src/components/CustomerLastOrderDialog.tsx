
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
import { Receipt, Calendar, FileText, Tag, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
        <DialogHeader className="pb-2 border-b border-[#333333] mb-4">
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-orange-400" />
            <span>
              {customer ? `Última compra de ${customer.name}` : "Última compra"}
            </span>
          </DialogTitle>
        </DialogHeader>
        {order ? (
          <div className="space-y-4 mt-2">
            <div className="bg-[#252835] rounded-lg p-3 border border-[#333333] shadow-inner">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300">Fecha:</span>
                </div>
                <span className="font-medium">{new Date(order.createdAt).toLocaleString("es-AR")}</span>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-green-400" />
                  <span className="text-gray-300">Total:</span>
                </div>
                <span className="font-medium text-orange-400">
                  {formatCurrency(order.total)}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-300">Estado:</span>
                </div>
                <span className="font-medium">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    order.status === 'completado' ? 'bg-green-900/50 text-green-300' :
                    order.status === 'en progreso' ? 'bg-blue-900/50 text-blue-300' :
                    order.status === 'cancelado' ? 'bg-red-900/50 text-red-300' :
                    'bg-gray-900/50 text-gray-300'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4 text-orange-400" />
                <span className="font-semibold text-gray-200">Productos:</span>
              </div>
              <div className="bg-[#252835] rounded-lg p-3 border border-[#333333] space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-[#1E2129] rounded border border-[#333333]">
                    <div className="flex items-center space-x-2">
                      <span className="bg-orange-900/60 text-orange-200 px-2 py-0.5 rounded text-xs">
                        {item.quantity}x
                      </span>
                      <span>
                        {item.name} 
                        {item.size ? <span className="text-gray-400 text-sm ml-1">({item.size})</span> : ""}
                      </span>
                    </div>
                    <span className="text-orange-300">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-300 bg-[#252835] rounded-lg border border-[#333333]">
            Este cliente aún no tiene compras registradas.
          </div>
        )}
        <DialogFooter className="mt-2">
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
