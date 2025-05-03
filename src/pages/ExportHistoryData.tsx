
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { initDB } from "@/lib/db";
import { toast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

export default function ExportHistoryData() {
  const [isExporting, setIsExporting] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['export-orders'],
    queryFn: async () => {
      try {
        const db = await initDB();
        const tx = db.transaction('orders', 'readonly');
        const store = tx.objectStore('orders');
        const allOrders = await store.getAll();
        return allOrders;
      } catch (error) {
        console.error("Error al obtener órdenes para exportar:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos para exportar",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const exportToCSV = () => {
    try {
      setIsExporting(true);
      
      // Prepare data for CSV
      const headers = ["ID", "# Orden", "Fecha", "Cliente", "Total", "Método de Pago", "Estado"];
      const rows = orders.map(order => [
        order.id,
        `#${order.id.slice(-4)}`,
        new Date(order.createdAt).toLocaleString(),
        order.customerName || order.customerId || 'Cliente Ocasional',
        order.total.toFixed(2),
        order.paymentMethod || 'No especificado',
        order.status || 'Completado'
      ]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `historial-ventas-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportación completada",
        description: `Se exportaron ${orders.length} registros de ventas`,
      });
    } catch (error) {
      console.error("Error al exportar datos:", error);
      toast({
        title: "Error en la exportación",
        description: "No se pudieron exportar los datos",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4">
      <Card className="bg-[#1A1A1A] border-[#333333] p-4">
        <h2 className="text-xl font-bold mb-4 text-white">Exportar Datos de Ventas</h2>
        <p className="text-zinc-400 mb-4">
          Exporta el historial completo de ventas en formato CSV para utilizar en Excel u otras herramientas.
        </p>
        <Button 
          onClick={exportToCSV} 
          disabled={isExporting || orders.length === 0}
          className="bg-[#FF9500] hover:bg-[#CC7A00] text-black"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exportando..." : `Exportar ${orders.length} registros`}
        </Button>
      </Card>
    </div>
  );
}
