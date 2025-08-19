
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Edit, Trash2, Plus, Search, AlertTriangle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { PageTitle } from '@/components/ui/page-title';
import { Ingredient, getIngredients, addIngredient, updateIngredient, deleteIngredient } from '@/utils/ingredientUtils';

const Ingredientes = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState<Ingredient>({
    name: '',
    stock: 0,
    unit: 'g',
    reorder_level: 0,
  });

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const data = await getIngredients();
      setIngredients(data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast.error('Error al cargar ingredientes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'stock' || name === 'reorder_level') {
      // Convert to number and ensure it's not negative
      const numValue = Math.max(0, parseInt(value) || 0);
      setFormData({ ...formData, [name]: numValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddIngredient = async () => {
    try {
      const { success, error } = await addIngredient(formData);
      
      if (success) {
        toast.success('Ingrediente añadido correctamente');
        resetForm();
        setShowDialog(false);
        fetchIngredients();
      } else {
        toast.error(`Error: ${error}`);
      }
    } catch (error) {
      console.error('Error adding ingredient:', error);
      toast.error('Error al añadir ingrediente');
    }
  };

  const handleUpdateIngredient = async () => {
    if (!currentIngredient?.id) return;
    
    try {
      const { success, error } = await updateIngredient(currentIngredient.id, formData);
      
      if (success) {
        toast.success('Ingrediente actualizado correctamente');
        resetForm();
        setShowDialog(false);
        fetchIngredients();
      } else {
        toast.error(`Error: ${error}`);
      }
    } catch (error) {
      console.error('Error updating ingredient:', error);
      toast.error('Error al actualizar ingrediente');
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este ingrediente?')) return;
    
    try {
      const { success, error } = await deleteIngredient(id);
      
      if (success) {
        toast.success('Ingrediente eliminado correctamente');
        fetchIngredients();
      } else {
        toast.error(`Error: ${error}`);
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      toast.error('Error al eliminar ingrediente');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      stock: 0,
      unit: 'g',
      reorder_level: 0,
    });
    setCurrentIngredient(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (ingredient: Ingredient) => {
    setCurrentIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      stock: ingredient.stock || 0,
      unit: ingredient.unit || 'g',
      reorder_level: ingredient.reorder_level || 0,
    });
    setShowDialog(true);
  };

  const filteredIngredients = ingredients.filter(ingredient => 
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6">
      <PageTitle 
        title="Gestión de Ingredientes" 
        description="Administra los ingredientes de tus productos"
      />
      
      <div className="mb-6 flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Buscar ingredientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2" size={16} />
          Añadir ingrediente
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Nivel de reorden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Cargando ingredientes...</TableCell>
              </TableRow>
            ) : filteredIngredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  {searchTerm ? 'No se encontraron ingredientes con ese nombre' : 'No hay ingredientes registrados'}
                </TableCell>
              </TableRow>
            ) : (
              filteredIngredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>{ingredient.stock || 0} {ingredient.unit || 'g'}</TableCell>
                  <TableCell>{ingredient.unit || 'g'}</TableCell>
                  <TableCell>{ingredient.reorder_level || 0} {ingredient.unit || 'g'}</TableCell>
                  <TableCell>
                    {ingredient.stock !== undefined && ingredient.reorder_level !== undefined && 
                      ingredient.stock < ingredient.reorder_level ? (
                      <div className="flex items-center text-amber-600">
                        <AlertTriangle size={16} className="mr-1" />
                        <span>Stock bajo</span>
                      </div>
                    ) : (
                      <span className="text-green-600">Normal</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(ingredient)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteIngredient(ingredient.id!)}>
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentIngredient ? 'Editar Ingrediente' : 'Añadir Ingrediente'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">Nombre</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nombre del ingrediente"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="stock" className="text-sm font-medium">Stock</label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="Cantidad disponible"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="unit" className="text-sm font-medium">Unidad</label>
                <Input
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  placeholder="Unidad (g, kg, L, etc.)"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="reorder_level" className="text-sm font-medium">
                Nivel de reorden
                <span className="text-gray-400 text-xs ml-1">(Alerta de stock bajo)</span>
              </label>
              <Input
                id="reorder_level"
                name="reorder_level"
                type="number"
                min="0"
                value={formData.reorder_level}
                onChange={handleInputChange}
                placeholder="Cantidad mínima"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={currentIngredient ? handleUpdateIngredient : handleAddIngredient}>
              {currentIngredient ? 'Actualizar' : 'Añadir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ingredientes;
