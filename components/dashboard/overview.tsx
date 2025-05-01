"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Lun",
    total: 320000,
  },
  {
    name: "Mar",
    total: 280000,
  },
  {
    name: "Mié",
    total: 410000,
  },
  {
    name: "Jue",
    total: 350000,
  },
  {
    name: "Vie",
    total: 520000,
  },
  {
    name: "Sáb",
    total: 680000,
  },
  {
    name: "Dom",
    total: 450000,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₡${value / 1000}k`}
        />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}
