
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useReportsData, calculateMonthlyRevenue } from "@/hooks/useReportsData"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"

export function RevenueChart() {
  const { data: orders = [], isLoading, error } = useReportsData();
  const { toast } = useToast();
  const data = calculateMonthlyRevenue(orders);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de ingresos mensuales",
        variant: "destructive",
      });
    }
    
    if (orders.length > 0) {
      console.log("Monthly revenue data calculated:", data);
    }
  }, [error, orders, data, toast]);

  if (isLoading) {
    return (
      <Card className="bg-[#1A1A1A] border-[#333333]">
        <CardHeader>
          <CardTitle className="text-white">Ingresos Mensuales</CardTitle>
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
          <CardTitle className="text-white">Ingresos Mensuales</CardTitle>
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
        <CardTitle className="text-white">Ingresos Mensuales</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
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
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Ingresos']}
              labelFormatter={(label) => `Mes: ${label}`}
              contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
              itemStyle={{ color: '#FF6B00' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#FF6B00"
              strokeWidth={2}
              dot={{ fill: "#FF6B00" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
