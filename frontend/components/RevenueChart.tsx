'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface RevenueChartProps {
  data: Array<{
    date: string
    orders: number
    revenue: number
  }>
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => {
            const date = new Date(value)
            return `${date.getMonth() + 1}/${date.getDate()}`
          }}
        />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === 'revenue') {
              return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Revenue']
            }
            return [value, name === 'orders' ? 'Orders' : name]
          }}
          labelFormatter={(label) => {
            const date = new Date(label)
            return date.toLocaleDateString()
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="orders"
          stroke="#8884d8"
          name="Orders"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          stroke="#82ca9d"
          name="Revenue"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

