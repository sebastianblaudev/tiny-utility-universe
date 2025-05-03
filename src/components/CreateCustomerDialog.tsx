import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { initDB } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import type { Customer } from "@/lib/db"
import { v4 as uuidv4 } from 'uuid'

interface CreateCustomerDialogProps {
  isOpen: boolean
  onClose: () => void
  onCustomerCreated: (customer: Customer) => void
}

export function CreateCustomerDialog({ 
  isOpen, 
  onClose,
  onCustomerCreated 
}: CreateCustomerDialogProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [reference, setReference] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !phone) {
      toast({
        title: "Error",
        description: "Nombre y teléfono son requeridos",
        variant: "destructive"
      })
      return
    }

    try {
      const newCustomer: Customer = {
        id: uuidv4(),
        name,
        phone,
        email,
        orders: [],
        address: address ? {
          street: address,
          reference: reference || undefined
        } : undefined
      }

      const db = await initDB();
      await db.add('customers', newCustomer);
      
      onCustomerCreated(newCustomer)
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido creado exitosamente"
      })
      
      // Reset form
      setName("")
      setPhone("")
      setEmail("")
      setAddress("")
      setReference("")
      onClose()
    } catch (error) {
      console.error("Error al crear cliente:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#111111] border-[#333333] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Crear Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Nombre del cliente"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#1A1A1A] border-[#333333] focus:border-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="Número de teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-[#1A1A1A] border-[#333333] focus:border-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email del cliente"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#1A1A1A] border-[#333333] focus:border-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="Dirección completa"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-[#1A1A1A] border-[#333333] focus:border-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                placeholder="Referencia para ubicar la dirección"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="bg-[#1A1A1A] border-[#333333] focus:border-orange-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] text-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-orange-600 hover:bg-orange-700"
            >
              Crear Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
