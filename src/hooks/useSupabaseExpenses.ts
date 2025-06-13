
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OperationalExpense, ExpenseCategory, ExpensePeriodicity } from '@/types/financial';
import { useToast } from './use-toast';
import { format } from 'date-fns';

export const useSupabaseExpenses = () => {
  const [operationalExpenses, setOperationalExpenses] = useState<OperationalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Categorías válidas que coinciden exactamente con la base de datos
  const VALID_CATEGORIES = ['rent', 'utilities', 'supplies', 'wages', 'maintenance', 'marketing', 'other'] as const;
  const VALID_PERIODICITIES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] as const;

  // Función para validar categoría
  const validateCategory = (category: string): typeof VALID_CATEGORIES[number] => {
    if (!category || typeof category !== 'string') {
      return 'other';
    }
    
    const lowerCategory = category.toLowerCase().trim();
    
    // Mapeo directo
    const categoryMap: Record<string, typeof VALID_CATEGORIES[number]> = {
      'rent': 'rent',
      'utilities': 'utilities',
      'supplies': 'supplies', 
      'wages': 'wages',
      'maintenance': 'maintenance',
      'marketing': 'marketing',
      'other': 'other',
      // Mapeo español
      'arriendo': 'rent',
      'servicios': 'utilities',
      'suministros': 'supplies',
      'salarios': 'wages',
      'mantenimiento': 'maintenance',
      'mercadeo': 'marketing',
      'otros': 'other'
    };
    
    return categoryMap[lowerCategory] || 'other';
  };

  // Función para validar periodicidad
  const validatePeriodicity = (periodicity: string | null): typeof VALID_PERIODICITIES[number] | null => {
    if (!periodicity) return null;
    
    const lowerPeriodicity = periodicity.toLowerCase().trim();
    const periodicityMap: Record<string, typeof VALID_PERIODICITIES[number]> = {
      'daily': 'daily',
      'weekly': 'weekly',
      'biweekly': 'biweekly', 
      'monthly': 'monthly',
      'quarterly': 'quarterly',
      'yearly': 'yearly',
      'diario': 'daily',
      'semanal': 'weekly',
      'quincenal': 'biweekly',
      'mensual': 'monthly',
      'trimestral': 'quarterly',
      'anual': 'yearly'
    };
    
    return periodicityMap[lowerPeriodicity] || 'monthly';
  };

  // Cargar gastos desde Supabase
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        console.log('Fetching expenses from Supabase...');
        
        const { data, error } = await supabase
          .from('operational_expenses')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) {
          console.error('Error fetching expenses:', error);
          throw error;
        }
        
        if (data) {
          console.log('Raw expenses data from Supabase:', data);
          
          const formattedExpenses: OperationalExpense[] = data.map(expense => ({
            id: expense.id,
            branchId: expense.branch_id || 'main',
            date: new Date(expense.date),
            category: validateCategory(expense.category),
            amount: Number(expense.amount),
            description: expense.description || '',
            recurrent: Boolean(expense.recurrent),
            periodicity: expense.recurrent ? validatePeriodicity(expense.periodicity) : undefined,
            lastPaid: expense.last_paid ? new Date(expense.last_paid) : undefined,
            nextDue: expense.next_due ? new Date(expense.next_due) : undefined
          }));
          
          console.log('Formatted expenses:', formattedExpenses);
          setOperationalExpenses(formattedExpenses);
        }
      } catch (err: any) {
        console.error('Error in fetchExpenses:', err);
        setError(err.message);
        toast({
          title: 'Error al cargar gastos',
          description: err.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'operational_expenses'
        }, 
        (payload) => {
          console.log('Cambio detectado en gastos:', payload);
          fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Añadir nuevo gasto
  const addOperationalExpense = async (expense: Omit<OperationalExpense, 'id'>) => {
    try {
      console.log('=== ADDING NEW EXPENSE ===');
      console.log('Raw expense data:', expense);
      
      // Verificar sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('No hay una sesión activa. Por favor, inicie sesión nuevamente.');
      }

      console.log('User authenticated:', session.user.id);

      // Validaciones básicas
      if (!expense.description?.trim()) {
        throw new Error('La descripción es requerida');
      }

      if (!expense.amount || expense.amount <= 0) {
        throw new Error('El monto debe ser mayor que cero');
      }

      if (!expense.date) {
        throw new Error('La fecha es requerida');
      }

      if (!expense.category?.trim()) {
        throw new Error('La categoría es requerida');
      }

      // Validar y preparar los datos
      const validatedCategory = validateCategory(expense.category);
      const validatedPeriodicity = expense.recurrent ? validatePeriodicity(expense.periodicity || 'monthly') : null;

      console.log('Validation results:', {
        originalCategory: expense.category,
        validatedCategory,
        originalPeriodicity: expense.periodicity,
        validatedPeriodicity
      });

      // Preparar objeto para Supabase
      const supabaseExpense = {
        user_id: session.user.id,
        branch_id: expense.branchId?.trim() || 'main',
        date: expense.date.toISOString(),
        category: validatedCategory,
        amount: Number(expense.amount),
        description: expense.description.trim(),
        recurrent: Boolean(expense.recurrent),
        periodicity: validatedPeriodicity,
        last_paid: expense.lastPaid ? expense.lastPaid.toISOString() : null,
        next_due: expense.nextDue ? expense.nextDue.toISOString() : null
      };

      console.log('Final Supabase expense object:', supabaseExpense);

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('operational_expenses')
        .insert(supabaseExpense)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Error del servidor: ${error.message}`);
      }

      if (!data) {
        throw new Error('No se recibieron datos del servidor');
      }

      console.log('Expense inserted successfully:', data);

      // Formatear para el estado local
      const newExpense: OperationalExpense = {
        id: data.id,
        branchId: data.branch_id || 'main',
        date: new Date(data.date),
        category: validateCategory(data.category),
        amount: Number(data.amount),
        description: data.description || '',
        recurrent: Boolean(data.recurrent),
        periodicity: data.recurrent ? validatePeriodicity(data.periodicity) : undefined,
        lastPaid: data.last_paid ? new Date(data.last_paid) : undefined,
        nextDue: data.next_due ? new Date(data.next_due) : undefined
      };

      setOperationalExpenses(prev => [newExpense, ...prev]);

      toast({
        title: "✅ Gasto registrado",
        description: `Gasto de $${newExpense.amount.toLocaleString()} registrado correctamente`
      });

      return newExpense;
    } catch (err: any) {
      console.error('Error in addOperationalExpense:', err);
      
      toast({
        title: "❌ Error al registrar gasto",
        description: err.message || 'Error desconocido al registrar el gasto',
        variant: "destructive"
      });
      
      throw err;
    }
  };

  // Actualizar gasto existente
  const updateOperationalExpense = async (expense: OperationalExpense) => {
    try {
      console.log('Updating expense:', expense);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const validatedCategory = validateCategory(expense.category);
      const validatedPeriodicity = expense.recurrent ? validatePeriodicity(expense.periodicity || 'monthly') : null;

      const supabaseExpense = {
        user_id: user.id,
        branch_id: expense.branchId || 'main',
        date: expense.date.toISOString(),
        category: validatedCategory,
        amount: Number(expense.amount),
        description: expense.description || '',
        recurrent: Boolean(expense.recurrent),
        periodicity: validatedPeriodicity,
        last_paid: expense.lastPaid ? expense.lastPaid.toISOString() : null,
        next_due: expense.nextDue ? expense.nextDue.toISOString() : null
      };

      console.log('Updating with data:', supabaseExpense);

      const { error } = await supabase
        .from('operational_expenses')
        .update(supabaseExpense)
        .eq('id', expense.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Expense updated successfully');
      setOperationalExpenses(prev => 
        prev.map(e => e.id === expense.id ? expense : e)
      );

      toast({
        title: "Gasto operacional actualizado",
        description: `Se ha actualizado el gasto operacional de $${expense.amount.toLocaleString()}`
      });
    } catch (err: any) {
      console.error('Error in updateOperationalExpense:', err);
      toast({
        title: "Error al actualizar gasto",
        description: err.message || 'Error desconocido al actualizar gasto',
        variant: "destructive"
      });
      throw err;
    }
  };

  // Eliminar gasto
  const deleteOperationalExpense = async (id: string) => {
    try {
      console.log('Deleting expense with id:', id);
      const expenseToDelete = operationalExpenses.find(e => e.id === id);
      
      const { error } = await supabase
        .from('operational_expenses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Expense deleted successfully');
      setOperationalExpenses(prev => prev.filter(e => e.id !== id));
      
      if (expenseToDelete) {
        toast({
          title: "Gasto operacional eliminado",
          description: `Se ha eliminado el gasto de $${expenseToDelete.amount.toLocaleString()}`
        });
      }
    } catch (err: any) {
      console.error('Error in deleteOperationalExpense:', err);
      toast({
        title: "Error al eliminar gasto",
        description: err.message || 'Error desconocido al eliminar gasto',
        variant: "destructive"
      });
      throw err;
    }
  };
  
  return {
    operationalExpenses,
    loading,
    error,
    addOperationalExpense,
    updateOperationalExpense,
    deleteOperationalExpense
  };
};
