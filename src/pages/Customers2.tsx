import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Search, Pencil, Trash, UserCircle, Package, Eye } from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { addCustomer, getAllCustomers, updateCustomer, deleteCustomer, getCustomerSales } from "@/lib/supabase-helpers";
import Ticket from '@/components/Ticket';
import { getCustomerPurchaseHistory, getReceiptData } from '@/services/ReceiptService';

const Customers2 = () => {
  const { tenantId } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSales, setCustomerSales] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  
  useEffect(() => {
    loadCustomers();
  }, [tenantId]);
  
  const loadCustomers = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const data = await getAllCustomers(tenantId);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleAddCustomer = async () => {
    if (!formData.name) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }
    
    if (!tenantId) {
      toast.error('No se pudo obtener la información del negocio');
      return;
    }
    
    try {
      console.log('Iniciando creación de cliente con datos:', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        tenant_id: tenantId
      });
      
      const customer = await addCustomer({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        notes: formData.notes || null,
        tenant_id: tenantId
      });
      
      if (customer) {
        console.log('Cliente creado exitosamente:', customer);
        toast.success('Cliente añadido con éxito');
        setIsAddDialogOpen(false);
        setFormData({
          id: '',
          name: '',
          email: '',
          phone: '',
          address: '',
          notes: '',
        });
        await loadCustomers();
      } else {
        console.error('No se recibió respuesta al crear cliente');
        toast.error('Error al añadir cliente');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Error al añadir cliente');
    }
  };
  
  const handleEditCustomer = async () => {
    if (!formData.name) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }
    
    try {
      const customer = await updateCustomer(formData.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
      });
      
      if (customer) {
        toast.success('Cliente actualizado con éxito');
        setIsEditDialogOpen(false);
        await loadCustomers();
        
        if (selectedCustomer && selectedCustomer.id === formData.id) {
          setSelectedCustomer({
            ...selectedCustomer,
            ...formData
          });
        }
      } else {
        toast.error('Error al actualizar cliente');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Error al actualizar cliente');
    }
  };
  
  const handleDeleteCustomer = async () => {
    try {
      await deleteCustomer(formData.id);
      toast.success('Cliente eliminado con éxito');
      setIsDeleteDialogOpen(false);
      
      if (selectedCustomer && selectedCustomer.id === formData.id) {
        setSelectedCustomer(null);
      }
      
      await loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Error al eliminar cliente');
    }
  };
  
  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer);
    
    try {
      const sales = await getCustomerSales(customer.id);
      setCustomerSales(sales || []);
    } catch (error) {
      console.error('Error loading customer sales:', error);
      setCustomerSales([]);
    }
  };
  
  const openEditDialog = (customer: any) => {
    setFormData({
      id: customer.id,
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (customer: any) => {
    setFormData({
      id: customer.id,
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setIsDeleteDialogOpen(true);
  };
  
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const [showLatestPurchase, setShowLatestPurchase] = useState(false);
  const [latestPurchase, setLatestPurchase] = useState<any>(null);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  
  const handleViewLatestPurchase = async (customerId: string) => {
    setLoadingPurchase(true);
    try {
      const purchases = await getCustomerPurchaseHistory(customerId, 1);
      if (purchases && purchases.length > 0) {
        const saleId = purchases[0].id;
        const receiptData = await getReceiptData(saleId, undefined);
        
        if (receiptData) {
          setLatestPurchase(receiptData);
          setShowLatestPurchase(true);
        } else {
          toast.error("No se pudieron cargar los detalles de la última compra");
        }
      } else {
        console.log('No purchases found for this customer');
        toast.info("Este cliente no tiene compras registradas");
      }
    } catch (error) {
      console.error('Error loading latest purchase:', error);
      toast.error("Error al cargar la última compra");
    } finally {
      setLoadingPurchase(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Clientes</h1>
          <Button onClick={() => {
            setFormData({
              id: '',
              name: '',
              email: '',
              phone: '',
              address: '',
              notes: '',
            });
            setIsAddDialogOpen(true);
          }}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2 lg:w-2/5 space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar cliente..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>Lista de Clientes</CardTitle>
                <CardDescription>
                  {filteredCustomers.length} clientes encontrados
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="text-center p-6">
                    <p>Cargando clientes...</p>
                  </div>
                ) : filteredCustomers.length > 0 ? (
                  <ScrollArea className="h-[60vh] overflow-y-auto pr-2">
                    <table className="w-full">
                      <tbody className="divide-y">
                        {filteredCustomers.map((customer) => (
                          <tr 
                            key={customer.id} 
                            className={`hover:bg-muted/50 cursor-pointer ${
                              selectedCustomer?.id === customer.id ? 'bg-muted' : ''
                            }`}
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                  {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {customer.email || customer.phone || 'Sin contacto'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(customer);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteDialog(customer);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                ) : (
                  <div className="text-center p-8">
                    <UserCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No se encontraron clientes</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchTerm 
                        ? 'No hay resultados para su búsqueda' 
                        : 'Comience añadiendo su primer cliente'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="md:w-1/2 lg:w-3/5">
            {selectedCustomer ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedCustomer.name}</CardTitle>
                      <CardDescription>
                        Cliente desde {formatDate(selectedCustomer.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewLatestPurchase(selectedCustomer.id)}
                        disabled={loadingPurchase}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {loadingPurchase ? 'Cargando...' : 'Ver última compra'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(selectedCustomer)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => openDeleteDialog(selectedCustomer)}>
                        <Trash className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details">
                    <TabsList className="mb-4">
                      <TabsTrigger value="details">Detalles</TabsTrigger>
                      <TabsTrigger value="purchases">Compras</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Email</h4>
                            <p>{selectedCustomer.email || 'No especificado'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Teléfono</h4>
                            <p>{selectedCustomer.phone || 'No especificado'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Dirección</h4>
                            <p>{selectedCustomer.address || 'No especificada'}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Notas</h4>
                          <div className="bg-muted/30 p-3 rounded-md min-h-[120px] whitespace-pre-wrap">
                            {selectedCustomer.notes || 'No hay notas para este cliente'}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="purchases">
                      {customerSales.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Método de Pago</TableHead>
                                <TableHead>Estado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customerSales.map((sale) => (
                                <TableRow key={sale.id}>
                                  <TableCell>{formatDate(sale.date)}</TableCell>
                                  <TableCell>
                                    ${sale.total.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </TableCell>
                                  <TableCell className="capitalize">
                                    {sale.payment_method || 'No especificado'}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      sale.status === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {sale.status === 'completed' ? 'Completada' : sale.status}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                          <h3 className="mt-2 text-lg font-medium">Sin compras</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Este cliente no ha realizado compras aún
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <UserCircle className="h-16 w-16 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 text-xl font-medium">Seleccione un cliente</h3>
                  <p className="text-muted-foreground mt-2">
                    Seleccione un cliente para ver sus detalles o añada uno nuevo
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Cliente</DialogTitle>
            <DialogDescription>
              Complete la información para añadir un nuevo cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Nombre*
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nombre del cliente"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                placeholder="Calle, número, ciudad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder="Notas adicionales sobre el cliente"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCustomer}>
              Añadir Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Actualice la información del cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre*</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Dirección</Label>
              <Input
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCustomer}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Cliente</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este cliente? Esta acción no puede deshacerse.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-lg font-semibold">{formData.name}</p>
            <p className="text-sm text-muted-foreground">
              {formData.email || formData.phone || 'Sin datos de contacto'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Eliminar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showLatestPurchase} onOpenChange={setShowLatestPurchase}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Última Compra</DialogTitle>
          </DialogHeader>
          {latestPurchase ? (
            <Ticket ticketData={latestPurchase} />
          ) : (
            <div className="py-4 text-center">
              No hay compras registradas para este cliente.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Customers2;
