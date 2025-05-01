import type { Metadata } from "next"
import DashboardPageClient from "./dashboard-page-client"

export const metadata: Metadata = {
  title: "Dashboard | TicoPOS",
  description: "Panel de control principal del sistema TicoPOS",
}

export default function DashboardPage() {
  return <DashboardPageClient />
}
