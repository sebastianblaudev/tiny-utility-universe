
import { useState } from "react"
import { ShiftManager } from "@/components/shifts/ShiftManager"
import { BackButton } from "@/components/BackButton"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function Shifts() {
  const [activeTable, setActiveTable] = useState<number | null>(null)
  const [tableCount, setTableCount] = useState<number>(12)
  const [isAddingTable, setIsAddingTable] = useState<boolean>(false)
  const maxTables = 20 // Establecemos un límite máximo de mesas

  // Función para agregar una mesa
  const addTable = () => {
    if (tableCount >= maxTables) {
      toast({
        title: "Límite alcanzado",
        description: `No se pueden agregar más de ${maxTables} mesas`,
        variant: "destructive"
      })
      return
    }
    
    setTableCount(prev => prev + 1)
    setIsAddingTable(true)
    
    // Después de un breve tiempo, desactivamos el estado de adición
    setTimeout(() => {
      setIsAddingTable(false)
    }, 500)
    
    toast({
      title: "Mesa agregada",
      description: `Se ha agregado la mesa #${tableCount + 1}`,
      variant: "default"
    })
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto p-4 relative">
        <BackButton />
        <div className="max-w-md mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6">Apertura y Cierre de Caja</h1>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full mb-6 bg-[#1A1A1A] border-orange-500/30 hover:bg-[#252525] hover:border-orange-500"
              >
                Seleccionar Mesa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#111111] border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Seleccionar Mesa</DialogTitle>
              </DialogHeader>
              
              <div className="relative">
                <div className="grid grid-cols-3 gap-4 p-4">
                  <AnimatePresence>
                    {Array.from({ length: tableCount }).map((_, index) => {
                      const tableNumber = index + 1
                      const isActive = tableNumber === activeTable
                      
                      return (
                        <motion.div
                          key={tableNumber}
                          initial={{ opacity: index >= tableCount - 1 && isAddingTable ? 0 : 1, scale: index >= tableCount - 1 && isAddingTable ? 0.8 : 1 }}
                          animate={{ opacity: 1, scale: isActive ? 1.05 : 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{
                            duration: 0.2,
                            layout: { duration: 0.3 }
                          }}
                          layout
                          onClick={() => setActiveTable(tableNumber)}
                          className={`
                            relative cursor-pointer rounded-lg overflow-hidden
                            flex items-center justify-center aspect-square
                            ${isActive 
                              ? 'bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30' 
                              : 'bg-[#1A1A1A] border border-zinc-800 hover:border-orange-500/50'}
                          `}
                        >
                          <span className={`
                            text-4xl font-bold
                            ${isActive ? 'text-white' : 'text-zinc-300'}
                          `}>
                            {tableNumber}
                          </span>
                          
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-orange-500/10 pointer-events-none"
                            />
                          )}
                        </motion.div>
                      )
                    })}
                    
                    {/* Botón para agregar una mesa */}
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addTable}
                      className="relative cursor-pointer rounded-lg overflow-hidden
                                flex items-center justify-center aspect-square
                                bg-[#1A1A1A] border border-dashed border-orange-500/50
                                hover:border-orange-500 hover:bg-[#252525]"
                    >
                      <Plus className="h-8 w-8 text-orange-500" />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTable(null)}
                  className="bg-[#1A1A1A] border-zinc-700 hover:bg-[#252525]"
                >
                  Cancelar
                </Button>
                <Button 
                  disabled={!activeTable}
                  className={`
                    bg-gradient-to-r from-orange-600 to-orange-500 
                    hover:from-orange-500 hover:to-orange-600 border-0
                    ${!activeTable ? 'opacity-50' : 'shadow-[0_0_15px_rgba(249,115,22,0.3)]'}
                  `}
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
