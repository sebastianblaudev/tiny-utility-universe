import { useState, useEffect } from "react";
import { ShiftManager } from "@/components/shifts/ShiftManager";
import { BackButton } from "@/components/BackButton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus, Minus, Clock, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { getTableOrder } from "@/lib/db";
import { useNavigate } from "react-router-dom";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Shifts() {
  const [activeTable, setActiveTable] = useState<number | null>(null);
  const [tableCount, setTableCount] = useState<number>(12);
  const [isAddingTable, setIsAddingTable] = useState<boolean>(false);
  const [isAddingMultiple, setIsAddingMultiple] = useState<boolean>(false);
  const [tablesToAdd, setTablesToAdd] = useState<number>(1);
  const [tableWithOrders, setTablesWithOrders] = useState<number[]>([]);
  const [tableDialogOpen, setTableDialogOpen] = useState<boolean>(false);
  const maxTables = 50;
  const navigate = useNavigate();

  // Check which tables have saved orders
  useEffect(() => {
    const checkSavedOrders = async () => {
      const tablesWithOrders: number[] = [];
      
      for (let i = 1; i <= tableCount; i++) {
        const order = await getTableOrder(i);
        if (order) {
          tablesWithOrders.push(i);
        }
      }
      
      setTablesWithOrders(tablesWithOrders);
      console.log("Tables with saved orders:", tablesWithOrders);
    };
    
    checkSavedOrders();
  }, [tableCount]);

  // Function to add a single table
  const addTable = () => {
    if (tableCount >= maxTables) {
      toast({
        title: "Límite alcanzado",
        description: `No se pueden agregar más de ${maxTables} mesas`,
        variant: "destructive"
      });
      return;
    }
    
    setTableCount(prev => prev + 1);
    setIsAddingTable(true);
    
    // Reset adding state after animation
    setTimeout(() => {
      setIsAddingTable(false);
    }, 500);
    
    toast({
      title: "Mesa agregada",
      description: `Se ha agregado la mesa #${tableCount + 1}`,
      variant: "default"
    });
  };

  // Function to add multiple tables
  const addMultipleTables = () => {
    if (tableCount + tablesToAdd > maxTables) {
      toast({
        title: "Límite excedido",
        description: `Solo se pueden agregar ${maxTables - tableCount} mesas más`,
        variant: "destructive"
      });
      return;
    }
    
    setTableCount(prev => prev + tablesToAdd);
    setIsAddingMultiple(false);
    setTablesToAdd(1);
    
    toast({
      title: "Mesas agregadas",
      description: `Se han agregado ${tablesToAdd} mesas nuevas`,
      variant: "default"
    });
  };

  // Handle table selection and navigate to POS with the selected table
  const handleTableSelection = () => {
    if (!activeTable) return;
    
    // Convert to string if necessary
    const tableId = activeTable.toString();
    
    // Navigate to index page with table selection
    navigate('/', { 
      state: { 
        selectedTable: tableId, 
        orderType: 'mesa' 
      } 
    });
  };

  // Handle table selection from dropdown
  const handleDropdownTableSelect = (tableNumber: number) => {
    setActiveTable(tableNumber);
    setTableDialogOpen(true); // Open the dialog when a table is selected
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto p-4 relative">
        <BackButton />
        <div className="max-w-md mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6">Apertura y Cierre de Caja</h1>
          
          <Button 
            variant="outline" 
            className="w-full mb-6 bg-[#1A1A1A] border-orange-500/30 hover:bg-[#252525] hover:border-orange-500 text-white"
            onClick={() => setTableDialogOpen(true)}
          >
            {activeTable ? `Mesa ${activeTable}` : "Seleccionar Mesa"}
          </Button>
          
          <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
            <DialogContent className="sm:max-w-md bg-[#111111] border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Seleccionar Mesa</DialogTitle>
              </DialogHeader>
              
              <div className="py-4">
                <div className="mb-6">
                  {/* Table Selection Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full flex justify-between items-center bg-[#1A1A1A] hover:bg-[#252525] text-white border-zinc-700"
                      >
                        {activeTable ? `Mesa ${activeTable}` : "Selecciona una mesa"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="center" 
                      className="w-[200px] max-h-[300px] overflow-y-auto grid grid-cols-4 gap-1 p-2"
                    >
                      {Array.from({ length: tableCount }).map((_, index) => {
                        const tableNumber = index + 1;
                        const hasOrder = tableWithOrders.includes(tableNumber);
                        
                        return (
                          <DropdownMenuItem 
                            key={tableNumber}
                            onClick={() => handleDropdownTableSelect(tableNumber)}
                            className={`text-center cursor-pointer text-white 
                            hover:bg-[#252525] hover:text-white ${activeTable === tableNumber ? 'bg-[#252525]' : ''}
                            ${hasOrder ? 'bg-purple-700/50' : ''}`}
                          >
                            {tableNumber}
                            {hasOrder && <span className="ml-1 text-purple-400">•</span>}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {activeTable && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                      p-4 mb-6 rounded-lg
                      ${tableWithOrders.includes(activeTable) 
                        ? 'bg-purple-900/20 border border-purple-500/50' 
                        : 'bg-[#1A1A1A] border border-zinc-800'}
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xl font-bold text-white">Mesa {activeTable}</p>
                        {tableWithOrders.includes(activeTable) && (
                          <p className="text-sm text-purple-400 flex items-center">
                            <Clock className="h-4 w-4 mr-1" /> 
                            Esta mesa tiene una orden guardada
                          </p>
                        )}
                      </div>
                      <div className={`
                        w-16 h-16 flex items-center justify-center rounded-lg
                        ${tableWithOrders.includes(activeTable) 
                          ? 'bg-purple-700/20 text-white' 
                          : 'bg-[#252525] text-white'}
                      `}>
                        <span className="text-2xl font-bold">{activeTable}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div className="flex justify-between mt-4 bg-[#1A1A1A] p-3 rounded-lg border border-zinc-800">
                  <div className="flex space-x-2 items-center">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 bg-[#252525] hover:bg-zinc-700 text-white"
                      onClick={addTable}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-white">Agregar mesa</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#252525] hover:bg-zinc-700 text-white"
                    onClick={() => setIsAddingMultiple(true)}
                  >
                    Agregar múltiples
                  </Button>
                </div>
              </div>
              
              <Dialog open={isAddingMultiple} onOpenChange={setIsAddingMultiple}>
                <DialogContent className="bg-[#111111] border-zinc-800 w-[300px]">
                  <DialogHeader>
                    <DialogTitle>Agregar múltiples mesas</DialogTitle>
                  </DialogHeader>
                  
                  <div className="flex items-center space-x-2 py-4">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setTablesToAdd(prev => Math.max(1, prev - 1))}
                      className="h-8 w-8 p-0 bg-[#252525] hover:bg-zinc-700 text-white"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <Input
                      type="number"
                      min="1"
                      max={maxTables - tableCount}
                      value={tablesToAdd}
                      onChange={(e) => setTablesToAdd(Math.min(
                        Math.max(1, parseInt(e.target.value) || 1),
                        maxTables - tableCount
                      ))}
                      className="bg-[#1A1A1A] border-zinc-800 text-center text-white"
                    />
                    
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => setTablesToAdd(prev => Math.min(prev + 1, maxTables - tableCount))}
                      className="h-8 w-8 p-0 bg-[#252525] hover:bg-zinc-700 text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="ghost"
                      onClick={() => setIsAddingMultiple(false)}
                      className="text-white"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={addMultipleTables} className="text-white">
                      Agregar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setTableDialogOpen(false);
                  }}
                  className="bg-[#1A1A1A] border-zinc-700 hover:bg-[#252525] text-white"
                >
                  Cancelar
                </Button>
                <Button 
                  disabled={!activeTable}
                  className={`
                    bg-gradient-to-r from-orange-600 to-orange-500 
                    hover:from-orange-500 hover:to-orange-600 border-0 text-white
                    ${!activeTable ? 'opacity-50' : 'shadow-[0_0_15px_rgba(249,115,22,0.3)]'}
                  `}
                  onClick={() => {
                    handleTableSelection();
                    setTableDialogOpen(false);
                  }}
                >
                  Confirmar Mesa {activeTable}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <ShiftManager />
        </div>
      </div>
    </div>
  );
}
