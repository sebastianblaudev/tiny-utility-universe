
import { Link } from "react-router-dom"
import { Home, Pizza, Users, Clock, List, Wallet, BarChart, Tag, Settings2, Save, Truck, UploadCloud } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Auth } from "@/lib/auth"

// Define an interface for menu items to include the adminOnly property
interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  {
    title: "Inicio",
    url: "/",
    icon: Home,
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
    icon: List,
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
  {
    title: "Ajustes",
    url: "/settings",
    icon: Settings2,
    adminOnly: true,
  },
]

export function AppSidebar() {
  const auth = Auth.getInstance();
  const isAdmin = auth.isAdmin();
  
  // Filter menu items based on admin status
  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <Sidebar variant="inset">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
