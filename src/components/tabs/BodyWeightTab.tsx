import { useState } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../store/app'
import { today } from '../../lib/utils'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Btn, DelBtn } from '../ui/Button'

export function BodyWeightTab() {
  const [date, setDate] = useState(today())
  const [weight, setWeight] = useState('')
  const { bodyweight, addBodyweightEntry, removeBodyweightEntry, setToast } = useAppStore()

  const add = async () => {
    if (!weight) return
    try {
      await addBodyweightEntry({ date, weight: +weight })
      setWeight('')
      setToast('✅ Weight logged!')
    } catch (e) {
      setToast('❌ Failed to save.')
    }
  }

  const recent = [...bodyweight].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20)
  const latest = recent[0]
  const prev = recent[1]
  const diff = latest && prev ? (latest.weight - prev.weight).toFixed(1) : null
  const diffColor = !diff ? '#94a3b8' : +diff > 0 ? 'text-danger' : 'text-success'
  const chartData = [...bodyweight]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ date: d.date.slice(5), weight: d.weight }))

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Log Weight</SecTitle>
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Inp label="Weight (kg)" type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70.5" step="0.1" min="0" />
        </div>
        <Btn onClick={add} className="w-full">Add Entry</Btn>
      </Card>

      {latest && (
        <div className="grid grid-cols-2 gap-2.5">
          <Card>
            <p className="text-[11px] text-muted font-semibold uppercase mb-1">Latest</p>
            <p className="text-2xl font-bold text-primary">{latest.weight}<span className="text-sm text-muted font-normal"> kg</span></p>
          </Card>
          <Card>
            <p className="text-[11px] text-muted font-semibold uppercase mb-1">Change</p>
            <p className={`text-2xl font-bold ${diffColor}`}>
              {diff != null ? (+diff > 0 ? `+${diff}` : diff) : '–'}
              <span className="text-sm font-normal"> kg</span>
            </p>
          </Card>
        </div>
      )}

      {chartData.length > 1 && (
        <Card>
          <SecTitle>Trend</SecTitle>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip formatter={(v: number) => [`${v} kg`, 'Weight']} />
              <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card>
        <SecTitle>History</SecTitle>
        {recent.length === 0 ? (
          <EmptyMsg>No entries yet</EmptyMsg>
        ) : (
          recent.map(d => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-bg last:border-0">
              <span className="text-sm text-muted">{d.date}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">{d.weight} kg</span>
                <DelBtn onClick={() => removeBodyweightEntry(d.id)} />
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
