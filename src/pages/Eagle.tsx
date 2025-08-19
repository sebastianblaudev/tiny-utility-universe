import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { PageTitle } from '@/components/ui/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Settings, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Eagle = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { userRole } = useAuth();

  // Only redirect if we're certain it's not mobile (avoid false positives)
  React.useEffect(() => {
    if (isMobile === false) {
      navigate('/', { replace: true });
    }
  }, [isMobile, navigate]);

  // Show loading while determining mobile status
  if (isMobile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  const quickAccessItems = [
    {
      title: "Estadísticas",
      description: "Ver reportes y análisis de ventas",
      icon: <BarChart3 size={24} />,
      route: "/estadisticas",
      color: "from-blue-500 to-blue-600",
      roles: ['admin']
    },
    {
      title: "Panel Admin",
      description: "Administración del sistema",
      icon: <Settings size={24} />,
      route: "/admin",
      color: "from-purple-500 to-purple-600",
      roles: ['admin']
    },
    {
      title: "Dashboard Móvil",
      description: "Vista optimizada para móvil",
      icon: <LayoutDashboard size={24} />,
      route: "/mobile-dashboard",
      color: "from-green-500 to-green-600",
      roles: ['admin', 'cashier']
    },
    {
      title: "Owner Control",
      description: "Control de propietario",
      icon: <Shield size={24} />,
      route: "/owner-control",
      color: "from-red-500 to-red-600",
      roles: ['admin']
    }
  ];

  const filteredItems = quickAccessItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md mx-auto space-y-6">
        <PageTitle 
          title="Eagle" 
          description="Acceso rápido a funciones principales"
          className="text-center"
        />

        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <Card 
              key={item.route}
              className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className={`h-2 bg-gradient-to-r ${item.color}`} />
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${item.color} text-white`}>
                    {item.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => handleNavigation(item.route)}
                  className="w-full"
                  size="lg"
                >
                  Acceder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center pt-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/pos')}
            className="w-full"
          >
            Volver al POS
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Eagle;