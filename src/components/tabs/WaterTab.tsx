import { useState } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../store/app'
import { today } from '../../lib/utils'
import { Card, SecTitle } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Btn, DelBtn, EditBtn } from '../ui/Button'
import { HistoryList } from '../ui/HistoryList'
import { useCountUp } from '../../hooks/useCountUp'

export function WaterTab() {
  const [date, setDate] = useState(today())
  const [amount, setAmount] = useState('')
  const { water, addWaterEntry, removeWaterEntry, openEditModal, setToast } = useAppStore()

  const add = async () => {
    if (!amount) return
    try {
      await addWaterEntry({ date, amountMl: +amount })
      setAmount('')
      setToast('✅ Water logged!')
    } catch {
      setToast('❌ Failed to save.')
    }
  }

  const sorted = [...water].sort((a, b) => b.date.localeCompare(a.date))
  const todayTotal = water.filter(w => w.date === today()).reduce((s, w) => s + w.amountMl, 0)
  const todayTotalDisplay = Math.round(useCountUp(todayTotal))

  const dailyTotals = new Map<string, number>()
  water.forEach(w => dailyTotals.set(w.date, (dailyTotals.get(w.date) ?? 0) + w.amountMl))
  const chartData = [...dailyTotals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([d, total]) => ({ date: d.slice(5), total }))

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Log Water</SecTitle>
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Inp label="Amount (ml)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="250" step="10" min="0" />
        </div>
        <Btn onClick={add} className="w-full">Add Entry</Btn>
      </Card>

      <Card>
        <p className="text-[11px] text-muted font-semibold uppercase mb-1">Today</p>
        <p className="text-2xl font-bold text-primary">{todayTotalDisplay}<span className="text-sm text-muted font-normal"> ml</span></p>
      </Card>

      {chartData.length > 1 && (
        <Card>
          <SecTitle>Daily Total</SecTitle>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip formatter={(v: number) => [`${v} ml`, 'Water']} />
              <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3, fill: '#0ea5e9' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card>
        <SecTitle>History</SecTitle>
        <HistoryList
          items={sorted}
          getDate={d => d.date}
          emptyMessage="No entries yet"
          renderItem={d => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-bg last:border-0">
              <span className="text-sm text-muted">{d.date}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">{d.amountMl} ml</span>
                <EditBtn onClick={() => openEditModal({ type: 'water', record: d })} />
                <DelBtn onClick={() => removeWaterEntry(d.id)} />
              </div>
            </div>
          )}
        />
      </Card>
    </div>
  )
}
