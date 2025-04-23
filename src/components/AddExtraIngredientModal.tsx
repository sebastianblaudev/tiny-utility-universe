
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { openDB } from "idb";

type Ingredient = {
  id: string;
  name: string;
  stock?: number;
  price?: number;
};

interface AddExtraIngredientModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (ingredient: Ingredient) => void;
}

export const AddExtraIngredientModal: React.FC<AddExtraIngredientModalProps> = ({ open, onClose, onAdd }) => {
  const [extras, setExtras] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchExtras() {
      if (!open) return;
      const db = await openDB("pizzaPos", 3);
      if (!db) return;

      const categories = await db.getAll("categories");
      // Buscar la categoría de "extras" (acepta cat_extras o nombre extras)
      const extrasCat = categories.find(
        cat => cat.id === "cat_extras" || cat.name?.toLowerCase() === "extras"
      );
      if (!extrasCat) {
        setExtras([]);
        return;
      }

      const allProducts = await db.getAll("products");
      // Filtrar sólo productos de la categoría de extras
      const filteredExtras = allProducts.filter(
        (prod: any) =>
          prod.category === extrasCat.id ||
          prod.categoryId === extrasCat.id
      );
      setExtras(filteredExtras);
    }

    fetchExtras();
  }, [open]);

  const filtered = extras.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-[#121212] border-[#242424]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white/90">
            <Plus size={20} className="text-orange-400" />
            Agregar ingrediente extra
          </DialogTitle>
        </DialogHeader>
        <div className="mb-2">
          <Input
            placeholder="Buscar ingrediente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-3 bg-[#232323] text-white border-[#444] placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
          />
          <ul className="max-h-44 overflow-y-auto space-y-2">
            {filtered.length === 0 && (
              <div className="text-xs text-gray-300 text-center py-2">No se encontraron ingredientes extra</div>
            )}
            {filtered.map(ing => (
              <li 
                key={ing.id} 
                className="flex items-center justify-between rounded px-3 py-2 bg-[#1E1E1E] hover:bg-orange-600/20 transition-colors"
              >
                <div className="truncate flex items-center gap-2">
                  <span className="truncate text-white/90">{ing.name}</span>
                  {ing.price !== undefined && (
                    <span className="text-xs text-purple-300">${ing.price}</span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="ml-2 bg-orange-500 text-white hover:bg-orange-600"
                  onClick={() => {
                    onAdd(ing);
                    onClose();
                  }}
                >Agregar</Button>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="bg-[#222] border-[#444] text-white/80 hover:bg-[#333] w-full"
            onClick={onClose}
          >Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

