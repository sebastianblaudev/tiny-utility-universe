import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, Trash, Edit, Save, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { startAutoBackup, stopAutoBackup } from "@/utils/autoBackup";
import { BackButton } from "@/components/BackButton";

type Ingredient = {
  id: string;
  name: string;
  stock: number; // stock actual en gramos
};

function getIngredientsFromStorage(): Ingredient[] {
  const stored = localStorage.getItem("ingredients");
  return stored
    ? JSON.parse(stored).map((i: any) => ({
        id: i.id,
        name: i.name,
        stock: i.stock !== undefined ? i.stock : 0,
      }))
    : [];
}

function saveIngredientsToStorage(ingredients: Ingredient[]) {
  localStorage.setItem("ingredients", JSON.stringify(ingredients));
}

const Ingredients: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [name, setName] = useState("");
  const [stock, setStock] = useState<number | "">("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStock, setEditStock] = useState<number | "">("");

  useEffect(() => {
    startAutoBackup(10);
    return () => {
      stopAutoBackup();
    };
  }, []);

  const loadIngredients = () => {
    const loadedIngredients = getIngredientsFromStorage();
    setIngredients(loadedIngredients);
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const handleAddIngredient = () => {
    if (!name.trim() || !stock || Number(stock) <= 0) {
      toast({
        title: "Error",
        description: "El nombre y el stock son obligatorios y deben ser mayores a 0",
        variant: "destructive"
      });
      return;
    }
    const newIngredient: Ingredient = {
      id: crypto.randomUUID(),
      name: name.trim(),
      stock: Number(stock)
    };

    const updated = [...ingredients, newIngredient];
    setIngredients(updated);
    saveIngredientsToStorage(updated);
    setName("");
    setStock("");

    toast({
      title: "Ingrediente agregado",
      description: `${name} ha sido agregado con éxito`,
    });
  };

  const handleRemove = (id: string) => {
    const updated = ingredients.filter(i => i.id !== id);
    setIngredients(updated);
    saveIngredientsToStorage(updated);

    toast({
      title: "Ingrediente eliminado",
      description: "El ingrediente ha sido eliminado con éxito",
    });
  };

  const startEdit = (ingredient: Ingredient) => {
    setEditId(ingredient.id);
    setEditName(ingredient.name);
    setEditStock(ingredient.stock || 0);
  };

  const handleEditSave = (id: string) => {
    if (!editName.trim() || !editStock || Number(editStock) < 0) {
      toast({
        title: "Error",
        description: "El nombre y el stock son obligatorios y deben ser valores válidos",
        variant: "destructive"
      });
      return;
    }
    const updated = ingredients.map(ing =>
      ing.id === id
        ? {
            ...ing,
            name: editName.trim(),
            stock: Number(editStock)
          }
        : ing
    );

    setIngredients(updated);
    saveIngredientsToStorage(updated);
    setEditId(null);

    toast({
      title: "Ingrediente actualizado",
      description: `${editName} ha sido actualizado con éxito`,
    });
  };

  const handleAdjustStock = (id: string, amount: number) => {
    const updated = ingredients.map(ing => {
      if (ing.id === id) {
        const newStock = Math.max(0, ing.stock + amount);
        return { ...ing, stock: newStock };
      }
      return ing;
    });

    setIngredients(updated);
    saveIngredientsToStorage(updated);

    toast({
      title: "Stock actualizado",
      description: `El stock ha sido ${amount > 0 ? "incrementado" : "reducido"} con éxito`,
    });
  };

  const handleRefresh = () => {
    loadIngredients();
    toast({
      title: "Stock actualizado",
      description: "Se ha actualizado la información de stock",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-4 relative min-h-screen">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <h1 className="text-3xl font-bold text-white">Gestión de Ingredientes</h1>
        </div>
        <div className="max-w-2xl mx-auto mt-0">
          <Card className="bg-[#111111] border-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-950">
              <div className="flex items-center gap-2">
                <List className="text-orange-500" />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] text-white"
              >
                <RefreshCw size={16} className="mr-2" />
                Actualizar Stock
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {/* Formulario solo con nombre y stock */}
              <form
                className="flex flex-col md:flex-row gap-2 mb-6"
                onSubmit={e => {
                  e.preventDefault();
                  handleAddIngredient();
                }}
              >
                <Input
                  placeholder="Nombre del ingrediente"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="bg-[#1A1A1A] border-[#333333] focus:border-orange-500 text-white placeholder:text-gray-500"
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Stock (g)"
                  value={stock}
                  onChange={e => setStock(Number(e.target.value))}
                  required
                  className="bg-[#1A1A1A] border-[#333333] focus:border-orange-500 text-white placeholder:text-gray-500"
                />
                <Button
                  type="submit"
                  variant="default"
                  className="w-full md:w-auto bg-orange-600 hover:bg-orange-700"
                >
                  Agregar
                </Button>
              </form>
              <div>
                {ingredients.length === 0 ? (
                  <div className="text-white text-center py-4">
                    No hay ingredientes cargados aún.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-2 text-white">Ingrediente</th>
                        <th className="text-left py-2 text-white">Stock (g)</th>
                        <th className="py-2 text-white">Ajustar</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map(ingredient =>
                        editId === ingredient.id ? (
                          <tr key={ingredient.id} className="bg-[#252525]">
                            <td>
                              <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="text-sm bg-[#1A1A1A] border-[#333333] text-white"
                              />
                            </td>
                            <td>
                              <Input
                                type="number"
                                min={0}
                                value={editStock}
                                onChange={e => setEditStock(Number(e.target.value))}
                                className="text-sm bg-[#1A1A1A] border-[#333333] text-white"
                              />
                            </td>
                            <td className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={() => handleEditSave(ingredient.id)}
                              >
                                <Save size={16} className="mr-1" />
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-[#1A1A1A] hover:bg-[#252525] border-[#333333] text-white"
                                onClick={() => setEditId(null)}
                              >
                                Cancelar
                              </Button>
                            </td>
                          </tr>
                        ) : (
                          <tr key={ingredient.id} className="border-b border-zinc-800 hover:bg-[#252525] text-white">
                            <td>{ingredient.name}</td>
                            <td>{ingredient.stock || 0}</td>
                            <td className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] text-white"
                                onClick={() => handleAdjustStock(ingredient.id, 100)}
                              >
                                +100g
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAdjustStock(ingredient.id, -100)}
                                disabled={ingredient.stock < 100}
                              >
                                -100g
                              </Button>
                            </td>
                            <td className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333] text-white"
                                onClick={() => startEdit(ingredient)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemove(ingredient.id)}
                              >
                                <Trash size={16} />
                              </Button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Ingredients;
