'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { AllocationData } from '@/types'
import { formatCurrency } from '@/lib/utils'

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
            {formatCurrency(data.value, 'TRY', true)}
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
    <div className="w-full overflow-hidden">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={50}
              outerRadius={85}
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
      </div>

      {/* Legend - wrapped and contained */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-barbar-muted whitespace-nowrap">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
