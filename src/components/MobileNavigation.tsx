import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  BarChart3,
  Settings, 
  LayoutDashboard, 
  ReceiptText,
  Users,
  Video,
  HelpCircle,
  Lock,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageLocks } from '@/hooks/usePageLocks';
import { toast } from 'sonner';
import { ThemeToggle } from './ThemeToggle';
import { LogoutButton } from './LogoutButton';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  route: string;
  isExternal?: boolean;
  roles?: ('admin' | 'cashier')[];
}

const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { isPageLocked } = usePageLocks();

  const menuItems: MenuItem[] = [
    {
      title: "Punto de Venta",
      icon: <ShoppingCart size={20} />,
      route: "/pos",
      roles: ['admin', 'cashier']
    },
    {
      title: "Productos",
      icon: <Package size={20} />,
      route: "/products",
      roles: ['admin']
    },
    {
      title: "Clientes",
      icon: <Users size={20} />,
      route: "/customers2",
      roles: ['admin', 'cashier']
    },
    {
      title: "Historial Ventas",
      icon: <ReceiptText size={20} />,
      route: "/historial-ventas",
      roles: ['admin', 'cashier']
    },
    {
      title: "Turnos",
      icon: <Users size={20} />,
      route: "/turnos",
      roles: ['admin', 'cashier']
    },
    {
      title: "Estadísticas",
      icon: <BarChart3 size={20} />,
      route: "/estadisticas",
      roles: ['admin']
    },
    {
      title: "Video Tutoriales",
      icon: <Video size={20} />,
      route: "/video-tutoriales",
      roles: ['admin', 'cashier']
    },
    {
      title: "Panel Admin",
      icon: <LayoutDashboard size={20} />,
      route: "/admin",
      roles: ['admin']
    },
    {
      title: "Configuración",
      icon: <Settings size={20} />,
      route: "/configuracion",
      roles: ['admin']
    },
    {
      title: "Owner Control",
      icon: <Settings size={20} />,
      route: "/owner-control",
      roles: ['admin']
    },
    {
      title: "Soporte",
      icon: <HelpCircle size={20} />,
      route: "https://wa.me/56944366510",
      isExternal: true,
      roles: ['admin', 'cashier']
    }
  ];

  const filteredItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  const handleItemClick = (item: MenuItem) => {
    if (isPageLocked(item.route) && !item.isExternal) {
      toast.warning(`Acceso bloqueado a ${item.title}`, {
        description: "Esta página ha sido bloqueada por el administrador."
      });
      return;
    }

    if (item.isExternal) {
      window.open(item.route, '_blank');
    } else {
      navigate(item.route);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-background border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
          >
            <Menu size={24} />
          </button>
          <img 
            src="https://ventapos.app/lovable-uploads/c106b542-79b3-4713-89e8-647e56b622b2.png" 
            alt="VentaPOS Logo" 
            className="h-8 w-auto object-contain" 
          />
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div 
            className="fixed left-0 top-0 h-full w-80 bg-background border-r border-border shadow-xl animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://ventapos.app/lovable-uploads/c106b542-79b3-4713-89e8-647e56b622b2.png" 
                  alt="VentaPOS Logo" 
                  className="h-8 w-auto object-contain" 
                />
                <span className="font-semibold text-foreground">VentaPOS</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-secondary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-3">
                {filteredItems.map((item) => {
                  const isLocked = isPageLocked(item.route);
                  const isActive = !item.isExternal && location.pathname === item.route;
                  
                  return (
                    <button
                      key={item.route}
                      onClick={() => handleItemClick(item)}
                      className={`
                        w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors
                        ${isActive 
                          ? 'bg-primary text-primary-foreground font-medium' 
                          : 'hover:bg-secondary text-foreground'
                        }
                        ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}
                      `}
                    >
                      <span className="flex-shrink-0">
                        {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                      </span>
                      <span className="ml-3 text-sm">{item.title}</span>
                      {isLocked && (
                        <Lock size={14} className="text-destructive ml-auto" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <div className="text-xs text-muted-foreground text-center">
                © 2025 Venta POS
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;