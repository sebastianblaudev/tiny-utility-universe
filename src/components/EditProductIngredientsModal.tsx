
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Utensils, AlertTriangle, Info, Package } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  ingredientsBySize?: {
    [size: string]: ProductIngredient[];
  };
  availableSizes?: string[];
  onSave: (ingredients: ProductIngredient[], ingredientsBySize?: {
    [size: string]: ProductIngredient[];
  }) => void;
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
  ingredientsBySize,
  availableSizes = ['personal', 'mediana', 'familiar'],
  onSave
}) => {
  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([]);
  const [selectedIng, setSelectedIng] = useState<ProductIngredient[]>(productIngredients || []);
  const [selectedSize, setSelectedSize] = useState<string>('general');
  const [sizeIngredients, setSizeIngredients] = useState<{
    [size: string]: ProductIngredient[];
  }>({});
  const lowStockThreshold = 200;
  const criticalStockThreshold = 100;

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
    
    // Initialize size ingredients from props
    if (ingredientsBySize) {
      setSizeIngredients(ingredientsBySize);
    } else {
      // Reset to empty object if no ingredientsBySize provided
      const emptyIngredients = {};
      availableSizes.forEach(size => {
        emptyIngredients[size] = [];
      });
      setSizeIngredients(emptyIngredients);
    }
  }, [productIngredients, ingredientsBySize, open, availableSizes]);

  const handleAddOrUpdate = (ingredient: Ingredient) => {
    console.log("Añadiendo ingrediente al producto:", ingredient);
    
    if (selectedSize === 'general') {
      // Add to general ingredients
      const exists = selectedIng.find(i => i.id === ingredient.id);
      if (!exists) {
        setSelectedIng([...selectedIng, { ...ingredient, quantity: 1 }]);
      }
    } else {
      // Add to size-specific ingredients
      const sizeSpecificIngredients = sizeIngredients[selectedSize] || [];
      const exists = sizeSpecificIngredients.find(i => i.id === ingredient.id);
      if (!exists) {
        const updatedSizeIngredients = {
          ...sizeIngredients,
          [selectedSize]: [...sizeSpecificIngredients, { ...ingredient, quantity: 1 }]
        };
        setSizeIngredients(updatedSizeIngredients);
      }
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
    
    if (selectedSize === 'general') {
      setSelectedIng(selectedIng.map(i => i.id === id ? { ...i, quantity: qty } : i));
    } else {
      const sizeSpecificIngredients = sizeIngredients[selectedSize] || [];
      const updatedIngredients = sizeSpecificIngredients.map(i => 
        i.id === id ? { ...i, quantity: qty } : i
      );
      
      setSizeIngredients({
        ...sizeIngredients,
        [selectedSize]: updatedIngredients
      });
    }
  };

  const handleRemove = (id: string) => {
    console.log("Eliminando ingrediente del producto:", id);
    
    if (selectedSize === 'general') {
      setSelectedIng(selectedIng.filter(i => i.id !== id));
    } else {
      const sizeSpecificIngredients = sizeIngredients[selectedSize] || [];
      const updatedIngredients = sizeSpecificIngredients.filter(i => i.id !== id);
      
      setSizeIngredients({
        ...sizeIngredients,
        [selectedSize]: updatedIngredients
      });
    }
  };

  const handleSave = () => {
    console.log("Guardando ingredientes del producto:", selectedIng);
    console.log("Guardando ingredientes por tamaño:", sizeIngredients);
    onSave(selectedIng, sizeIngredients);
    onClose();
  };
  
  const getStockStatus = (ingredientId: string) => {
    const ingredient = ingredientsList.find(ing => ing.id === ingredientId);
    if (!ingredient || ingredient.stock === undefined) return null;
    
    if (ingredient.stock <= criticalStockThreshold) {
      return { label: "Crítico", variant: "destructive", icon: <AlertTriangle size={14} className="mr-1 text-red-500" /> };
    } else if (ingredient.stock <= lowStockThreshold) {
      return { label: "Bajo", variant: "outline", icon: <Info size={14} className="mr-1 text-yellow-500" /> };
    }
    
    return null;
  };
  
  // Function to check if ingredient quantity exceeds stock
  const isInsufficientStock = (ingredientId: string, requiredQuantity: number) => {
    const ingredient = ingredientsList.find(ing => ing.id === ingredientId);
    if (!ingredient || ingredient.stock === undefined) return false;
    
    return requiredQuantity > ingredient.stock;
  };

  // Get the current ingredients list based on the selected size
  const getCurrentIngredients = () => {
    if (selectedSize === 'general') {
      return selectedIng;
    } else {
      return sizeIngredients[selectedSize] || [];
    }
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
          {/* Size selector */}
          <div className="mb-4">
            <label className="text-sm mb-1 block">Seleccionar tamaño:</label>
            <Select 
              value={selectedSize} 
              onValueChange={setSelectedSize}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tamaño" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General (Todos los tamaños)</SelectItem>
                {availableSizes.map(size => (
                  <SelectItem key={size} value={size}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSize !== 'general' && (
              <p className="text-xs text-muted-foreground mt-1">
                Los ingredientes específicos por tamaño tienen prioridad sobre los generales.
              </p>
            )}
          </div>

          <div className="text-sm mb-2">Selecciona ingredientes y cantidades en gramos:</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {ingredientsList.map(ing => {
              const stockStatus = getStockStatus(ing.id);
              const currentIngredients = getCurrentIngredients();
              
              return (
                <Button
                  key={ing.id}
                  type="button"
                  variant={currentIngredients.some(i => i.id === ing.id) ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleAddOrUpdate(ing)}
                  disabled={currentIngredients.some(i => i.id === ing.id)}
                  className={`flex items-center gap-1 ${stockStatus?.variant === "destructive" ? "border-red-600 text-red-500" : ""}`}
                >
                  {ing.name} 
                  {stockStatus && (
                    <span className="ml-1 flex items-center">
                      {stockStatus.icon}
                    </span>
                  )}
                  <span className="text-xs ml-1">({ing.stock !== undefined ? `${ing.stock}g` : 'N/A'})</span>
                </Button>
              );
            })}
          </div>
          <div className="mb-2">
            {getCurrentIngredients().length === 0 && (
              <div className="text-muted-foreground text-xs">
                {selectedSize === 'general' 
                  ? "No hay ingredientes generales asignados." 
                  : `No hay ingredientes específicos para el tamaño ${selectedSize}.`}
              </div>
            )}
            <ul className="space-y-2">
              {getCurrentIngredients().map(ing => {
                const stockStatus = getStockStatus(ing.id);
                const insufficientStock = isInsufficientStock(ing.id, ing.quantity);
                const stockInfo = ingredientsList.find(i => i.id === ing.id)?.stock;
                
                return (
                  <li key={ing.id} className="flex items-center gap-3">
                    <span className="w-24 truncate">{ing.name}</span>
                    <Input
                      type="number"
                      min={1}
                      className={`w-20 ${insufficientStock ? 'border-red-600' : ''}`}
                      value={ing.quantity}
                      onChange={e => handleChangeQty(ing.id, Number(e.target.value))}
                    />
                    <span>g</span>
                    
                    {stockInfo !== undefined && (
                      <div className="flex items-center gap-1">
                        <Package size={14} />
                        <span className="text-xs">{stockInfo}g</span>
                        
                        {insufficientStock && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle size={10} className="mr-1" />
                            Insuficiente
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <Button size="sm" variant="ghost" onClick={() => handleRemove(ing.id)}>Quitar</Button>
                  </li>
                );
              })}
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
