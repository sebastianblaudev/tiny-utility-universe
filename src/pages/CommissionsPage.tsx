
import React, { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { useBarber } from '../contexts/BarberContext';
import { BarberCommission } from '../types/financial';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CommissionsPage = () => {
  const { barberCommissions, addBarberCommission, updateBarberCommission, deleteBarberCommission } = useFinancial();
  const { barbers, services, categories } = useBarber();
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<BarberCommission | null>(null);
  
  const [newCommission, setNewCommission] = useState({
    barberId: '',
    percentage: 50,
    serviceId: '',
    categoryId: '',
  });
  
  const resetForm = () => {
    setNewCommission({
      barberId: '',
      percentage: 50,
      serviceId: '',
      categoryId: '',
    });
    setEditingCommission(null);
  };
  
  const handleAddCommission = () => {
    if (!newCommission.barberId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un barbero",
        variant: "destructive"
      });
      return;
    }
    
    if (newCommission.percentage < 0 || newCommission.percentage > 100) {
      toast({
        title: "Error",
        description: "El porcentaje debe estar entre 0 y 100",
        variant: "destructive"
      });
      return;
    }
    
    // Find the barber name
    const barber = barbers.find(b => b.id === newCommission.barberId);
    
    const commissionToAdd = {
      ...newCommission,
      barberName: barber ? barber.name : undefined,
    };
    
    if (editingCommission) {
      updateBarberCommission({
        ...commissionToAdd,
        id: editingCommission.id,
      });
    } else {
      addBarberCommission(commissionToAdd);
    }
    
    resetForm();
    setIsAddDialogOpen(false);
  };
  
  const handleEditCommission = (commission: BarberCommission) => {
    setEditingCommission(commission);
    setNewCommission({
      barberId: commission.barberId,
      percentage: commission.percentage,
      serviceId: commission.serviceId || '',
      categoryId: commission.categoryId || '',
    });
    setIsAddDialogOpen(true);
  };
  
  const handleDeleteCommission = (id: string) => {
    deleteBarberCommission(id);
  };
  
  const getBarberName = (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    return barber ? barber.name : `Barbero ${barberId}`;
  };
  
  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Todos los servicios';
  };
  
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Todas las categorías';
  };
  
  const renderCommissionScope = (commission: BarberCommission) => {
    if (commission.serviceId) {
      return `Servicio: ${getServiceName(commission.serviceId)}`;
    } else if (commission.categoryId) {
      return `Categoría: ${getCategoryName(commission.categoryId)}`;
    } else {
      return 'Todos los servicios';
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Comisiones</h1>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Comisión
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Comisiones de Barberos</CardTitle>
          <CardDescription>Gestiona los porcentajes de comisión para cada barbero y servicio</CardDescription>
        </CardHeader>
        <CardContent>
          {barberCommissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barbero</TableHead>
                  <TableHead>Alcance</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barberCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">
                      {commission.barberName || getBarberName(commission.barberId)}
                    </TableCell>
                    <TableCell>{renderCommissionScope(commission)}</TableCell>
                    <TableCell>{commission.percentage}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditCommission(commission)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar comisión?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la comisión del barbero {commission.barberName || getBarberName(commission.barberId)}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCommission(commission.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No hay comisiones configuradas. Haga clic en "Nueva Comisión" para añadir una.
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCommission ? 'Editar Comisión' : 'Añadir Nueva Comisión'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="barberId">Barbero</Label>
              <Select 
                value={newCommission.barberId} 
                onValueChange={(value) => setNewCommission({...newCommission, barberId: value})}
              >
                <SelectTrigger id="barberId">
                  <SelectValue placeholder="Seleccionar barbero" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scope">Alcance</Label>
              <Select 
                value={newCommission.serviceId ? 'service' : (newCommission.categoryId ? 'category' : 'all')}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setNewCommission({...newCommission, serviceId: '', categoryId: ''});
                  }
                }}
              >
                <SelectTrigger id="scope">
                  <SelectValue placeholder="Seleccionar alcance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los servicios</SelectItem>
                  <SelectItem value="category">Por categoría</SelectItem>
                  <SelectItem value="service">Por servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newCommission.serviceId || newCommission.categoryId ? (
              <div className="space-y-2">
                {newCommission.serviceId ? (
                  <>
                    <Label htmlFor="serviceId">Servicio</Label>
                    <Select 
                      value={newCommission.serviceId} 
                      onValueChange={(value) => setNewCommission({...newCommission, serviceId: value, categoryId: ''})}
                    >
                      <SelectTrigger id="serviceId">
                        <SelectValue placeholder="Seleccionar servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Label htmlFor="categoryId">Categoría</Label>
                    <Select 
                      value={newCommission.categoryId} 
                      onValueChange={(value) => setNewCommission({...newCommission, categoryId: value, serviceId: ''})}
                    >
                      <SelectTrigger id="categoryId">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            ) : null}
            
            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentaje (%)</Label>
              <div className="flex items-center">
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={newCommission.percentage}
                  onChange={(e) => setNewCommission({...newCommission, percentage: parseInt(e.target.value) || 0})}
                  className="flex-1"
                />
                <Percent className="ml-2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCommission}>
              {editingCommission ? 'Actualizar' : 'Añadir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionsPage;
