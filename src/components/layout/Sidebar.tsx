import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSupabaseAuth } from "../../contexts/SupabaseAuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LucideIcon,
  LayoutDashboard,
  Banknote,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Scissors,
  ScrollText,
  CreditCard,
  DollarSign,
  BarChart3,
  Receipt,
  FileSpreadsheet,
  Building,
  LogOut,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const SidebarItem = ({
  icon: Icon,
  label,
  path,
  active,
  collapsed,
  onClick,
  disabled = false,
}: SidebarItemProps) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant={active ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2 text-white hover:bg-gray-700 hover:text-white",
              collapsed && "justify-center px-2",
              active && "bg-gray-700 text-white font-medium",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={onClick}
            disabled={disabled}
          >
            <Icon className="h-5 w-5 text-white" />
            {!collapsed && <span className="text-white">{label}</span>}
          </Button>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

interface NavigationItem {
  icon: LucideIcon;
  label: string;
  path: string;
  requireAdmin?: boolean;
  requireOwner?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: Banknote,
    label: "POS",
    path: "/pos",
    requireAdmin: true,
  },
  {
    icon: Users,
    label: "Usuarios",
    path: "/users",
    requireAdmin: true,
  },
  {
    icon: Scissors,
    label: "Servicios",
    path: "/services",
    requireAdmin: true,
  },
  {
    icon: CreditCard,
    label: "Adelantos",
    path: "/advances",
    requireAdmin: true,
  },
  {
    icon: BarChart3,
    label: "Reportes",
    path: "/reports",
    requireAdmin: true,
  },
  {
    icon: DollarSign,
    label: "Comisiones",
    path: "/commissions",
    requireAdmin: true,
  },
  {
    icon: Receipt,
    label: "Gastos",
    path: "/expenses",
    requireAdmin: true,
  },
  {
    icon: FileSpreadsheet,
    label: "Informes Financieros",
    path: "/financial-reports",
    requireAdmin: true,
  },
  {
    icon: Settings,
    label: "Configuración",
    path: "/settings",
    requireAdmin: true,
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAdmin, isOwner, logout } = useAuth();
  const { signOut } = useSupabaseAuth();
  
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    // Auto-collapse on mobile
    if (isMobile) {
      setCollapsed(true);
    } else {
      setCollapsed(localStorage.getItem("sidebarCollapsed") === "true");
    }
  }, [isMobile]);
  
  const toggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem("sidebarCollapsed", String(newCollapsed));
  };
  
  const handleChangeUser = async () => {
    try {
      console.log('Starting user change process...');
      
      // Only logout from local auth context, keep Supabase session
      logout();
      console.log('Local logout completed for user change');
      
      // Navigate to login page (PIN entry)
      navigate('/login', { replace: true });
      console.log('Navigation to login completed for user change');
    } catch (error) {
      console.error('Error during user change:', error);
      // Even if there's an error, try to navigate to login
      navigate('/login', { replace: true });
    }
  };
  
  const handleSignOut = async () => {
    try {
      console.log('Starting logout process...');
      
      // First logout from local auth context
      logout();
      console.log('Local logout completed');
      
      // Then logout from Supabase
      await signOut();
      console.log('Supabase logout completed');
      
      // Navigate to login page
      navigate('/login', { replace: true });
      console.log('Navigation to login completed');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, try to navigate to login
      navigate('/login', { replace: true });
    }
  };
  
  // Filter navigation items based on permissions
  const filteredNavItems = navigationItems.filter(item => {
    if (item.requireOwner && !isOwner) {
      return false;
    }
    
    if (item.requireAdmin && !isAdmin) {
      return false;
    }
    
    return true;
  });
  
  return (
    <div
      className={cn(
        "flex flex-col h-full py-4 bg-gray-900 border-r border-gray-700 transition-all",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between px-4 mb-6">
        {!collapsed && (
          <div className="flex items-center">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/37y33OJ-clLqDjKmKEn8VUHgWWwNkNEj4nv5RZ.png" 
              alt="BarberPOS Logo" 
              className="h-11 w-auto"
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn("ml-auto text-white hover:bg-gray-700 hover:text-white", collapsed && "mx-auto")}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-white" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-white" />
          )}
        </Button>
      </div>
      <div className="flex-1 space-y-1 px-3">
        {filteredNavItems.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={location.pathname === item.path}
            collapsed={collapsed}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
      
      {/* User actions at the bottom */}
      <div className="px-3 mt-4 border-t border-gray-700 pt-4 space-y-1">
        <SidebarItem
          icon={UserRound}
          label="Cambiar usuario"
          path="/login"
          collapsed={collapsed}
          onClick={handleChangeUser}
        />
        <SidebarItem
          icon={LogOut}
          label="Cerrar sesión"
          path="/login"
          collapsed={collapsed}
          onClick={handleSignOut}
        />
      </div>
    </div>
  );
};

export default Sidebar;
