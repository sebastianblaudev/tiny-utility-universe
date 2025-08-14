
import { PageTitle } from "@/components/ui/page-title";

/**
 * Example of how to use the PageTitle component
 * 
 * Usage example:
 * import { PageTitle } from "@/components/ui/page-title";
 * 
 * <PageTitle>Título de la Página</PageTitle>
 * 
 * With subtitle:
 * <PageTitle subtitle="Esta es una descripción de la página">
 *   Título de la Página
 * </PageTitle>
 */
export function PageTitleExample() {
  return (
    <div className="space-y-8">
      <PageTitle>Punto de Venta</PageTitle>
      
      <PageTitle subtitle="Gestiona tus productos y categorías">
        Inventario
      </PageTitle>
      
      <PageTitle subtitle="Revisa el historial de ventas y transacciones">
        Historial de Ventas
      </PageTitle>
      
      <PageTitle className="text-blue-600 dark:text-blue-400">
        Título con Color Personalizado
      </PageTitle>
    </div>
  );
}
