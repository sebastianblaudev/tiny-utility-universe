
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useReportsData, useCustomersData, calculateTopCustomers } from "@/hooks/useReportsData"

export function CustomersReport() {
  const { data: orders = [], isLoading: ordersLoading } = useReportsData();
  const { data: customers = [], isLoading: customersLoading } = useCustomersData();
  const topCustomers = calculateTopCustomers(orders, customers);

  return (
    <Card className="bg-[#1A1A1A] border-[#333333]">
      <CardHeader>
        <CardTitle className="text-white">Principales Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-[#333333] hover:bg-[#252525]">
              <TableHead className="text-white">Cliente</TableHead>
              <TableHead className="text-right text-white">Pedidos</TableHead>
              <TableHead className="text-right text-white">Total Gastado</TableHead>
              <TableHead className="text-right text-white">Último Pedido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topCustomers.length > 0 ? (
              topCustomers.map((item) => (
                <TableRow key={item.id} className="border-[#333333] hover:bg-[#252525]">
                  <TableCell className="font-medium text-white">{item.name}</TableCell>
                  <TableCell className="text-right text-white">{item.orders}</TableCell>
                  <TableCell className="text-right text-white">${item.spent.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-white">{item.lastOrder}</TableCell>
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
