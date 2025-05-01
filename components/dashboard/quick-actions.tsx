"use client"

import { Button } from "@/components/ui/button"
import { FileText, Package, RefreshCw, ShoppingCart, Truck, Users } from "lucide-react"

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        className="h-auto flex-col py-4 justify-start items-center gap-2"
        onClick={() => (window.location.href = "/pos")}
      >
        <ShoppingCart className="h-5 w-5" />
        <span>Nueva Venta</span>
      </Button>
      <Button variant="outline" className="h-auto flex-col py-4 justify-start items-center gap-2">
        <Package className="h-5 w-5" />
        <span>Nuevo Producto</span>
      </Button>
      <Button variant="outline" className="h-auto flex-col py-4 justify-start items-center gap-2">
        <Users className="h-5 w-5" />
        <span>Nuevo Cliente</span>
      </Button>
      <Button variant="outline" className="h-auto flex-col py-4 justify-start items-center gap-2">
        <Truck className="h-5 w-5" />
        <span>Recibir Mercadería</span>
      </Button>
      <Button variant="outline" className="h-auto flex-col py-4 justify-start items-center gap-2">
        <FileText className="h-5 w-5" />
        <span>Reportes</span>
      </Button>
      <Button variant="outline" className="h-auto flex-col py-4 justify-start items-center gap-2">
        <RefreshCw className="h-5 w-5" />
        <span>Sincronizar</span>
      </Button>
    </div>
  )
}
