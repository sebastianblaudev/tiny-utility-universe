
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useReportsData, calculateTopProducts } from "@/hooks/useReportsData"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"
import { queryClient } from "@/lib/query-client"
import { useQuery } from "@tanstack/react-query"
import { openDB } from "idb"
import { DB_NAME } from "@/lib/query-client"

// Actualizado a la versión 9 para coincidir con la versión actual de la DB
const DB_VERSION = 9;

// Create a local useProductsData hook that matches what ProductsReport expects
function useProductsData() {
  const fetchProducts = async () => {
    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const products = await db.getAll('products');
      console.log("Fetched products from DB:", products.length);
      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  };

  const query = useQuery({
    queryKey: ['products-data'],
    queryFn: fetchProducts,
  });

  return {
    ...query,
    refetch: query.refetch
  };
}

export function ProductsReport() {
  const { data: orders = [], refetch: refetchOrders } = useReportsData();
  const { data: products = [], refetch: refetchProducts } = useProductsData();
  const topProducts = calculateTopProducts(orders, products);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['products-data'] });
    queryClient.invalidateQueries({ queryKey: ['reports-data'] });
    refetchOrders();
    refetchProducts();
  };

  return (
    <Card className="bg-[#1A1A1A] border-[#333333]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Rendimiento de Productos</CardTitle>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          className="border-[#333333] text-white hover:bg-[#333333]"
        >
          <RefreshCcw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-[#333333] hover:bg-[#252525]">
              <TableHead className="text-white">Producto</TableHead>
              <TableHead className="text-right text-white">Unidades Vendidas</TableHead>
              <TableHead className="text-right text-white">Ingresos</TableHead>
              <TableHead className="text-right text-white">Beneficio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topProducts.length > 0 ? (
              topProducts.map((item) => (
                <TableRow key={item.id} className="border-[#333333] hover:bg-[#252525]">
                  <TableCell className="font-medium text-white">{item.name}</TableCell>
                  <TableCell className="text-right text-white">{item.sales}</TableCell>
                  <TableCell className="text-right text-white">${item.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-white">${item.profit.toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="border-[#333333]">
                <TableCell colSpan={4} className="text-center text-white py-4">
                  No hay datos disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
