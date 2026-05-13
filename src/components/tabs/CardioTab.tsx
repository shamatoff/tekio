import { useState } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../store/app'
import { today } from '../../lib/utils'
import { CARDIO_TYPES, CARDIO_ICONS } from '../../constants/app'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Btn, DelBtn } from '../ui/Button'
import { Chip } from '../ui/Chip'
import type { CardioType } from '../../types'

export function CardioTab() {
  const [type, setType] = useState<CardioType>('Running')
  const [date, setDate] = useState(today())
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState('All')
  const { cardio, addCardioEntry, removeCardioEntry, setToast } = useAppStore()

  const add = async () => {
    if (!duration) return
    try {
      await addCardioEntry({
        date, type, duration: +duration,
        distance: distance ? +distance : undefined,
        notes: notes || undefined,
      })
      setDuration(''); setDistance(''); setNotes('')
      setToast('✅ Session logged!')
    } catch {
      setToast('❌ Failed to save.')
    }
  }

  const ct = filter === 'All' ? 'Running' : filter
  const chartData = cardio
    .filter(d => d.type === ct)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ date: d.date.slice(5), duration: d.duration, ...(d.distance ? { distance: d.distance } : {}) }))

  const shown = (filter === 'All' ? cardio : cardio.filter(d => d.type === filter))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 25)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Log Session</SecTitle>
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div>
            <p className="text-xs text-muted font-medium mb-1">Type</p>
            <select
              value={type}
              onChange={e => setType(e.target.value as CardioType)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              {CARDIO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Inp label="Duration (min)" type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" />
          <Inp label="Distance (km, opt.)" type="number" value={distance} onChange={e => setDistance(e.target.value)} placeholder="5.0" step="0.01" />
          <div className="col-span-2">
            <Inp label="Notes (opt.)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Easy zone 2" />
          </div>
        </div>
        <Btn onClick={add} className="w-full">Add Session</Btn>
      </Card>

      <Card>
        <SecTitle>Progress</SecTitle>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {['All', ...CARDIO_TYPES].map(t => (
            <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>
              {t === 'All' ? 'All' : `${CARDIO_ICONS[t]} ${t}`}
            </Chip>
          ))}
        </div>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip />
              <Line type="monotone" dataKey="duration" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Duration (min)" />
              {chartData.some(d => (d as { distance?: number }).distance) && (
                <Line type="monotone" dataKey="distance" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Distance (km)" />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted text-center py-8">Not enough data to chart yet</p>
        )}
      </Card>

      <Card>
        <SecTitle>Sessions</SecTitle>
        {shown.length === 0 ? (
          <EmptyMsg>No sessions yet</EmptyMsg>
        ) : (
          shown.map(d => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-bg last:border-0">
              <div>
                <span className="text-base mr-1.5">{CARDIO_ICONS[d.type]}</span>
                <span className="text-sm font-medium text-primary">{d.type}</span>
                <span className="text-xs text-muted ml-2">{d.duration}min{d.distance ? ` · ${d.distance}km` : ''}</span>
                {d.notes && <span className="text-xs text-muted italic ml-1.5">— {d.notes}</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted">{d.date}</span>
                <DelBtn onClick={() => removeCardioEntry(d.id)} />
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
