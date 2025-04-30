
import { Link } from "react-router-dom"
import { Home, Pizza, Users, Clock, List, Wallet, BarChart, Tag, Settings2, Save } from "lucide-react"
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

const menuItems = [
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
    title: "Ajustes",
    url: "/settings",
    icon: Settings2,
  },
]

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
