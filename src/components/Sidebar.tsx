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
  Video
} from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { toggleMenuItemLock } from '@/integrations/supabase/client';
import UnlockDialog from './UnlockDialog';
import { toast } from 'sonner';
import { getBusinessInfoForReceipt } from '@/utils/ticketUtils';
import { LogoutButton } from './LogoutButton';

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  route: string;
  isExternal?: boolean;
  roles?: ('admin' | 'cashier')[];
  showWhen?: () => Promise<boolean>;
}

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, lockedMenuItems, refreshLockedItems } = useAuth();
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
      title: "Configuración",
      icon: <Settings size={20} />,
      route: "/configuracion",
      roles: ['admin']
    },
    {
      title: "Dashboard Móvil",
      icon: <LayoutDashboard size={20} />,
      route: "/mobile-dashboard",
      roles: ['admin']
    },
    {
      title: "Panel",
      icon: <LayoutDashboard size={20} />,
      route: "/dashboard",
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

  useEffect(() => {
    const filterItems = async () => {
      const result = [];
      
      for (const item of sidebarItems) {
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
  }, [userRole, location.pathname]);

  const handleItemClick = (item: SidebarItem) => {
    if (lockedMenuItems.includes(item.route) && !item.isExternal) {
      setUnlockingItem(item);
      setIsDialogOpen(true);
      return;
    }

    if (item.isExternal) {
      window.open(item.route, '_blank');
    } else {
      navigate(item.route);
    }
  };

  const handleLockToggle = async (item: SidebarItem, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const isCurrentlyLocked = lockedMenuItems.includes(item.route);
    
    if (isCurrentlyLocked) {
      setUnlockingItem(item);
      setIsDialogOpen(true);
    } else {
      try {
        const result = await toggleMenuItemLock(item.route);
        if (result) {
          await refreshLockedItems();
          toast.success(`${item.title} bloqueado`, {
            description: "Se ha bloqueado el acceso a esta funcionalidad."
          });
        } else {
          toast.error("No se pudo bloquear el elemento");
        }
      } catch (error) {
        console.error("Error toggling lock:", error);
        toast.error("Ocurrió un error al intentar bloquear el elemento");
      }
    }
  };

  const handleSuccessfulUnlock = async () => {
    if (!unlockingItem) return;
    
    try {
      const result = await toggleMenuItemLock(unlockingItem.route);
      if (result) {
        await refreshLockedItems();
      } else {
        toast.error("No se pudo desbloquear el elemento");
      }
    } catch (error) {
      console.error("Error unlocking item:", error);
      toast.error("Ocurrió un error al intentar desbloquear el elemento");
    }
  };

  return (
    <>
      <div 
        className={`sidebar-elite h-full ${
          collapsed ? 'w-16' : 'w-64'
        } transition-all duration-500 ease-in-out flex flex-col z-10`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50 glass-elite">
          {!collapsed ? (
            <div className="flex flex-col items-start">
              <div className="brand-elite text-2xl font-bold">
                VentaPOS Elite
              </div>
              <div className="text-xs text-muted-foreground font-light">
                Premium Point of Sale
              </div>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <div className="brand-elite text-xl font-bold">
                VE
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn-elite-secondary p-2 rounded-full hover:scale-110 transition-all duration-300"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 scrollbar-elite">
          <ul className="space-y-3 px-4">
            {filteredItems.map((item) => {
              const isLocked = lockedMenuItems.includes(item.route);
              const isActive = !item.isExternal && location.pathname === item.route;
              return (
                <li 
                  key={item.route} 
                  className={`
                    sidebar-item-elite relative flex items-center px-4 py-3 cursor-pointer text-sm font-medium
                    ${isActive 
                      ? 'active text-primary-foreground' 
                      : 'text-sidebar-foreground hover:text-primary-foreground'
                    }
                    ${isLocked ? 'opacity-60' : ''}
                  `}
                  onClick={() => handleItemClick(item)}
                >
                  <span className="flex-shrink-0 animate-elite-float">
                    {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="ml-4 text-sm font-medium tracking-wide">{item.title}</span>
                      {userRole === 'admin' && !item.isExternal && (
                        <button
                          onClick={(e) => handleLockToggle(item, e)}
                          className={`
                            absolute right-2 p-1 rounded-full transition-all duration-300
                            ${isLocked 
                              ? 'text-destructive hover:bg-destructive/20 hover:scale-110' 
                              : 'text-accent hover:bg-accent/20 hover:scale-110'
                            }
                          `}
                          title={isLocked ? "Desbloquear" : "Bloquear"}
                        >
                          {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      )}
                      {isActive && (
                        <div className="status-elite-active absolute right-0 top-1/2 transform -translate-y-1/2"></div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="p-4 border-t border-border/50 glass-elite flex items-center justify-between">
          {!collapsed && (
            <div className="text-xs text-muted-foreground font-light">
              <div className="brand-elite text-sm">© 2025 VentaPOS</div>
              <div className="text-xs opacity-60">Elite Edition</div>
            </div>
          )}
          <div className={`flex items-center gap-3 ${collapsed ? "mx-auto" : ""}`}>
            <div className="btn-elite-secondary p-2 rounded-full">
              <ThemeToggle />
            </div>
            <div className="btn-elite-secondary rounded-full">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {unlockingItem && (
        <UnlockDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setUnlockingItem(null);
          }}
          onUnlock={handleSuccessfulUnlock}
          itemName={unlockingItem.title}
        />
      )}
    </>
  );
};

export default Sidebar;
