
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { UserPlus, Users } from "lucide-react"
import type { Cashier } from "@/lib/db"
import { initDB, Auth } from "@/lib/db"

interface CashierSelectorProps {
  onCashierSelect: (cashier: Cashier) => void;
}

export function CashierSelector({ onCashierSelect }: CashierSelectorProps) {
  const [cashiers, setCashiers] = useState<Cashier[]>([])
  const [showNewCashierDialog, setShowNewCashierDialog] = useState(false)
  const [newCashierName, setNewCashierName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadCashiers()
  }, [])

  const loadCashiers = async () => {
    try {
      setIsLoading(true)
      const db = await initDB()
      
      // Check if the cashiers store exists
      if (!db.objectStoreNames.contains('cashiers')) {
        console.error("Cashiers store not found in database");
        toast({
          title: "Error",
          description: "La base de datos no está inicializada correctamente",
          variant: "destructive",
        })
        return;
      }
      
      // Get cashiers from IndexedDB
      const dbCashiers = await db.getAll('cashiers')
      console.log("Loaded IndexedDB cashiers:", dbCashiers);
      
      // Get cashiers from Auth (UsersSettings)
      const auth = Auth.getInstance();
      const authCashiers = auth.getCashiers().map(c => ({
        id: c.id,
        name: c.username,
        active: true,
        pin: c.pin
      }));
      console.log("Loaded Auth cashiers:", authCashiers);
      
      // Merge both lists, avoiding duplicates (prefer IndexedDB entries if duplicate IDs)
      const existingIds = new Set(dbCashiers.map(c => c.id));
      const mergedCashiers = [
        ...dbCashiers,
        ...authCashiers.filter(c => !existingIds.has(c.id))
      ];
      
      console.log("Merged cashiers:", mergedCashiers);
      setCashiers(mergedCashiers)
    } catch (error) {
      console.error("Error loading cashiers:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los cajeros",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCashier = async () => {
    if (!newCashierName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre válido",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const newCashier: Cashier = {
        id: `cashier-${Date.now()}`,
        name: newCashierName.trim(),
        active: true,
      }

      const db = await initDB()
      
      if (!db.objectStoreNames.contains('cashiers')) {
        toast({
          title: "Error",
          description: "La base de datos no está inicializada correctamente",
          variant: "destructive",
        })
        return;
      }
      
      await db.add('cashiers', newCashier)
      console.log("Cashier created:", newCashier);
      
      setNewCashierName("")
      setShowNewCashierDialog(false)
      await loadCashiers()
      
      toast({
        title: "Éxito",
        description: "Cajero creado correctamente",
      })
    } catch (error) {
      console.error("Error creating cashier:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el cajero",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Seleccionar Cajero</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewCashierDialog(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Cajero
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-2">Cargando cajeros...</p>
        ) : cashiers.length > 0 ? (
          cashiers.map((cashier) => (
            <Button
              key={cashier.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onCashierSelect(cashier)}
            >
              <Users className="h-4 w-4 mr-2" />
              {cashier.name}
              {cashier.pin && <span className="ml-auto text-xs text-muted-foreground">PIN: {cashier.pin}</span>}
            </Button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">No hay cajeros disponibles</p>
        )}
      </div>

      <Dialog open={showNewCashierDialog} onOpenChange={setShowNewCashierDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cajero</DialogTitle>
            <DialogDescription>
              Ingrese el nombre del cajero para registrarlo en el sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Nombre del cajero"
              value={newCashierName}
              onChange={(e) => setNewCashierName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCashierDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCashier} disabled={isLoading || !newCashierName.trim()}>
              {isLoading ? "Creando..." : "Crear Cajero"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
