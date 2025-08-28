import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Settings, 
  LayoutDashboard, 
  ChevronLeft,
  ChevronRight,
  BarChart3,
  HelpCircle,
  Lock,
  Unlock,
  ReceiptText,
  Users,
  Video,
  ChefHat
} from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { toggleMenuItemLock } from '@/lib/supabase-helpers';
import UnlockDialog from './UnlockDialog';
import { toast } from 'sonner';
import { getBusinessInfoForReceipt } from '@/utils/ticketUtils';
import { LogoutButton } from './LogoutButton';
import { usePageLocks } from '@/hooks/usePageLocks';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  route: string;
  isExternal?: boolean;
  roles?: ('admin' | 'cashier')[];
  showWhen?: () => Promise<boolean>;
  mobileOnly?: boolean; // Nueva propiedad para elementos solo móviles
}

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { isPageLocked } = usePageLocks();
  const [unlockingItem, setUnlockingItem] = useState<SidebarItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<SidebarItem[]>([]);

  const sidebarItems: SidebarItem[] = [
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
      roles: ['admin'],
      mobileOnly: true
    },
    {
      title: "Configuración",
      icon: <Settings size={20} />,
      route: "/configuracion",
      roles: ['admin']
    },
    {
      title: "Dashboard Móvil",
      icon: <LayoutDashboard size={20} />,
      route: "/mobile-dashboard",
      roles: ['admin'],
      mobileOnly: true
    },
    {
      title: "Owner Control",
      icon: <Settings size={20} />,
      route: "/owner-control",
      roles: ['admin'],
      mobileOnly: true // Solo visible en móviles
    },
    {
      title: "Soporte",
      icon: <HelpCircle size={20} />,
      route: "https://wa.me/56944366510",
      isExternal: true,
      roles: ['admin', 'cashier']
    }
  ];

  useEffect(() => {
    const filterItems = async () => {
      let itemsToShow = sidebarItems;
      
      // Si es móvil, mostrar solo las páginas específicas
      if (isMobile) {
        const mobilePages = ['/products', '/estadisticas', '/admin', '/owner-control'];
        itemsToShow = sidebarItems.filter(item => 
          mobilePages.includes(item.route) || item.isExternal
        );
      } else {
        // En escritorio, excluir elementos marcados como mobileOnly
        itemsToShow = sidebarItems.filter(item => !item.mobileOnly);
      }
      
      const result = [];
      
      for (const item of itemsToShow) {
        if (item.roles && !item.roles.includes(userRole)) {
          continue;
        }
        
        if (item.showWhen) {
          const shouldShow = await item.showWhen();
          if (!shouldShow) {
            continue;
          }
        }
        
        result.push(item);
      }
      
      setFilteredItems(result);
    };
    
    filterItems();
  }, [userRole, location.pathname, isMobile]);

  const handleItemClick = (item: SidebarItem) => {
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
  };

  // Remove lock functionality from sidebar - now handled by remote control

  return (
    <>
      <div 
        className={`sidebar bg-background dark:bg-sidebar h-full border-r border-border ${
          collapsed ? 'w-14' : 'w-56'
        } transition-all duration-300 flex flex-col z-10 shadow-sm`}
      >
        <div className="flex items-center justify-between p-3 border-b border-border">
          {!collapsed ? (
            <div className="flex flex-col items-start">
              <img 
                src="https://ventapos.app/lovable-uploads/c106b542-79b3-4713-89e8-647e56b622b2.png" 
                alt="VentaPOS Logo" 
                className="h-8 w-auto object-contain" 
              />
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <img 
                src="https://ventapos.app/lovable-uploads/c106b542-79b3-4713-89e8-647e56b622b2.png" 
                alt="VentaPOS Logo" 
                className="h-8 w-auto object-contain" 
              />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-full p-1 hover:bg-secondary dark:hover:bg-gray-700 transition-colors flex-shrink-0 ml-2"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 sidebar-scrollbar">
          <ul className="space-y-2 px-2 pt-2">
            {filteredItems.map((item) => {
              const isLocked = isPageLocked(item.route);
              return (
                <li 
                  key={item.route} 
                  className={`
                    relative flex items-center px-2 py-2 rounded-md cursor-pointer transition-colors text-sm
                    ${!item.isExternal && location.pathname === item.route 
                      ? 'bg-blue-500 text-white font-medium' 
                      : 'hover:bg-secondary dark:hover:bg-gray-700 text-foreground'
                    }
                    ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}
                  `}
                  onClick={() => handleItemClick(item)}
                >
                  <span className="flex-shrink-0">
                    {React.cloneElement(item.icon as React.ReactElement, { size: 16 })}
                  </span>
                  {!collapsed && (
                    <div className="flex items-center justify-between w-full ml-2">
                      <span className="text-sm">{item.title}</span>
                      {isLocked && (
                        <Lock size={12} className="text-destructive ml-1" />
                      )}
                    </div>
                  )}
                  {collapsed && isLocked && (
                    <Lock size={12} className="text-destructive absolute top-1 right-1" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="p-3 border-t border-border flex items-center justify-between">
          {!collapsed && (
            <div className="text-xs text-muted-foreground font-light italic">
              © 2025 Venta POS
            </div>
          )}
          <div className={`flex items-center gap-2 ${collapsed ? "mx-auto" : ""}`}>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* UnlockDialog removed - now handled by remote control */}
    </>
  );
};

export default Sidebar;
