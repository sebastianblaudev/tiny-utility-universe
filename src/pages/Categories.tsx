import React, { useState, useEffect } from 'react';
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash, Save, Tag } from "lucide-react";
import { toast } from '@/components/ui/use-toast';
import { initDB } from '@/lib/db';
import type { Category } from '@/lib/db';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    color: '#000000'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const db = await initDB();
      const allCategories = await db.getAll('categories');
      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive"
      });
    }
  };

  const handleAddCategory = async () => {
    try {
      const db = await initDB();
      const id = `cat_${Date.now()}`;
      const categoryData = {
        ...newCategory,
        id,
      } as Category;
      
      await db.add('categories', categoryData);
      
      toast({
        title: "Categoría agregada exitosamente"
      });
      
      setNewCategory({ name: '', color: '#000000' });
      loadCategories();
    } catch (error) {
      toast({
        title: "Error al agregar la categoría",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCategory = async (category: Category) => {
    try {
      const db = await initDB();
      await db.put('categories', category);
      toast({
        title: "Categoría actualizada exitosamente"
      });
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      toast({
        title: "Error al actualizar la categoría",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const db = await initDB();
      await db.delete('categories', id);
      toast({
        title: "Categoría eliminada exitosamente"
      });
      loadCategories();
    } catch (error) {
      toast({
        title: "Error al eliminar la categoría",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 bg-black text-white min-h-screen font-sans">
      <BackButton />
      
      <Card className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-wide text-white">Nueva Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-5 md:flex-row">
            <Input
              placeholder="Nombre de la categoría"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="bg-neutral-800 border border-neutral-700 text-white placeholder-gray-400 rounded-md shadow-inner"
            />
            <Input
              type="color"
              value={newCategory.color}
              onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              className="w-20 h-10 p-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-inner"
            />
            <Button 
              onClick={handleAddCategory} 
              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-md py-3 hover:opacity-90 transition w-full md:w-auto flex items-center justify-center gap-2"
            >
              <Plus className="mr-1" size={18} />
              Agregar Categoría
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-wide text-white flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categorías
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="bg-neutral-800 rounded-lg overflow-hidden shadow-xl border border-neutral-700">
            <TableHeader>
              <TableRow className="border-b border-neutral-700 hover:bg-neutral-700/40 transition-colors duration-300">
                <TableHead className="text-white tracking-wide">Nombre</TableHead>
                <TableHead className="text-white tracking-wide">Color</TableHead>
                <TableHead className="text-white tracking-wide">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow 
                  key={category.id} 
                  className="border-b border-neutral-700 hover:bg-neutral-700/40 transition-colors duration-300"
                >
                  <TableCell>
                    {editingCategory?.id === category.id ? (
                      <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        className="bg-neutral-800 border border-neutral-700 text-white rounded-md"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-white">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingCategory?.id === category.id ? (
                      <Input
                        type="color"
                        value={editingCategory.color}
                        onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                        className="w-20 h-8 p-1 bg-neutral-800 border border-neutral-700 rounded-md"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-white">
                        <span>{category.color}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {editingCategory?.id === category.id ? (
                        <Button 
                          onClick={() => handleUpdateCategory(editingCategory)}
                          className="bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-md py-2 px-4 hover:opacity-90 transition"
                        >
                          <Save className="mr-2" size={18} />
                          Guardar
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => setEditingCategory(category)}
                          className="bg-neutral-800 text-white hover:bg-purple-700 rounded-md"
                        >
                          <Edit className="mr-2" size={18} />
                          Editar
                        </Button>
                      )}
                      <Button 
                        variant="destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="bg-red-700 text-white hover:bg-red-800 rounded-md"
                      >
                        <Trash className="mr-2" size={18} />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
