
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/ui/page-title';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllCashiers, addCashier, updateCashier, deleteCashier } from '@/utils/cashRegisterUtils';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Pencil, Save, Trash2, X, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import TurnosList from '@/components/turnos/TurnosList';
import CashierRegistration from '@/components/cashier/CashierRegistration';

const Turnos = () => {
  const { tenantId } = useAuth();
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCashier, setEditingCashier] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    if (tenantId) {
      loadCashiers();
    }
  }, [tenantId]);

  const loadCashiers = async () => {
    setLoading(true);
    try {
      const cashiersList = await getAllCashiers(tenantId || '');
      setCashiers(cashiersList || []);
    } catch (error) {
      console.error("Error loading cashiers:", error);
      toast.error("Error al cargar los cajeros");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCashier = async (name: string) => {
    try {
      const newCashier = await addCashier(tenantId || '', name);
      if (newCashier) {
        toast.success(`Cajero "${name}" agregado correctamente`);
        loadCashiers();
      }
    } catch (error) {
      console.error("Error adding cashier:", error);
      toast.error("Error al agregar el cajero");
    }
  };

  const startEditing = (cashier: any) => {
    setEditingCashier(cashier.id);
    setEditedName(cashier.name);
  };

  const cancelEditing = () => {
    setEditingCashier(null);
    setEditedName('');
  };

  const handleUpdateCashier = async (id: string) => {
    if (!editedName.trim()) {
      toast.error("El nombre del cajero no puede estar vacío");
      return;
    }
    
    try {
      const updated = await updateCashier(id, editedName);
      if (updated) {
        toast.success("Cajero actualizado correctamente");
        cancelEditing();
        loadCashiers();
      }
    } catch (error) {
      console.error("Error updating cashier:", error);
      toast.error("Error al actualizar el cajero");
    }
  };

  const handleDeleteCashier = async (id: string) => {
    try {
      const deleted = await deleteCashier(id);
      if (deleted) {
        toast.success("Cajero eliminado correctamente");
        loadCashiers();
      }
    } catch (error) {
      console.error("Error deleting cashier:", error);
      toast.error("Error al eliminar el cajero");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <PageTitle 
          title="Gestión de Turnos" 
          description="Administre la apertura y cierre de turnos de los cajeros"
        />

        <Tabs defaultValue="turnos" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="turnos">Turnos</TabsTrigger>
            <TabsTrigger value="cashiers">Cajeros</TabsTrigger>
          </TabsList>

          <TabsContent value="turnos" className="h-full">
            <TurnosList />
          </TabsContent>

          <TabsContent value="cashiers">
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pr-4">
                <div>
                  <CashierRegistration onSuccess={loadCashiers} />
                </div>

                <div className="md:col-span-2">
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-medium">Lista de Cajeros</h3>
                      <div className="mt-4">
                        {loading ? (
                          <p className="text-center py-4 text-muted-foreground">Cargando cajeros...</p>
                        ) : (
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nombre</TableHead>
                                  <TableHead className="w-[120px]">Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cashiers.length > 0 ? (
                                  cashiers.map(cashier => (
                                    <TableRow key={cashier.id}>
                                      <TableCell>
                                        {editingCashier === cashier.id ? (
                                          <div className="flex gap-2">
                                            <Input
                                              value={editedName}
                                              onChange={(e) => setEditedName(e.target.value)}
                                              className="h-8"
                                              autoFocus
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex items-center">
                                            <UserRound className="h-4 w-4 mr-2 text-muted-foreground" />
                                            {cashier.name}
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {editingCashier === cashier.id ? (
                                          <div className="flex gap-2">
                                            <Button 
                                              onClick={() => handleUpdateCashier(cashier.id)} 
                                              size="sm" 
                                              variant="ghost"
                                            >
                                              <Save className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                              onClick={cancelEditing} 
                                              size="sm" 
                                              variant="ghost"
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex gap-2">
                                            <Button 
                                              onClick={() => startEditing(cashier)} 
                                              size="sm" 
                                              variant="ghost"
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                              onClick={() => handleDeleteCashier(cashier.id)} 
                                              size="sm" 
                                              variant="ghost" 
                                              className="text-destructive"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-center py-4">
                                      <div className="flex flex-col items-center py-4">
                                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground text-sm">No hay cajeros registrados</p>
                                        <p className="text-muted-foreground text-xs mt-1">Registre nuevos cajeros usando el formulario</p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Turnos;
