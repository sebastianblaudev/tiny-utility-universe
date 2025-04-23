
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Utensils } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type Ingredient = {
  id: string;
  name: string;
  quantity: number;
  stock?: number;
};

export type ProductIngredient = {
  id: string;
  name: string;
  quantity: number;
};

interface EditProductIngredientsModalProps {
  open: boolean;
  onClose: () => void;
  productIngredients?: ProductIngredient[];
  onSave: (ingredients: ProductIngredient[]) => void;
}

function getIngredientsFromStorage(): Ingredient[] {
  console.log("Obteniendo ingredientes del localStorage para el modal");
  const stored = localStorage.getItem("ingredients");
  const ingredients = stored ? JSON.parse(stored) : [];
  console.log("Ingredientes obtenidos:", ingredients);
  return ingredients;
}

export const EditProductIngredientsModal: React.FC<EditProductIngredientsModalProps> = ({
  open,
  onClose,
  productIngredients,
  onSave
}) => {
  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([]);
  const [selectedIng, setSelectedIng] = useState<ProductIngredient[]>(productIngredients || []);

  useEffect(() => {
    if (open) {
      const ingredients = getIngredientsFromStorage();
      console.log("Modal abierto, ingredientes cargados:", ingredients);
      setIngredientsList(ingredients);
    }
  }, [open]);

  // Keep selection in sync
  useEffect(() => {
    setSelectedIng(productIngredients || []);
  }, [productIngredients, open]);

  const handleAddOrUpdate = (ingredient: Ingredient) => {
    console.log("Añadiendo ingrediente al producto:", ingredient);
    const exists = selectedIng.find(i => i.id === ingredient.id);
    if (!exists) {
      setSelectedIng([...selectedIng, { ...ingredient, quantity: 1 }]);
    }
  };

  const handleChangeQty = (id: string, qty: number) => {
    console.log(`Cambiando cantidad de ingrediente ${id} a ${qty}g`);
    if (qty <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive"
      });
      return;
    }
    setSelectedIng(selectedIng.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const handleRemove = (id: string) => {
    console.log("Eliminando ingrediente del producto:", id);
    setSelectedIng(selectedIng.filter(i => i.id !== id));
  };

  const handleSave = () => {
    console.log("Guardando ingredientes del producto:", selectedIng);
    onSave(selectedIng);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Utensils size={20} />
              Ingredientes del producto
            </div>
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="text-sm mb-2">Selecciona ingredientes y cantidades en gramos:</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {ingredientsList.map(ing => (
              <Button
                key={ing.id}
                type="button"
                variant={selectedIng.some(i => i.id === ing.id) ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleAddOrUpdate(ing)}
                disabled={selectedIng.some(i => i.id === ing.id)}
              >
                {ing.name} {ing.stock !== undefined ? `(${ing.stock}g disp.)` : ''}
              </Button>
            ))}
          </div>
          <div className="mb-2">
            {selectedIng.length === 0 && (
              <div className="text-muted-foreground text-xs">Aún no hay ingredientes asignados.</div>
            )}
            <ul className="space-y-2">
              {selectedIng.map(ing => (
                <li key={ing.id} className="flex items-center gap-3">
                  <span className="w-24 truncate">{ing.name}</span>
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={ing.quantity}
                    onChange={e => handleChangeQty(ing.id, Number(e.target.value))}
                  />
                  <span>g</span>
                  <Button size="sm" variant="ghost" onClick={() => handleRemove(ing.id)}>Quitar</Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSave}
          >
            Guardar Ingredientes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
