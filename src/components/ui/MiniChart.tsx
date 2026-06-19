import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip } from 'recharts'

interface MiniChartProps {
  data: { x: string; y: number }[]
  color?: string
}

export function MiniChart({ data, color = '#6366f1' }: MiniChartProps) {
  if (data.length < 2) return null
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ fontSize: 11, padding: '2px 6px', borderRadius: 6 }}
          formatter={(v: number) => [v, '']}
          labelFormatter={() => ''}
        />
        <Line
          type="monotone"
          dataKey="y"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
