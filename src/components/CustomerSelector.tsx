
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, X, History, Phone, Mail, Home, User, ArrowUpDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Input
} from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { 
  supabase, 
  updateSaleWithCustomer, 
  registerCustomerSaleHistory, 
  getCustomerById, 
  getCurrentUserTenantId,
  addCustomer as supabaseAddCustomer 
} from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';

interface CustomerFormValues {
  name: string;
  phone: string;
  address: string;
  email: string;
}

interface CustomerSelectorProps {
  onCustomerSelect: (customerId: string | null, customerName?: string) => void;
  selectedCustomerId?: string | null;
  saleId?: string | null;
}

export const CustomerSelector = ({ onCustomerSelect, selectedCustomerId, saleId }: CustomerSelectorProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<{id: string, name: string} | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const form = useForm<CustomerFormValues>({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      email: ''
    }
  });

  // Fetch tenant ID on component mount
  useEffect(() => {
    const fetchTenantId = async () => {
      const id = await getCurrentUserTenantId();
      setTenantId(id);
    };
    
    fetchTenantId();
  }, []);

  useEffect(() => {
    const fetchSelectedCustomer = async () => {
      if (selectedCustomerId) {
        const customer = await getCustomerById(selectedCustomerId);
        
        if (customer) {
          setSelectedCustomerName(customer.name);
        } else {
          console.error('Customer not found, may belong to another tenant');
          onCustomerSelect(null);
          setSelectedCustomerName('');
        }
      } else {
        setSelectedCustomerName('');
      }
    };

    fetchSelectedCustomer();
  }, [selectedCustomerId]);

  const searchCustomers = async (term: string) => {
    try {
      if (!tenantId) {
        console.error('No tenant ID available');
        
        // Try to get it again
        const id = await getCurrentUserTenantId();
        if (!id) {
          setCustomers([]);
          return;
        }
        setTenantId(id);
      }
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .ilike('name', `%${term}%`)
        .limit(5);

      if (error) {
        console.error('Error searching customers:', error);
        return;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error('Error in searchCustomers:', error);
      setCustomers([]);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length >= 2) {
      searchCustomers(term);
    } else {
      setCustomers([]);
    }
  };

  const createCustomer = async (data: CustomerFormValues) => {
    if (!data.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del cliente es requerido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (!tenantId) {
        // Try to get tenant ID again
        const id = await getCurrentUserTenantId();
        if (!id) {
          toast({
            title: "Error",
            description: "No se pudo identificar el negocio actual",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        setTenantId(id);
      }
      
      const customerData = {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        email: data.email?.trim() || null,
        tenant_id: tenantId
      };
      
      console.log('Creando cliente con datos:', customerData);
      
      // Use the supabaseAddCustomer function instead of direct query
      const newCustomer = await supabaseAddCustomer(customerData);

      if (!newCustomer) {
        throw new Error('No se pudo crear el cliente');
      }

      console.log('Cliente creado exitosamente:', newCustomer);
      
      onCustomerSelect(newCustomer.id, newCustomer.name);
      setSelectedCustomerName(newCustomer.name);
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Cliente creado",
        description: `Se creó el cliente "${newCustomer.name}" exitosamente`
      });
      
      if (saleId) {
        const updated = await updateSaleWithCustomer(saleId, newCustomer.id);
        if (updated) {
          await registerCustomerSaleHistory(newCustomer.id, saleId);
          toast({
            title: "Cliente asignado",
            description: `Se asignó el cliente "${newCustomer.name}" a la venta`
          });
        }
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el cliente. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectCustomer = async (customerId: string, customerName: string) => {
    onCustomerSelect(customerId, customerName);
    setSelectedCustomerName(customerName);
    setShowDialog(false);
    setSearchTerm('');
    setCustomers([]);
    
    if (saleId) {
      const updated = await updateSaleWithCustomer(saleId, customerId);
      if (updated) {
        await registerCustomerSaleHistory(customerId, saleId);
        toast({
          title: "Cliente asignado",
          description: `Se asignó el cliente "${customerName}" a la venta`
        });
      }
    }
  };

  const removeCustomer = () => {
    onCustomerSelect(null);
    setSelectedCustomerName('');
  };

  const openCreateCustomerModal = () => {
    setShowCreateDialog(true);
    setShowDialog(false);
  };

  const viewCustomerHistory = (customerId: string, customerName: string) => {
    if (saleId) {
      const { openRecentPurchasesInNewWindow } = require('@/components/customers/RecentPurchases');
      openRecentPurchasesInNewWindow(customerId);
    } else {
      setSelectedCustomerForHistory({ id: customerId, name: customerName });
      setLoadingHistory(true);
      setShowHistoryDialog(true);
      setLoadingHistory(false);
    }
  };

  return (
    <>
      {selectedCustomerId && selectedCustomerName ? (
        <div className="flex items-center gap-2 w-full">
          <div className="flex-grow overflow-hidden dark:bg-gray-800 dark:text-gray-200 border dark:border-gray-700 rounded-md px-3 py-2">
            <span className="truncate block">{selectedCustomerName}</span>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={removeCustomer}
            className="dark:bg-red-800 dark:hover:bg-red-700"
          >
            <X className="mr-1" size={16} />
            Quitar
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          data-customer-selector-button
          className="w-full dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <UserPlus className="mr-2" size={16} />
          Agregar Cliente
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Seleccionar Cliente</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Busque un cliente existente o cree uno nuevo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={handleSearch}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
            </div>

            {customers.length > 0 && (
              <div className="space-y-2">
                {customers.map(customer => (
                  <div key={customer.id} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => selectCustomer(customer.id, customer.name)}
                      className="flex-grow justify-start dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                      {customer.name}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={openCreateCustomerModal}
                className="w-full"
              >
                Crear Nuevo Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Crear Nuevo Cliente</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Ingrese la información del nuevo cliente
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(createCustomer)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300 flex items-center gap-2">
                      <User size={16} />
                      Nombre
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre del cliente"
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        {...field}
                        required
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300 flex items-center gap-2">
                      <Phone size={16} />
                      Teléfono
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Teléfono (opcional)"
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300 flex items-center gap-2">
                      <Home size={16} />
                      Dirección
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Dirección (opcional)"
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300 flex items-center gap-2">
                      <Mail size={16} />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Email (opcional)"
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !form.getValues().name.trim()}
                >
                  {loading ? "Creando..." : "Guardar Cliente"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-[850px] dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              Historial de Compras - {selectedCustomerForHistory?.name || selectedCustomerName}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Registro de compras realizadas por este cliente
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingHistory ? (
              <div className="text-center py-4 dark:text-gray-300">
                <p>Cargando historial...</p>
              </div>
            ) : selectedCustomerForHistory ? (
              <div className="rounded-md border dark:border-gray-700">
                {React.createElement(
                  require('@/components/customers/RecentPurchases').default, 
                  { 
                    customerId: selectedCustomerForHistory.id,
                    limit: 10
                  }
                )}
              </div>
            ) : (
              <div className="text-center py-4 dark:text-gray-300">
                <p>Seleccione un cliente para ver su historial.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
