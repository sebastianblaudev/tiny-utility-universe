
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { initDB, type Shift, type Cashier } from "@/lib/db"
import { CashierSelector } from "./CashierSelector"
import { ZReport } from "./ZReport"
import { createRoot } from "react-dom/client"
import { printElement } from "@/lib/utils"
import { openDB } from 'idb';

export function ShiftManager() {
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [startAmount, setStartAmount] = useState("")
  const [endAmount, setEndAmount] = useState("")
  const [note, setNote] = useState("")
  const [dbInitialized, setDbInitialized] = useState(false)
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const init = async () => {
      try {
        const db = await initDB();
        setDbInitialized(true);
        console.log("Database initialized successfully");
        if (db) {
          await checkActiveShift();
        }
      } catch (error) {
        console.error("Error initializing database:", error);
        toast({
          title: "Error",
          description: "No se pudo inicializar la base de datos",
          variant: "destructive",
        });
      }
    };
    
    init();
  }, []);

  const checkActiveShift = async () => {
    try {
      const db = await initDB();
      
      // Get all shifts and find if there's an active one
      const shifts = await db.getAll('shifts');
      console.log("Retrieved shifts:", shifts);
      
      if (shifts && shifts.length > 0) {
        const lastShift = shifts[shifts.length - 1];
        if (lastShift && !lastShift.endTime) {
          setActiveShift(lastShift);
        }
      }
    } catch (error) {
      console.error("Error checking active shift:", error);
      toast({
        title: "Error",
        description: "Error al verificar el turno activo",
        variant: "destructive",
      });
    }
  }

  const startShift = async () => {
    if (!startAmount || isNaN(parseFloat(startAmount))) {
      toast({
        title: "Error",
        description: "Por favor ingresa un monto válido",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCashier) {
      toast({
        title: "Error",
        description: "Por favor selecciona un cajero",
        variant: "destructive",
      });
      return;
    }

    try {
      const shift: Shift = {
        id: `shift-${Date.now()}`,
        startAmount: parseFloat(startAmount),
        startTime: new Date(),
        cashierId: selectedCashier.id,
        cashierName: selectedCashier.name,
      };

      const db = await initDB();
      await db.add('shifts', shift);
      setActiveShift(shift);
      setStartAmount("");
      setSelectedCashier(null);

      toast({
        title: "Caja abierta",
        description: "La caja se ha abierto correctamente",
      });
    } catch (error) {
      console.error("Error starting shift:", error);
      toast({
        title: "Error",
        description: "No se pudo abrir la caja",
        variant: "destructive",
      });
    }
  }

  const endShift = async () => {
    if (!activeShift || !endAmount || isNaN(parseFloat(endAmount))) {
      toast({
        title: "Error",
        description: "Por favor ingresa un monto válido",
        variant: "destructive",
      });
      return;
    }

    try {
      const db = await initDB();
      
      // Get orders for this shift
      const orderTx = db.transaction('orders', 'readonly');
      const orderStore = orderTx.objectStore('orders');
      const allOrders = await orderStore.getAll();
      
      // Filter orders for current shift
      const shiftOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const shiftStart = new Date(activeShift.startTime);
        const shiftEnd = new Date();
        return orderDate >= shiftStart && orderDate <= shiftEnd;
      });

      const updatedShift = {
        ...activeShift,
        endAmount: parseFloat(endAmount),
        endTime: new Date(),
        note,
      };

      await db.put('shifts', updatedShift);

      // Print Z Report
      const reportDiv = document.createElement('div');
      const reportRoot = createRoot(reportDiv);
      reportRoot.render(<ZReport shift={updatedShift} orders={shiftOrders} />);
      
      setTimeout(() => {
        printElement(reportDiv);
        
        setActiveShift(null);
        setEndAmount("");
        setNote("");

        toast({
          title: "Caja cerrada",
          description: "La caja se ha cerrado correctamente y el reporte Z ha sido impreso",
        });
      }, 250);
    } catch (error) {
      console.error("Error ending shift:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la caja",
        variant: "destructive",
      });
    }
  }

  if (activeShift) {
    const startTime = new Date(activeShift.startTime).toLocaleTimeString();
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Estado de Caja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Apertura:</span>
              <span className="font-medium">{startTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto inicial:</span>
              <span className="font-medium">${activeShift.startAmount}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto final</label>
              <Input
                type="number"
                placeholder="Ingresa el monto final"
                value={endAmount}
                onChange={(e) => setEndAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nota (opcional)</label>
              <Input
                placeholder="Agregar nota"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={endShift} disabled={!endAmount}>
              <Wallet className="mr-2 h-4 w-4" />
              Cerrar Caja
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Apertura de Caja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CashierSelector onCashierSelect={setSelectedCashier} />
        
        {selectedCashier && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto inicial</label>
            <Input
              type="number"
              placeholder="Ingresa el monto inicial"
              value={startAmount}
              onChange={(e) => setStartAmount(e.target.value)}
            />
          </div>
        )}

        <Button 
          className="w-full" 
          onClick={startShift} 
          disabled={!startAmount || !selectedCashier || !dbInitialized}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Abrir Caja
        </Button>
      </CardContent>
    </Card>
  );
}
