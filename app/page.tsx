"use client"

import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600"></div>
            <span className="text-xl font-bold">TicoPOS</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Características
            </a>
            <a
              href="#businesses"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Tipos de Negocio
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Precios
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contacto
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => redirect("/login")}>
              Iniciar Sesión
            </Button>
            <Button onClick={() => redirect("/register")}>Registrarse</Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Sistema POS de Clase Mundial para Costa Rica
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Optimizado para negocios costarricenses, con facturación electrónica integrada y adaptable a
                    cualquier tipo de comercio.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" onClick={() => redirect("/demo")}>
                    Solicitar Demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => redirect("/plans")}>
                    Ver Planes
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[600px] aspect-video overflow-hidden rounded-xl border bg-background shadow-xl">
                  <img
                    src="/placeholder.svg?height=600&width=800"
                    alt="TicoPOS Dashboard Preview"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  Características Premium
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Todo lo que necesita su negocio</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  TicoPOS ofrece todas las funcionalidades que un negocio moderno necesita, con especial atención a los
                  requerimientos locales.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Facturación Electrónica",
                  description:
                    "Integración completa con el sistema tributario de Costa Rica, cumpliendo todas las normativas del Ministerio de Hacienda.",
                },
                {
                  title: "Gestión de Inventario",
                  description:
                    "Control completo de su inventario con alertas de stock, múltiples bodegas y trazabilidad de productos.",
                },
                {
                  title: "Reportes Avanzados",
                  description:
                    "Análisis detallados de ventas, inventario, clientes y más para tomar decisiones informadas.",
                },
                {
                  title: "Multi-moneda",
                  description:
                    "Manejo de colones, dólares y otras divisas con conversión automática según tipo de cambio actualizado.",
                },
                {
                  title: "Fidelización de Clientes",
                  description: "Sistema de puntos, descuentos y promociones para mantener a sus clientes regresando.",
                },
                {
                  title: "Múltiples Terminales",
                  description: "Soporte para múltiples puntos de venta sincronizados en tiempo real.",
                },
              ].map((feature, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="businesses" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  Versatilidad
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Para todo tipo de negocios</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  TicoPOS se adapta a las necesidades específicas de diferentes industrias y tamaños de negocio.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 py-12">
              {[
                {
                  title: "Restaurantes y Cafeterías",
                  description: "Gestión de mesas, comandas, división de cuentas y control de cocina.",
                },
                {
                  title: "Tiendas Minoristas",
                  description: "Control de inventario, múltiples tallas y colores, y gestión de promociones.",
                },
                {
                  title: "Supermercados",
                  description: "Manejo de grandes volúmenes de productos, múltiples cajas y control de perecederos.",
                },
                {
                  title: "Farmacias",
                  description: "Control de lotes, fechas de vencimiento y recetas médicas.",
                },
                {
                  title: "Servicios Profesionales",
                  description: "Facturación de servicios, citas y seguimiento de clientes.",
                },
                {
                  title: "Distribuidores",
                  description: "Gestión de rutas, pedidos y entregas con control de vendedores.",
                },
              ].map((business, index) => (
                <div key={index} className="flex flex-col items-center rounded-xl border bg-background p-6 shadow-lg">
                  <div className="mb-4 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center dark:bg-gray-800">
                    <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold">{business.title}</h3>
                  <p className="mt-2 text-center text-gray-500 dark:text-gray-400">{business.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-gray-100 dark:bg-gray-900">
        <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:py-12">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600"></div>
            <span className="text-xl font-bold">TicoPOS</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} TicoPOS. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
              Términos
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
              Privacidad
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
