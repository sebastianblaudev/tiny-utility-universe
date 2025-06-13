
import { useAuth } from '../contexts/AuthContext';
import { useBarber } from '../contexts/BarberContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart4, Scissors, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const { sales, services, getSummaryByPaymentMethod } = useBarber();
  
  // Get today's date as YYYY-MM-DD for filtering sales
  const todayDateString = new Date().toISOString().split('T')[0];
  
  // Filter today's sales
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return (
      saleDate.getDate() === new Date().getDate() &&
      saleDate.getMonth() === new Date().getMonth() &&
      saleDate.getFullYear() === new Date().getFullYear()
    );
  });

  // Filter sales by current barber if not admin
  const filteredSales = isAdmin 
    ? todaySales 
    : todaySales.filter(sale => sale.barberId === currentUser?.id);

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const serviceCount = filteredSales.reduce((count, sale) => {
    return count + sale.items.filter(item => item.type === 'service').reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  // Get payment summary based on filtered sales
  const calculatePaymentMethodSummary = () => {
    const summary = {
      cash: 0,
      card: 0,
      transfer: 0
    };

    filteredSales.forEach(sale => {
      if (sale.paymentMethod === 'cash') {
        summary.cash += sale.total;
      } else if (sale.paymentMethod === 'card') {
        summary.card += sale.total;
      } else if (sale.paymentMethod === 'transfer') {
        summary.transfer += sale.total;
      }
    });

    return summary;
  };

  const paymentMethodSummary = calculatePaymentMethodSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bienvenido, {currentUser?.name}</h1>
        {isAdmin && (
          <Link to="/pos">
            <Button className="bg-barber-600 hover:bg-barber-700">
              <Scissors className="mr-2 h-4 w-4" />
              Punto de venta
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {isAdmin ? 'Ingresos del día' : 'Mis ingresos del día'}
            </CardDescription>
            <CardTitle className="text-2xl">${totalRevenue.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Efectivo:</span>
                <span>${paymentMethodSummary.cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tarjeta:</span>
                <span>${paymentMethodSummary.card.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Transferencia:</span>
                <span>${paymentMethodSummary.transfer.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {isAdmin ? 'Servicios del día' : 'Mis servicios del día'}
            </CardDescription>
            <CardTitle className="text-2xl">{serviceCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {serviceCount > 0 ? 'Servicios completados hoy' : 'Aún no hay servicios hoy'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {isAdmin ? 'Total de ventas' : 'Mis ventas'}
            </CardDescription>
            <CardTitle className="text-2xl">{filteredSales.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Transacciones completadas
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Servicios disponibles</CardDescription>
              <CardTitle className="text-2xl">{services.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                En catálogo actual
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Accesos rápidos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Link to="/pos">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                    <Scissors className="h-6 w-6" />
                    <span>Punto de venta</span>
                  </Button>
                </Link>
                <Link to="/reports">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                    <BarChart4 className="h-6 w-6" />
                    <span>Informes</span>
                  </Button>
                </Link>
                <Link to="/users">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                    <Users className="h-6 w-6" />
                    <span>Usuarios</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ventas recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSales.length > 0 ? (
                <div className="space-y-4">
                  {filteredSales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-2 border-b">
                      <div>
                        <p className="font-medium">${sale.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{sale.items.length} item(s)</p>
                        <p className="text-xs capitalize text-gray-500">{sale.paymentMethod}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No hay ventas registradas hoy
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* For barbers, only show their recent sales */}
      {!isAdmin && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mis ventas recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSales.length > 0 ? (
                <div className="space-y-4">
                  {filteredSales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-2 border-b">
                      <div>
                        <p className="font-medium">${sale.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{sale.items.length} item(s)</p>
                        <p className="text-xs capitalize text-gray-500">{sale.paymentMethod}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No hay ventas registradas hoy
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
