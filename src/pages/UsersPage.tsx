
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Edit, Trash, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserFormDialog from "@/components/users/UserFormDialog";
import DeleteUserDialog from "@/components/users/DeleteUserDialog";
import DeleteManyUsersDialog from "@/components/users/DeleteManyUsersDialog";
import { toast } from "@/hooks/use-toast";
import { User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useBarber } from "@/contexts/BarberContext";
import { useSupabaseRealtimeData } from "@/hooks/useSupabaseRealtimeData";

const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { getAllUsers, addUser, updateUser, deleteUser } = useAuth();
  const { barbers, addBarber, deleteBarber, services, updateService } = useBarber();
  const { appSettings, systemUsers } = useSupabaseRealtimeData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteManyDialogOpen, setIsDeleteManyDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Obtener nombres bloqueados desde Supabase
  const blockedNames = appSettings.blockedNames || [];
  
  // Usar systemUsers desde Supabase en tiempo real como fuente principal
  const users = systemUsers.map(su => ({
    id: su.id,
    name: su.name,
    pin: su.pin,
    role: su.role,
    branchId: su.branchId,
    isBlocked: su.isBlocked
  })) as User[];

  // Filtrar usuarios basado en la consulta de búsqueda
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClick = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTestBarbersClick = () => {
    setIsDeleteManyDialogOpen(true);
  };

  // Verificar si un nombre contiene alguna palabra bloqueada
  const isNameBlocked = (name: string): boolean => {
    const lowerName = name.toLowerCase();
    return blockedNames.some(blocked => lowerName.includes(blocked.toLowerCase()));
  };

  const handleSaveUser = async (userData: User) => {
    // Verificar si el nombre está en la lista de bloqueados
    if (isNameBlocked(userData.name)) {
      toast({
        title: "Nombre no permitido",
        description: "Este nombre contiene palabras reservadas para pruebas y no se permite su uso.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (selectedUser) {
        // Editar usuario existente
        await updateUser(userData);
        
        // Actualizar lista de barberos si el usuario es barbero
        if (userData.role === 'barber') {
          addBarber({
            name: userData.name
          });
        }
        
        toast({
          title: "Usuario actualizado",
          description: `${userData.name} ha sido actualizado correctamente en Supabase.`,
        });
      } else {
        // Agregar nuevo usuario
        const result = await addUser(userData);
        
        if (!result.success) {
          toast({
            title: "Error",
            description: result.error || "Error al crear el usuario",
            variant: "destructive",
          });
          return;
        }
        
        // Agregar a la lista de barberos si es barbero
        if (userData.role === 'barber') {
          addBarber({
            name: userData.name
          });
        }
        
        toast({
          title: "Usuario creado",
          description: `${userData.name} ha sido agregado correctamente a Supabase.`,
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el usuario en Supabase.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      
      // Si es barbero, eliminarlo de la lista de barberos también
      if (userToDelete.role === 'barber') {
        // Antes de eliminar el barbero, eliminar sus códigos de barras en los servicios
        removeBarberFromServices(userToDelete.id);
        deleteBarber(userToDelete.id);
      }
      
      toast({
        title: "Usuario eliminado",
        description: `${userToDelete.name} ha sido eliminado correctamente de Supabase.`,
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };
  
  // Función para verificar si un nombre es de prueba
  const isTestBarberName = (name: string): boolean => {
    const lowerName = name.toLowerCase();
    return blockedNames.some(test => lowerName.includes(test.toLowerCase()));
  };
  
  // Nueva función para eliminar un barbero de los servicios
  const removeBarberFromServices = (barberId: string) => {
    // Buscar todos los servicios que tienen este barbero asignado o tienen códigos de barras para él
    services.forEach(service => {
      let serviceUpdated = false;
      
      // Eliminar como barbero por defecto
      if (service.barberId === barberId) {
        service.barberId = undefined;
        serviceUpdated = true;
      }
      
      // Eliminar códigos de barras asociados
      if (service.barberBarcodes && service.barberBarcodes.length > 0) {
        const filteredBarcodes = service.barberBarcodes.filter(bc => bc.barberId !== barberId);
        if (filteredBarcodes.length !== service.barberBarcodes.length) {
          service.barberBarcodes = filteredBarcodes;
          serviceUpdated = true;
        }
      }
      
      // Actualizar el servicio si hubo cambios
      if (serviceUpdated) {
        updateService(service);
      }
    });
  };
  
  const handleDeleteTestBarbers = async () => {
    // Identificar barberos con nombres de prueba
    const testBarberUsers = users.filter(user => 
      user.role === 'barber' && isTestBarberName(user.name)
    );
    
    // Eliminar cada barbero de prueba
    for (const user of testBarberUsers) {
      // Primero eliminar las referencias en los servicios
      removeBarberFromServices(user.id);
      
      // Luego eliminar el barbero
      await deleteUser(user.id);
      deleteBarber(user.id);
    }
    
    toast({
      title: "Barberos de prueba eliminados",
      description: `${testBarberUsers.length} barberos de prueba han sido eliminados correctamente de Supabase.`,
    });
    
    setIsDeleteManyDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <div className="flex space-x-2">
          <Button className="bg-barber-600 hover:bg-barber-700" onClick={handleAddClick}>
            <PlusCircle className="h-5 w-5 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Usuarios del Sistema ({users.length}) - Tiempo Real</CardTitle>
          <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
            <Input
              placeholder="Buscar por nombre o rol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <Button type="submit" size="icon" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" || user.role === "owner" ? "destructive" : "secondary"}>
                      {user.role === "admin" ? "Administrador" : user.role === "owner" ? "Propietario" : "Barbero"}
                    </Badge>
                  </TableCell>
                  <TableCell>••••</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" onClick={() => handleEditClick(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => handleDeleteClick(user)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <UserFormDialog 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        branches={[]}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDeleteUser}
        userName={userToDelete?.name || ""}
      />
      
      {/* Delete Many Users Dialog */}
      <DeleteManyUsersDialog
        isOpen={isDeleteManyDialogOpen}
        onClose={() => setIsDeleteManyDialogOpen(false)}
        onDelete={handleDeleteTestBarbers}
      />
    </div>
  );
};

export default UsersPage;
