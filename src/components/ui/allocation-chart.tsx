'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { AllocationData } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface AllocationChartProps {
  data: AllocationData[]
  totalValue: number
}

export function AllocationChart({ data, totalValue }: AllocationChartProps) {
  const RADIAN = Math.PI / 180

  // Custom label for pie chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    if (percent < 0.05) return null // Don't show label for small segments

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="#fafafa"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-barbar-card border border-barbar-border rounded-lg p-3 shadow-xl">
          <p className="font-medium text-barbar-text">{data.name}</p>
          <p className="text-sm text-barbar-muted">
            {formatCurrency(data.value, 'TRY')}
          </p>
          <p className="text-sm" style={{ color: data.color }}>
            {((data.value / totalValue) * 100).toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-barbar-muted">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
