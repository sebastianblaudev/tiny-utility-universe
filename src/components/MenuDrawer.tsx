
import { Menu, LogOut, Store, Clock, Utensils, Tag, Pizza, Users, BarChart, Save, Settings2, Wallet, Truck, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { Auth } from "@/lib/auth"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function MenuDrawer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const auth = Auth.getInstance();
  const isAdmin = auth.isAdmin();

  // Menú completo para administradores
  const adminMenuItems = [
    {
      title: "Inicio",
      url: "/",
      icon: Store,
    },
    {
      title: "Productos",
      url: "/products",
      icon: Pizza,
    },
    {
      title: "Categorías",
      url: "/categories",
      icon: Tag,
    },
    {
      title: "Clientes",
      url: "/customers",
      icon: Users,
    },
    {
      title: "Historial",
      url: "/history",
      icon: Clock,
    },
    {
      title: "Ingredientes",
      url: "/ingredients",
      icon: Utensils,
    },
    {
      title: "Caja",
      url: "/shifts",
      icon: Wallet,
    },
    {
      title: "Reportes",
      url: "/reports",
      icon: BarChart,
    },
    {
      title: "Ajustes",
      url: "/settings",
      icon: Settings2,
    },
    {
      title: "Respaldos",
      url: "/backups",
      icon: Save,
    },
    {
      title: "Delivery",
      url: "/delivery-tracking",
      icon: Truck,
    },
    {
      title: "Sincronización",
      url: "/sync",
      icon: UploadCloud,
    },
  ];

  // Menú limitado para cajeros
  const cashierMenuItems = [
    {
      title: "Inicio",
      url: "/",
      icon: Store,
    },
    {
      title: "Clientes",
      url: "/customers",
      icon: Users,
    },
    {
      title: "Caja",
      url: "/shifts",
      icon: Wallet,
    },
    {
      title: "Delivery",
      url: "/delivery-tracking",
      icon: Truck,
    },
    {
      title: "Sincronización",
      url: "/sync",
      icon: UploadCloud,
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : cashierMenuItems;

  const handleLogout = async () => {
    await logout();
    // No need to navigate here as the logout function will redirect to the PIN login page
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333]"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[33%] sm:max-w-[33%] bg-[#111111] border-[#333333]">
        <SheetHeader>
          <SheetTitle className="text-white">
            {isAdmin ? "Panel de Administrador" : "Panel de Cajero"}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[70vh] mt-4">
          <nav className="space-y-2 px-2">
            {menuItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                className="flex items-center px-4 py-2 text-white rounded-md hover:bg-[#252525] transition-colors"
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.title}
              </Link>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-2 text-white hover:bg-[#252525] transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
