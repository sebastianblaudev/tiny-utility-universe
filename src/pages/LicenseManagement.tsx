
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

type UserLicenseInfo = {
  id: string;
  email: string;
  businessName: string;
  role: string;
  licenseActive: boolean;
  licensePaymentDate: string | null;
  licenseExpirationDate: string | null;
  created_at: string;
};

const LicenseManagement = () => {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserLicenseInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserLicenseInfo[]>([]);

  // Only allow access to super admins
  const isSuperAdmin = user?.email === 'admin@sistema.com' || 
                      user?.user_metadata?.isSuperAdmin === true;

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isSuperAdmin) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // This requires an edge function in production
        // For now, we're simulating with local data
        const { data, error } = await supabase.auth.admin.listUsers();
        
        if (error) throw error;
        
        const formattedUsers: UserLicenseInfo[] = data.users.map(u => ({
          id: u.id,
          email: u.email || 'Sin correo',
          businessName: u.user_metadata?.businessName || 'Sin nombre',
          role: u.user_metadata?.role || 'Sin rol',
          licenseActive: !!u.user_metadata?.licenseActive,
          licensePaymentDate: u.user_metadata?.licensePaymentDate || null,
          licenseExpirationDate: u.user_metadata?.licenseExpirationDate || null,
          created_at: u.created_at || new Date().toISOString()
        }));
        
        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Error al cargar usuarios');
        
        // For demonstration, use sample data
        const sampleData = generateSampleData();
        setUsers(sampleData);
        setFilteredUsers(sampleData);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isSuperAdmin]);

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(lowerSearchTerm) || 
      user.businessName.toLowerCase().includes(lowerSearchTerm)
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Handle license activation/deactivation
  const toggleLicense = async (userId: string, activate: boolean) => {
    try {
      // This would require an edge function in production
      // For demo, we'll just update the local state
      
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          const now = new Date().toISOString();
          const expirationDate = new Date();
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);
          
          return {
            ...u,
            licenseActive: activate,
            licensePaymentDate: activate ? now : null,
            licenseExpirationDate: activate ? expirationDate.toISOString() : null
          };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      
      // Also update filtered users
      setFilteredUsers(prev => 
        prev.map(u => {
          if (u.id === userId) {
            const now = new Date().toISOString();
            const expirationDate = new Date();
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);
            
            return {
              ...u,
              licenseActive: activate,
              licensePaymentDate: activate ? now : null,
              licenseExpirationDate: activate ? expirationDate.toISOString() : null
            };
          }
          return u;
        })
      );
      
      toast.success(`Licencia ${activate ? 'activada' : 'desactivada'} con éxito`);
    } catch (error) {
      console.error('Error toggling license:', error);
      toast.error(`Error al ${activate ? 'activar' : 'desactivar'} la licencia`);
    }
  };

  // Generate sample data for demonstration
  const generateSampleData = (): UserLicenseInfo[] => {
    return [
      {
        id: '1',
        email: 'cliente1@example.com',
        businessName: 'Negocio Ejemplo 1',
        role: 'admin',
        licenseActive: true,
        licensePaymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        licenseExpirationDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        email: 'cliente2@example.com',
        businessName: 'Negocio Ejemplo 2',
        role: 'admin',
        licenseActive: false,
        licensePaymentDate: null,
        licenseExpirationDate: null,
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        email: 'cliente3@example.com',
        businessName: 'Cafetería El Aroma',
        role: 'admin',
        licenseActive: true,
        licensePaymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        licenseExpirationDate: new Date(Date.now() + 355 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="glass-morph border-0">
          <CardHeader>
            <CardTitle>Gestión de Licencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">Acceso Restringido</h3>
              <p className="text-gray-500 text-center max-w-md">
                Esta sección está reservada para administradores del sistema. Si necesitas acceder a esta información, 
                contacta al soporte técnico.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="glass-morph border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Gestión de Licencias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <Input
                placeholder="Buscar por correo o nombre..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refrescar
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Pago</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No se encontraron usuarios con esos criterios de búsqueda
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.businessName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          {user.licenseActive ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              Activa
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              Prueba
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.licensePaymentDate 
                            ? format(new Date(user.licensePaymentDate), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {user.licenseExpirationDate
                            ? format(new Date(user.licenseExpirationDate), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {user.licenseActive ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                              onClick={() => toggleLicense(user.id, false)}
                            >
                              Desactivar
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                              onClick={() => toggleLicense(user.id, true)}
                            >
                              Activar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseManagement;
