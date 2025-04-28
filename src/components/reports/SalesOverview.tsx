
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useReportsData, calculateDailyStats } from "@/hooks/useReportsData"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"

export function SalesOverview() {
  const { data: orders = [], isLoading, error } = useReportsData();
  const { toast } = useToast();
  const data = calculateDailyStats(orders);
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de ventas diarias",
        variant: "destructive",
      });
    }
    
    if (orders.length > 0) {
      console.log("Daily sales data calculated:", data);
    }
  }, [error, orders, data, toast]);

  if (isLoading) {
    return (
      <Card className="bg-[#1A1A1A] border-[#333333]">
        <CardHeader>
          <CardTitle className="text-white">Resumen de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full bg-[#333333]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#1A1A1A] border-[#333333]">
        <CardHeader>
          <CardTitle className="text-white">Resumen de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400">Error al cargar los datos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1A1A1A] border-[#333333]">
      <CardHeader>
        <CardTitle className="text-white">Resumen de Ventas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Ventas']}
              labelFormatter={(label) => `Día: ${label}`}
              contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
              itemStyle={{ color: '#FF6B00' }}
            />
            <Bar
              dataKey="total"
              fill="#FF6B00"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
