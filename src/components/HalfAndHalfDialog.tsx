
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Pizza, Slice } from "lucide-react"
import { useState } from "react"
import type { Product } from "@/lib/db"
import { motion } from "framer-motion"

interface HalfAndHalfDialogProps {
  isOpen: boolean
  onClose: () => void
  pizzas: Product[]
  onConfirm: (firstHalf: Product, secondHalf: Product) => void
}

export function HalfAndHalfDialog({ isOpen, onClose, pizzas, onConfirm }: HalfAndHalfDialogProps) {
  const [firstHalf, setFirstHalf] = useState<Product | null>(null)
  const [secondHalf, setSecondHalf] = useState<Product | null>(null)

  const handleConfirm = () => {
    if (firstHalf && secondHalf) {
      onConfirm(firstHalf, secondHalf)
      onClose()
      setFirstHalf(null)
      setSecondHalf(null)
    }
  }

  const calculatePrice = () => {
    if (!firstHalf || !secondHalf) return 0
    return (firstHalf.price + secondHalf.price) / 2
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-[#111111] border-[#333333] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Pizza className="h-5 w-5" />
            Pizza Mitad y Mitad
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="font-medium mb-2 text-white">Primera Mitad</h3>
            <div className="grid grid-cols-2 gap-2">
              {pizzas.map((pizza) => (
                <motion.div
                  key={`first-${pizza.id}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFirstHalf(pizza)}
                  className={`p-2 rounded-lg cursor-pointer border transition-all duration-300 ${
                    firstHalf?.id === pizza.id
                      ? "border-orange-500 bg-orange-500/20"
                      : "border-[#333333] hover:border-orange-500/50 bg-[#1A1A1A]"
                  }`}
                >
                  <div className="text-sm font-medium text-white">{pizza.name}</div>
                  <div className="text-xs text-zinc-300">${pizza.price}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-white">Segunda Mitad</h3>
            <div className="grid grid-cols-2 gap-2">
              {pizzas.map((pizza) => (
                <motion.div
                  key={`second-${pizza.id}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSecondHalf(pizza)}
                  className={`p-2 rounded-lg cursor-pointer border transition-all duration-300 ${
                    secondHalf?.id === pizza.id
                      ? "border-orange-500 bg-orange-500/20"
                      : "border-[#333333] hover:border-orange-500/50 bg-[#1A1A1A]"
                  }`}
                >
                  <div className="text-sm font-medium text-white">{pizza.name}</div>
                  <div className="text-xs text-zinc-300">${pizza.price}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-[#1A1A1A] border border-[#333333]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Slice className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-white">Precio Total</span>
            </div>
            <span className="text-lg font-bold text-white">
              ${calculatePrice().toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-[#1A1A1A] hover:bg-[#252525] border-[#333333] text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!firstHalf || !secondHalf}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
