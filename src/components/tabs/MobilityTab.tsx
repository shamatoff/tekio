import { useState } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../store/app'
import { today } from '../../lib/utils'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Btn, DelBtn } from '../ui/Button'
import { SmartInput } from '../ui/SmartInput'
import type { MobilityExercise } from '../../types'

function emptyExercise(): MobilityExercise {
  return { name: '', duration: 0, notes: '' }
}

export function MobilityTab() {
  const [date, setDate] = useState(today())
  const [exercises, setExercises] = useState<MobilityExercise[]>([emptyExercise()])
  const [revealedEx, setRevealedEx] = useState(1)
  const [selEx, setSelEx] = useState('')
  const { mobility, addMobilityEntry, removeMobilityEntry, setToast } = useAppStore()

  const allExNames = [...new Set(mobility.flatMap(m => m.exercises.map(e => e.name)))].sort()

  const updateEx = (i: number, field: keyof MobilityExercise, value: string | number) => {
    setExercises(prev => prev.map((e, j) => j === i ? { ...e, [field]: value } : e))
  }

  const add = async () => {
    const valid = exercises.filter(e => e.name.trim() && e.duration > 0)
    if (valid.length === 0) return
    try {
      await addMobilityEntry({ date, exercises: valid, duration: valid.reduce((s, e) => s + e.duration, 0) })
      setExercises([emptyExercise()])
      setRevealedEx(1)
      setToast('✅ Session logged!')
    } catch {
      setToast('❌ Failed to save.')
    }
  }

  const chartEx = selEx || allExNames[0] || ''
  const chartData = mobility
    .filter(m => m.exercises.some(e => e.name === chartEx))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(m => ({
      date: m.date.slice(5),
      duration: m.exercises.find(e => e.name === chartEx)?.duration ?? 0,
    }))

  const recent = [...mobility].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Log Session</SecTitle>
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} className="mb-3" />

        {exercises.slice(0, revealedEx).map((ex, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_1fr] gap-2 mb-2 items-end">
            <SmartInput
              value={ex.name}
              onChange={v => updateEx(i, 'name', v)}
              suggestions={allExNames}
              placeholder={`Exercise ${i + 1}`}
            />
            <Inp
              type="number"
              value={ex.duration || ''}
              onChange={e => updateEx(i, 'duration', +e.target.value)}
              placeholder="min"
              min="1"
            />
            <Inp
              value={ex.notes}
              onChange={e => updateEx(i, 'notes', e.target.value)}
              placeholder="Notes"
            />
          </div>
        ))}

        <div className="flex gap-2 mt-2">
          {revealedEx < 8 && (
            <Btn
              variant="secondary"
              small
              onClick={() => {
                if (revealedEx >= exercises.length) setExercises(p => [...p, emptyExercise()])
                setRevealedEx(r => r + 1)
              }}
            >
              + Add Exercise
            </Btn>
          )}
          <Btn onClick={add} className="flex-1">Log Session</Btn>
        </div>
      </Card>

      {allExNames.length > 0 && (
        <Card>
          <SecTitle>Progress — {chartEx}</SecTitle>
          <select
            value={chartEx}
            onChange={e => setSelEx(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary mb-3 focus:outline-none"
          >
            {allExNames.map(n => <option key={n}>{n}</option>)}
          </select>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(v: number) => [`${v} min`, 'Duration']} />
                <Line type="monotone" dataKey="duration" stroke="#6366f1" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted text-center py-6">Not enough data to chart</p>
          )}
        </Card>
      )}

      <Card>
        <SecTitle>History</SecTitle>
        {recent.length === 0 ? (
          <EmptyMsg>No sessions yet</EmptyMsg>
        ) : (
          recent.map(m => (
            <div key={m.id} className="py-2 border-b border-bg last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-primary">{m.date}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">{m.duration}min total</span>
                  <DelBtn onClick={() => removeMobilityEntry(m.id)} />
                </div>
              </div>
              {m.exercises.map((e, i) => (
                <div key={i} className="text-xs text-muted ml-2">
                  {e.name} — {e.duration}min{e.notes ? ` (${e.notes})` : ''}
                </div>
              ))}
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
