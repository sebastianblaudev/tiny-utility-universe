
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Utensils, AlertTriangle, Info, Package, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  sizeQuantities?: {
    personal?: number;
    mediana?: number;
    familiar?: number;
    [key: string]: number | undefined;
  };
};

interface EditProductIngredientsModalProps {
  open: boolean;
  onClose: () => void;
  productIngredients?: ProductIngredient[];
  onSave: (ingredients: ProductIngredient[]) => void;
  isPizza?: boolean;
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
  onSave,
  isPizza = false
}) => {
  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([]);
  const [selectedIng, setSelectedIng] = useState<ProductIngredient[]>(productIngredients || []);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [showAdvanced, setShowAdvanced] = useState<{ [key: string]: boolean }>({});
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
  }, [productIngredients, open]);

  const handleAddOrUpdate = (ingredient: Ingredient) => {
    console.log("Añadiendo ingrediente al producto:", ingredient);
    const exists = selectedIng.find(i => i.id === ingredient.id);
    if (!exists) {
      setSelectedIng([...selectedIng, { 
        ...ingredient, 
        quantity: 1,
        sizeQuantities: isPizza ? { personal: 1, mediana: 1.5, familiar: 2 } : undefined
      }]);
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

  const handleChangeSizeQty = (id: string, size: string, qty: number) => {
    console.log(`Cambiando cantidad de ingrediente ${id} para tamaño ${size} a ${qty}g`);
    if (qty <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive"
      });
      return;
    }

    setSelectedIng(selectedIng.map(i => {
      if (i.id === id) {
        return { 
          ...i, 
          sizeQuantities: {
            ...(i.sizeQuantities || {}),
            [size]: qty
          }
        };
      }
      return i;
    }));
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

  const toggleAdvanced = (id: string) => {
    setShowAdvanced(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose(); }}>
      <DialogContent className="max-w-xl">
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
            {ingredientsList.map(ing => {
              const stockStatus = getStockStatus(ing.id);
              
              return (
                <Button
                  key={ing.id}
                  type="button"
                  variant={selectedIng.some(i => i.id === ing.id) ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleAddOrUpdate(ing)}
                  disabled={selectedIng.some(i => i.id === ing.id)}
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
          
          {isPizza && selectedIng.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="mediana">Mediana</TabsTrigger>
                <TabsTrigger value="familiar">Familiar</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          
          {selectedIng.length === 0 && (
            <div className="text-muted-foreground text-xs">Aún no hay ingredientes asignados.</div>
          )}
          
          {isPizza ? (
            <TabsContent value="general" className="mt-0">
              <ul className="space-y-2">
                {selectedIng.map(ing => {
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
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="ml-auto h-7 w-7 p-0"
                        onClick={() => toggleAdvanced(ing.id)}
                      >
                        {showAdvanced[ing.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </TabsContent>
          ) : (
            <ul className="space-y-2">
              {selectedIng.map(ing => {
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
          )}
          
          {isPizza && (
            <>
              <TabsContent value="personal" className="mt-0">
                <ul className="space-y-2">
                  {selectedIng.map(ing => {
                    const qty = ing.sizeQuantities?.personal || ing.quantity;
                    const insufficientStock = isInsufficientStock(ing.id, qty);
                    
                    return (
                      <li key={ing.id} className="flex items-center gap-3">
                        <span className="w-24 truncate">{ing.name}</span>
                        <Input
                          type="number"
                          min={1}
                          className={`w-20 ${insufficientStock ? 'border-red-600' : ''}`}
                          value={qty}
                          onChange={e => handleChangeSizeQty(ing.id, 'personal', Number(e.target.value))}
                        />
                        <span>g</span>
                        <Button size="sm" variant="ghost" onClick={() => handleRemove(ing.id)}>Quitar</Button>
                      </li>
                    );
                  })}
                </ul>
              </TabsContent>
              
              <TabsContent value="mediana" className="mt-0">
                <ul className="space-y-2">
                  {selectedIng.map(ing => {
                    const qty = ing.sizeQuantities?.mediana || Math.round(ing.quantity * 1.5);
                    const insufficientStock = isInsufficientStock(ing.id, qty);
                    
                    return (
                      <li key={ing.id} className="flex items-center gap-3">
                        <span className="w-24 truncate">{ing.name}</span>
                        <Input
                          type="number"
                          min={1}
                          className={`w-20 ${insufficientStock ? 'border-red-600' : ''}`}
                          value={qty}
                          onChange={e => handleChangeSizeQty(ing.id, 'mediana', Number(e.target.value))}
                        />
                        <span>g</span>
                        <Button size="sm" variant="ghost" onClick={() => handleRemove(ing.id)}>Quitar</Button>
                      </li>
                    );
                  })}
                </ul>
              </TabsContent>
              
              <TabsContent value="familiar" className="mt-0">
                <ul className="space-y-2">
                  {selectedIng.map(ing => {
                    const qty = ing.sizeQuantities?.familiar || Math.round(ing.quantity * 2);
                    const insufficientStock = isInsufficientStock(ing.id, qty);
                    
                    return (
                      <li key={ing.id} className="flex items-center gap-3">
                        <span className="w-24 truncate">{ing.name}</span>
                        <Input
                          type="number"
                          min={1}
                          className={`w-20 ${insufficientStock ? 'border-red-600' : ''}`}
                          value={qty}
                          onChange={e => handleChangeSizeQty(ing.id, 'familiar', Number(e.target.value))}
                        />
                        <span>g</span>
                        <Button size="sm" variant="ghost" onClick={() => handleRemove(ing.id)}>Quitar</Button>
                      </li>
                    );
                  })}
                </ul>
              </TabsContent>
            </>
          )}
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
