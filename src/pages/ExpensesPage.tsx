
import React, { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { OperationalExpense, ExpenseCategory, ExpensePeriodicity } from '../types/financial';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Calendar, DollarSign, Tag } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const ExpensesPage = () => {
  const { operationalExpenses, addOperationalExpense, updateOperationalExpense, deleteOperationalExpense } = useFinancial();
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OperationalExpense | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newExpense, setNewExpense] = useState<Omit<OperationalExpense, 'id'>>({
    branchId: 'main',
    date: new Date(),
    category: 'rent',
    amount: 0,
    description: '',
    recurrent: false,
    periodicity: 'monthly',
  });
  
  const resetForm = () => {
    setNewExpense({
      branchId: 'main',
      date: new Date(),
      category: 'rent',
      amount: 0,
      description: '',
      recurrent: false,
      periodicity: 'monthly',
    });
    setEditingExpense(null);
  };
  
  const handleAddExpense = async () => {
    console.log('Attempting to add expense:', newExpense);
    
    // Validaciones básicas
    if (newExpense.amount <= 0) {
      toast({
        title: "Error de validación",
        description: "El monto debe ser mayor que cero",
        variant: "destructive"
      });
      return;
    }
    
    if (!newExpense.description.trim()) {
      toast({
        title: "Error de validación",
        description: "Debe ingresar una descripción",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Handle recurrent expenses logic
      let expenseData = { ...newExpense };
      
      // Asegurar que los valores son válidos
      expenseData.amount = Number(expenseData.amount);
      expenseData.description = expenseData.description.trim();
      
      if (expenseData.recurrent) {
        expenseData.lastPaid = new Date();
        
        // Calculate next due date based on periodicity
        const nextDue = new Date(expenseData.date);
        switch (expenseData.periodicity) {
          case ExpensePeriodicity.DAILY:
            nextDue.setDate(nextDue.getDate() + 1);
            break;
          case ExpensePeriodicity.WEEKLY:
            nextDue.setDate(nextDue.getDate() + 7);
            break;
          case ExpensePeriodicity.BIWEEKLY:
            nextDue.setDate(nextDue.getDate() + 14);
            break;
          case ExpensePeriodicity.MONTHLY:
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
          case ExpensePeriodicity.QUARTERLY:
            nextDue.setMonth(nextDue.getMonth() + 3);
            break;
          case ExpensePeriodicity.YEARLY:
            nextDue.setFullYear(nextDue.getFullYear() + 1);
            break;
          default:
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
        }
        
        expenseData.nextDue = nextDue;
      } else {
        expenseData.periodicity = undefined;
        expenseData.lastPaid = undefined;
        expenseData.nextDue = undefined;
      }
      
      console.log('Final expense data to be processed:', expenseData);
      
      if (editingExpense) {
        console.log('Updating existing expense...');
        await updateOperationalExpense({
          ...expenseData,
          id: editingExpense.id,
        });
        toast({
          title: "Éxito",
          description: "Gasto actualizado correctamente",
        });
      } else {
        console.log('Adding new expense...');
        await addOperationalExpense(expenseData);
        toast({
          title: "Éxito", 
          description: "Gasto añadido correctamente",
        });
      }
      
      resetForm();
      setIsAddDialogOpen(false);
      
      console.log('Expense operation completed successfully');
    } catch (error) {
      console.error('Error in handleAddExpense:', error);
      
      toast({
        title: "Error",
        description: `No se pudo ${editingExpense ? 'actualizar' : 'registrar'} el gasto. Verifique los datos e intente nuevamente.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditExpense = (expense: OperationalExpense) => {
    setEditingExpense(expense);
    setNewExpense({
      branchId: expense.branchId,
      date: new Date(expense.date),
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      recurrent: expense.recurrent,
      periodicity: expense.periodicity,
      lastPaid: expense.lastPaid,
      nextDue: expense.nextDue,
    });
    setIsAddDialogOpen(true);
  };
  
  const handleDeleteExpense = (id: string) => {
    deleteOperationalExpense(id);
  };
  
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case ExpenseCategory.RENT:
        return 'Arriendo';
      case ExpenseCategory.UTILITIES:
        return 'Servicios Básicos';
      case ExpenseCategory.SUPPLIES:
        return 'Suministros';
      case ExpenseCategory.WAGES:
        return 'Salarios';
      case ExpenseCategory.MAINTENANCE:
        return 'Mantenimiento';
      case ExpenseCategory.MARKETING:
        return 'Marketing';
      case ExpenseCategory.OTHER:
        return 'Otros';
      default:
        return 'Otros';
    }
  };
  
  const getPeriodicityLabel = (periodicity: string) => {
    switch (periodicity) {
      case ExpensePeriodicity.DAILY:
        return 'Diario';
      case ExpensePeriodicity.WEEKLY:
        return 'Semanal';
      case ExpensePeriodicity.BIWEEKLY:
        return 'Quincenal';
      case ExpensePeriodicity.MONTHLY:
        return 'Mensual';
      case ExpensePeriodicity.QUARTERLY:
        return 'Trimestral';
      case ExpensePeriodicity.YEARLY:
        return 'Anual';
      default:
        return 'Mensual';
    }
  };
  
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case ExpenseCategory.RENT:
        return 'bg-red-500';
      case ExpenseCategory.UTILITIES:
        return 'bg-blue-500';
      case ExpenseCategory.SUPPLIES:
        return 'bg-green-500';
      case ExpenseCategory.WAGES:
        return 'bg-purple-500';
      case ExpenseCategory.MAINTENANCE:
        return 'bg-orange-500';
      case ExpenseCategory.MARKETING:
        return 'bg-pink-500';
      case ExpenseCategory.OTHER:
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const filteredExpenses = operationalExpenses.filter(expense => {
    if (activeTab === 'all') {
      return true;
    } else if (activeTab === 'recurrent') {
      return expense.recurrent;
    } else {
      return expense.category === activeTab;
    }
  });
  
  // Calculate total by category
  const expensesByCategory = Object.values(ExpenseCategory).reduce((acc, category) => {
    acc[category] = operationalExpenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate total overall
  const totalExpenses = operationalExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Gastos Operacionales</h1>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {operationalExpenses.length} gastos registrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gastos Recurrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {operationalExpenses.filter(e => e.recurrent).length}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${operationalExpenses.filter(e => e.recurrent).reduce((sum, e) => sum + e.amount, 0).toLocaleString()} en gastos recurrentes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categoría Principal</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(expensesByCategory).length > 0 ? (
              <>
                <div className="flex items-center">
                  <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="text-2xl font-bold">
                    {getCategoryLabel(
                      Object.entries(expensesByCategory)
                        .sort((a, b) => b[1] - a[1])[0][0]
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${Math.max(...Object.values(expensesByCategory)).toLocaleString()} en gastos
                </p>
              </>
            ) : (
              <div className="text-muted-foreground">No hay datos</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="recurrent">Recurrentes</TabsTrigger>
          <TabsTrigger value="rent">Arriendo</TabsTrigger>
          <TabsTrigger value="utilities">Servicios</TabsTrigger>
          <TabsTrigger value="supplies">Suministros</TabsTrigger>
          <TabsTrigger value="wages">Salarios</TabsTrigger>
          <TabsTrigger value="other">Otros</TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>Gastos Operacionales</CardTitle>
            <CardDescription>
              {activeTab === 'all' 
                ? 'Todos los gastos operacionales registrados' 
                : activeTab === 'recurrent'
                  ? 'Gastos recurrentes programados'
                  : `Gastos de categoría: ${getCategoryLabel(activeTab)}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Recurrencia</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {format(new Date(expense.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeColor(expense.category)}>
                          {getCategoryLabel(expense.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        {expense.recurrent ? (
                          <span className="flex items-center">
                            <Badge variant="outline" className="text-blue-500 border-blue-500">
                              {getPeriodicityLabel(expense.periodicity || 'monthly')}
                            </Badge>
                            {expense.nextDue && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                Próximo: {format(new Date(expense.nextDue), 'dd/MM/yyyy')}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Único</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditExpense(expense)}
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
                                <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente el gasto de {expense.description}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>
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
                No hay gastos registrados para la selección actual. Haga clic en "Nuevo Gasto" para añadir uno.
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Editar Gasto Operacional' : 'Añadir Nuevo Gasto'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {newExpense.date
                      ? format(newExpense.date, 'd MMMM yyyy', { locale: es })
                      : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={newExpense.date}
                    onSelect={(date) => date && setNewExpense({...newExpense, date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select 
                value={newExpense.category} 
                onValueChange={(value) => setNewExpense({...newExpense, category: value as any})}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ExpenseCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="Descripción del gasto"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Monto ($)</Label>
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurrent"
                checked={newExpense.recurrent}
                onCheckedChange={(checked) => 
                  setNewExpense({...newExpense, recurrent: checked as boolean})
                }
              />
              <Label
                htmlFor="recurrent"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Gasto recurrente
              </Label>
            </div>
            
            {newExpense.recurrent && (
              <div className="space-y-2">
                <Label htmlFor="periodicity">Periodicidad</Label>
                <Select 
                  value={newExpense.periodicity || 'monthly'} 
                  onValueChange={(value) => setNewExpense({...newExpense, periodicity: value as any})}
                >
                  <SelectTrigger id="periodicity">
                    <SelectValue placeholder="Seleccionar periodicidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ExpensePeriodicity).map((period) => (
                      <SelectItem key={period} value={period}>
                        {getPeriodicityLabel(period)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddExpense}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : (editingExpense ? 'Actualizar' : 'Añadir')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
