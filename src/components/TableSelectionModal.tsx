
import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Clock, Plus, Receipt, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableCount: number;
  activeTable: string | null;
  tableWithOrders: number[];
  onSelectTable: (tableNumber: string) => void;
  onPrintPreBill?: (tableNumber: string) => void;
  onPayOrder?: (tableNumber: string) => void;
}

export function TableSelectionModal({
  isOpen,
  onClose,
  tableCount,
  activeTable,
  tableWithOrders,
  onSelectTable,
  onPrintPreBill,
  onPayOrder
}: TableSelectionModalProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(activeTable);
  const navigate = useNavigate();

  // Reset selected table when modal opens with activeTable
  useEffect(() => {
    if (isOpen) {
      setSelectedTable(activeTable);
    }
  }, [isOpen, activeTable]);

  const handleTableSelect = (tableNumber: string) => {
    setSelectedTable(tableNumber);
  };

  const handleConfirm = () => {
    if (selectedTable) {
      onSelectTable(selectedTable);
      onClose();
    }
  };

  const handleAddMoreItems = () => {
    if (selectedTable) {
      navigate('/', { 
        state: { 
          selectedTable: selectedTable, 
          orderType: 'mesa' 
        } 
      });
      onClose();
    }
  };

  const handlePrintPreBill = () => {
    if (selectedTable && onPrintPreBill) {
      onPrintPreBill(selectedTable);
    }
  };

  const handlePayOrder = () => {
    if (selectedTable && onPayOrder) {
      onPayOrder(selectedTable);
      onClose();
    }
  };

  const tableHasOrder = selectedTable ? tableWithOrders.includes(parseInt(selectedTable)) : false;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md bg-[#111111] border-zinc-800 dialog-content pointer-events-auto" style={{ pointerEvents: "auto" }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Seleccionar Mesa</DialogTitle>
          <DialogDescription className="sr-only">Selecciona una mesa para continuar</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: tableCount }).map((_, index) => {
              const tableNumber = (index + 1).toString();
              const hasOrder = tableWithOrders.includes(index + 1);
              
              return (
                <motion.div
                  key={tableNumber}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ pointerEvents: "auto" }}
                >
                  <Button 
                    variant={selectedTable === tableNumber ? "default" : "outline"}
                    className={`
                      w-full h-14
                      text-white
                      ${selectedTable === tableNumber 
                        ? 'bg-orange-600 hover:bg-orange-700 shadow-lg' 
                        : hasOrder 
                          ? 'bg-purple-700 border-purple-500 hover:bg-purple-800'
                          : 'bg-[#1A1A1A] border-zinc-700 hover:bg-[#252525]'}
                    `}
                    onClick={() => handleTableSelect(tableNumber)}
                    style={{ pointerEvents: "auto" }}
                  >
                    <div className="relative w-full h-full flex items-center justify-center" style={{ pointerEvents: "auto" }}>
                      <span className="text-lg text-white">Mesa {tableNumber}</span>
                      {hasOrder && (
                        <div className="absolute top-1 right-1">
                          <span className="text-orange-400 text-sm">•</span>
                        </div>
                      )}
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>
          
          {selectedTable && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
              style={{ pointerEvents: "auto" }}
            >
              <div className={`
                p-4 rounded-lg pointer-events-auto mb-4
                ${tableWithOrders.includes(parseInt(selectedTable)) 
                  ? 'bg-purple-900/20 border border-purple-500/50' 
                  : 'bg-[#1A1A1A] border border-zinc-800'}
              `}>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-xl font-bold text-white">Mesa {selectedTable}</p>
                    {tableWithOrders.includes(parseInt(selectedTable)) && (
                      <p className="text-sm text-purple-400 flex items-center">
                        <Clock className="h-4 w-4 mr-1" /> 
                        Esta mesa tiene una orden guardada
                      </p>
                    )}
                  </div>
                  <div className={`
                    w-16 h-16 flex items-center justify-center rounded-lg
                    ${tableWithOrders.includes(parseInt(selectedTable)) 
                      ? 'bg-purple-700/20 text-purple-400' 
                      : 'bg-[#252525] text-zinc-300'}
                  `}
                    style={{ pointerEvents: "auto" }}
                  >
                    <span className="text-2xl font-bold text-white">{selectedTable}</span>
                  </div>
                </div>

                {tableHasOrder && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium"
                      onClick={handleAddMoreItems}
                    >
                      <Plus className="h-4 w-4 mr-1" /> AÑADIR
                    </Button>
                    <Button 
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium"
                      onClick={handlePayOrder}
                    >
                      COBRAR
                    </Button>
                    <Button 
                      className="bg-orange-600 hover:bg-orange-700 text-white w-12 p-0"
                      onClick={handlePrintPreBill}
                      title="Imprimir precuenta"
                    >
                      <Printer className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
        
        <DialogFooter style={{ pointerEvents: "auto" }}>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-[#1A1A1A] border-zinc-700 hover:bg-[#252525] text-white"
            style={{ pointerEvents: "auto" }}
          >
            Cancelar
          </Button>
          <Button 
            disabled={!selectedTable}
            className={`
              bg-gradient-to-r from-orange-600 to-orange-500 
              hover:from-orange-500 hover:to-orange-600 border-0 text-white
              ${!selectedTable ? 'opacity-50' : 'shadow-[0_0_15px_rgba(249,115,22,0.3)]'}
            `}
            onClick={handleConfirm}
            style={{ pointerEvents: "auto" }}
          >
            Confirmar Mesa {selectedTable}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
