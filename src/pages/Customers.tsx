
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit, Eye } from "lucide-react";
import { initDB, Customer, Order } from "@/lib/db";
import { CreateCustomerDialog } from "@/components/CreateCustomerDialog";
import { CustomerLastOrderDialog } from "@/components/CustomerLastOrderDialog";
import { useToast } from "@/hooks/use-toast";

// Para futuro: puedes implementar este componente para editar clientes
// import { EditCustomerDialog } from "@/components/EditCustomerDialog";

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [lastOrderDialogOpen, setLastOrderDialogOpen] = useState(false);
  const [customerLastOrder, setCustomerLastOrder] = useState<Order | null>(null);

  const { toast } = useToast();

  // Cargar clientes al inicio
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const db = await initDB();
    const tx = db.transaction("customers", "readonly");
    const store = tx.objectStore("customers");
    const allCustomers = await store.getAll();
    setCustomers(allCustomers);
  };

  const handleCustomerCreated = (customer: Customer) => {
    setCreateDialogOpen(false);
    loadCustomers();
  };

  // Ver la última compra del cliente
  const handleViewLastOrder = async (customer: Customer) => {
    setSelectedCustomer(customer);
    // Buscar la última orden para este cliente
    const db = await initDB();
    const orderStore = db.transaction("orders", "readonly").objectStore("orders");
    const orders: Order[] = await orderStore.getAll();
    const custOrders = orders.filter((o: any) => o.customerId === customer.id);
    // Ordenar por fecha descendente
    custOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCustomerLastOrder(custOrders.length > 0 ? custOrders[0] : null);
    setLastOrderDialogOpen(true);
  };

  // Si implementas edición, aquí usas setSelectedCustomer y un modal de editar.
  // const handleEditCustomer = (customer: Customer) => {
  //   setSelectedCustomer(customer);
  //   setEditDialogOpen(true);
  // };

  return (
    <div className="container mx-auto p-4 space-y-4 bg-black text-white min-h-screen">
      {/* Ajuste: Separar visualmente el BackButton del Título */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold text-white whitespace-nowrap">Clientes</h1>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <Card className="bg-[#1E2129] border-[#2C2F36]">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Información del Cliente</h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-700">
                <TableHead className="text-white">Nombre</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Teléfono</TableHead>
                <TableHead className="text-white">Dirección</TableHead>
                <TableHead className="text-white text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-[#2C2F36]">
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <TableRow key={customer.id} className="border-b border-gray-700">
                    <TableCell className="text-white">{customer.name}</TableCell>
                    <TableCell className="text-white">{customer.email || "—"}</TableCell>
                    <TableCell className="text-white">{customer.phone}</TableCell>
                    <TableCell className="text-white">
                      {customer.address && customer.address.street ? customer.address.street : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-row gap-2 justify-center">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="bg-[#23262E] border-[#3A3D47] text-white hover:border-orange-500"
                          onClick={() => handleViewLastOrder(customer)}
                          title="Ver compra reciente"
                        >
                          <Eye />
                        </Button>
                        {/* Botón de editar, pendiente el modal */}
                        <Button
                          variant="secondary"
                          size="icon"
                          className="bg-[#23262E] border-[#3A3D47] text-white hover:border-orange-500"
                          // onClick={() => handleEditCustomer(customer)}
                          title="Editar cliente"
                        >
                          <Edit />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-white py-4">
                    No hay clientes registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo para crear cliente */}
      <CreateCustomerDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* Diálogo para ver la última compra */}
      <CustomerLastOrderDialog
        open={lastOrderDialogOpen}
        onClose={() => setLastOrderDialogOpen(false)}
        customer={selectedCustomer}
        order={customerLastOrder}
      />
    </div>
  );
};

export default Customers;
