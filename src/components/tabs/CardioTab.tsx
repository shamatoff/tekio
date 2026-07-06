import { useState } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../store/app'
import { today, parseDurationMins, formatDurationMins, calcPace } from '../../lib/utils'
import { CARDIO_TYPES, CARDIO_ICONS } from '../../constants/app'
import { Card, SecTitle } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Btn, DelBtn, EditBtn } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { HistoryList } from '../ui/HistoryList'
import type { CardioType } from '../../types'

export function CardioTab() {
  const [type, setType] = useState<CardioType>('Running')
  const [date, setDate] = useState(today())
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [avgHr, setAvgHr] = useState('')
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState('All')
  const { cardio, addCardioEntry, removeCardioEntry, openEditModal, setToast } = useAppStore()

  const durationMins = parseDurationMins(duration)
  const distKm = distance ? +distance : 0
  const livePace = calcPace(durationMins, distKm)

  const add = async () => {
    if (!durationMins) return
    try {
      await addCardioEntry({
        date, type, duration: durationMins,
        distance: distKm || undefined,
        avgHr: avgHr ? +avgHr : undefined,
        notes: notes || undefined,
      })
      setDuration(''); setDistance(''); setAvgHr(''); setNotes('')
      setToast('✅ Session logged!')
    } catch {
      setToast('❌ Failed to save.')
    }
  }

  const ct = filter === 'All' ? 'Running' : filter
  const chartData = cardio
    .filter(d => d.type === ct)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date.slice(5),
      duration: +d.duration.toFixed(2),
      ...(d.distance ? { distance: d.distance, pace: +(d.duration / d.distance).toFixed(2) } : {}),
    }))

  const allSorted = [...cardio].sort((a, b) => b.date.localeCompare(a.date))

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
          <div>
            <Inp
              label="Duration (MM:SS)"
              type="text"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="30:00"
            />
          </div>
          <div>
            <Inp
              label="Distance (km, opt.)"
              type="number"
              value={distance}
              onChange={e => setDistance(e.target.value)}
              placeholder="5.0"
              step="0.01"
            />
            {livePace && (
              <p className="text-xs text-accent font-medium mt-1">⚡ {livePace}</p>
            )}
          </div>
          <div>
            <Inp
              label="Avg HR (bpm, opt.)"
              type="number"
              value={avgHr}
              onChange={e => setAvgHr(e.target.value)}
              placeholder="145"
              min="0"
              step="1"
            />
          </div>
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
              {chartData.some(d => d.distance) && (
                <Line type="monotone" dataKey="pace" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Pace (min/km)" />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted text-center py-8">Not enough data to chart yet</p>
        )}
      </Card>

      <Card>
        <SecTitle>Sessions</SecTitle>
        <HistoryList
          items={allSorted}
          getDate={d => d.date}
          categories={[...CARDIO_TYPES]}
          categoryLabel="Type"
          matchesCategory={(d, cat) => d.type === cat}
          emptyMessage="No sessions yet"
          renderItem={d => (
            <div key={d.id} className="pb-2 mb-2 border-b border-bg last:border-0 last:mb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{CARDIO_ICONS[d.type]}</span>
                  <span className="text-sm font-semibold text-primary">{d.type}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">{d.date}</span>
                  <EditBtn onClick={() => openEditModal({ type: 'cardio', record: d })} />
                  <DelBtn onClick={() => removeCardioEntry(d.id)} />
                </div>
              </div>
              <p className="text-xs text-muted mt-0.5 ml-0.5">
                {formatDurationMins(d.duration)}
                {d.distance ? ` · ${d.distance} km · ${calcPace(d.duration, d.distance)}` : ''}
                {d.avgHr ? ` · ❤️ ${d.avgHr} bpm` : ''}
                {d.notes ? ` — ${d.notes}` : ''}
              </p>
            </div>
          )}
        />
      </Card>
    </div>
  )
}
