
import { Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Link, useNavigate } from "react-router-dom"
import { Auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

const menuItems = [
  {
    title: "Inicio",
    url: "/",
  },
  {
    title: "Productos",
    url: "/products",
  },
  {
    title: "Categorías",
    url: "/categories",
  },
  {
    title: "Clientes",
    url: "/customers",
  },
  {
    title: "Historial",
    url: "/history",
  },
  {
    title: "Ingredientes",
    url: "/ingredients",
  },
  {
    title: "Caja",
    url: "/shifts",
  },
  {
    title: "Reportes",
    url: "/reports",
  },
  {
    title: "Ajustes",
    url: "/settings",
  },
]

export function MenuDrawer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = Auth.getInstance();

  const handleLogout = () => {
    auth.logout();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    navigate("/login");
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333]"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-[#111111] border-[#333333]">
        <DrawerHeader>
          <DrawerTitle className="text-white">Menú</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                className="flex items-center px-4 py-2 text-white rounded-md hover:bg-[#252525] transition-colors"
              >
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
        </div>
      </DrawerContent>
    </Drawer>
  )
}
