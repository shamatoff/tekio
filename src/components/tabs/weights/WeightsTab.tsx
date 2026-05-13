import { useState, useEffect } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../../store/app'
import { today, cycleInfo, isDeloadDate, isTodayDone } from '../../../lib/utils'
import { Card, SecTitle, EmptyMsg } from '../../ui/Card'
import { Inp } from '../../ui/Input'
import { Btn, DelBtn } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { SSBadge } from '../../ui/Badges'
import { SmartInput } from '../../ui/SmartInput'
import { TodaysPlan } from './TodaysPlan'
import { SupersetLogger } from './SupersetLogger'
import type { WeightEntry, LiftSet } from '../../../types'

interface SetStr { weight: string; reps: string }

export function WeightsTab() {
  const [ex, setEx] = useState('')
  const [date, setDate] = useState(today())
  const [sets, setSets] = useState<SetStr[]>([{ weight: '', reps: '' }])
  const [revealed, setRevealed] = useState(1)
  const [selEx, setSelEx] = useState('')
  const [chartMetric, setChartMetric] = useState<'maxWeight' | 'volume'>('maxWeight')
  const [ssExercises, setSsExercises] = useState<[string, string] | null>(null)
  const [ssInitialSets, setSsInitialSets] = useState<{ sets0?: LiftSet[]; sets1?: LiftSet[] } | null>(null)

  const { weights, program, addWeightEntry, removeWeightEntry, advanceActiveProgram, setToast } = useAppStore()

  // Auto-advance program day when all today's exercises are logged
  useEffect(() => {
    if (!program) return
    const day = program.days[program.currentDayIndex % program.days.length]
    if (!day) return
    if (isTodayDone(weights, day) && program.lastAdvancedDate !== today()) {
      const newIndex = (program.currentDayIndex + 1) % program.days.length
      advanceActiveProgram(newIndex, today())
    }
  }, [weights])

  const exercises = [...new Set(weights.map(d => d.exercise))].sort()

  const getLastPerf = (n: string): WeightEntry | undefined =>
    n.trim()
      ? [...weights]
          .filter(d => d.exercise.toLowerCase() === n.trim().toLowerCase() && !isDeloadDate(program?.startDate, d.date))
          .sort((a, b) => b.date.localeCompare(a.date))[0]
      : undefined

  const lastPerf = getLastPerf(ex)

  const handleSelectEx = (n: string) => {
    setEx(n); setSelEx(n); setSsExercises(null)
    const p = getLastPerf(n)
    if (p) { setSets(p.sets.map(s => ({ weight: String(s.weight), reps: String(s.reps) }))); setRevealed(p.sets.length) }
    else { setSets([{ weight: '', reps: '' }]); setRevealed(1) }
  }

  const handlePickWithSets = (n: string, computedSets: LiftSet[]) => {
    setSsExercises(null)
    setEx(n); setSelEx(n)
    setSets(computedSets.map(s => ({ weight: String(s.weight), reps: String(s.reps) })))
    setRevealed(computedSets.length)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  const revealNext = () => {
    const n = revealed + 1
    if (n > sets.length) setSets(p => [...p, { weight: p[p.length - 1]?.weight || '', reps: '' }])
    setRevealed(n)
  }

  const updateSet = (i: number, f: keyof SetStr, v: string) =>
    setSets(p => p.map((s, idx) => idx === i ? { ...s, [f]: v } : s))

  const removeSet = (i: number) => {
    setSets(p => p.filter((_, idx) => idx !== i))
    setRevealed(r => Math.max(1, r - 1))
  }

  const addEntry = async () => {
    if (!ex.trim()) return
    const vs: LiftSet[] = sets.slice(0, revealed).filter(s => s.weight && s.reps).map(s => ({ weight: +s.weight, reps: +s.reps }))
    if (!vs.length) return
    try {
      await addWeightEntry({ date, exercise: ex.trim(), sets: vs })
      setEx(''); setSets([{ weight: '', reps: '' }]); setRevealed(1)
      setToast('✅ Exercise saved!')
    } catch {
      setToast('❌ Failed to save.')
    }
  }

  const saveSS = async (entries: Array<Omit<WeightEntry, 'id'>>) => {
    try {
      await Promise.all(entries.map(e => addWeightEntry(e)))
      setSsExercises(null); setSsInitialSets(null)
      setToast('✅ Superset saved!')
    } catch {
      setToast('❌ Failed to save.')
    }
  }

  const { isDeload } = cycleInfo(program)
  const chartEx = selEx || exercises[0] || ''
  const chartData = weights
    .filter(d => d.exercise === chartEx)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date.slice(5),
      maxWeight: Math.max(...d.sets.map(s => s.weight)),
      volume: d.sets.reduce((a, s) => a + s.weight * s.reps, 0),
      deload: isDeloadDate(program?.startDate, d.date),
    }))

  const recent = [...weights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)

  // Group recent by superset
  const recentGrouped: Array<{ type: 'single' | 'superset'; entries: WeightEntry[] }> = []
  const usedIds = new Set<string>()
  for (const entry of recent) {
    if (usedIds.has(entry.id)) continue
    if (entry.supersetId) {
      const partner = recent.find(e => e.supersetId === entry.supersetId && e.id !== entry.id)
      if (partner && !usedIds.has(partner.id)) {
        recentGrouped.push({ type: 'superset', entries: [entry, partner] })
        usedIds.add(entry.id); usedIds.add(partner.id); continue
      }
    }
    recentGrouped.push({ type: 'single', entries: [entry] })
    usedIds.add(entry.id)
  }

  return (
    <div className="flex flex-col gap-4">
      {program && (
        <TodaysPlan
          program={program}
          weights={weights}
          onPickSingle={n => { setSsExercises(null); handleSelectEx(n); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50) }}
          onPickSingleWithSets={handlePickWithSets}
          onPickSuperset={exArr => { setSsInitialSets(null); setSsExercises(exArr); setEx(''); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50) }}
          onPickSupersetDeload={(exArr, getLastFn) => {
            const s0 = getLastFn(exArr[0])?.sets.map(s => ({ weight: s.weight, reps: Math.max(1, Math.round(s.reps * 0.7)) }))
            const s1 = getLastFn(exArr[1])?.sets.map(s => ({ weight: s.weight, reps: Math.max(1, Math.round(s.reps * 0.7)) }))
            setSsInitialSets({ sets0: s0, sets1: s1 })
            setSsExercises(exArr); setEx('')
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
          }}
        />
      )}

      {ssExercises && (
        <SupersetLogger
          exercises={ssExercises}
          weights={weights}
          date={date}
          programStartDate={program?.startDate}
          isDeload={isDeload}
          initialSets0={ssInitialSets?.sets0}
          initialSets1={ssInitialSets?.sets1}
          onSave={saveSS}
          onCancel={() => { setSsExercises(null); setSsInitialSets(null) }}
        />
      )}

      {!ssExercises && (
        <Card>
          <SecTitle>Log Exercise</SecTitle>
          <div className="flex flex-col gap-2.5 mb-3">
            <div>
              <p className="text-xs text-muted font-medium mb-1">Exercise</p>
              <SmartInput
                value={ex}
                onChange={v => { setEx(v); if (!v) setSsExercises(null) }}
                suggestions={exercises}
                placeholder="e.g. Bench Press"
              />
            </div>
            {lastPerf && (
              <div className="px-2.5 py-2 bg-bg rounded-lg text-xs text-muted">
                <span className="font-semibold text-primary">Last ({lastPerf.date}):</span>{' '}
                {lastPerf.sets.map(s => `${s.weight}kg×${s.reps}`).join(' · ')}
              </div>
            )}
            <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Sets grid */}
          <div className="mb-3">
            <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: '28px 1fr 1fr 28px' }}>
              {['#', 'Weight (kg)', 'Reps', ''].map((h, i) => (
                <p key={i} className="text-[11px] text-muted font-semibold">{h}</p>
              ))}
            </div>
            {sets.slice(0, revealed).map((s, i) => (
              <div key={i} className="grid gap-1.5 mb-1.5 items-center" style={{ gridTemplateColumns: '28px 1fr 1fr 28px' }}>
                <span className="text-xs text-muted text-center">{i + 1}</span>
                <input
                  value={s.weight} onChange={e => updateSet(i, 'weight', e.target.value)}
                  type="number" placeholder="60" min="0" step="0.5"
                  className="border border-border rounded-lg px-2.5 py-1.5 text-sm bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <input
                  value={s.reps} onChange={e => updateSet(i, 'reps', e.target.value)}
                  type="number" placeholder="10" min="1"
                  className="border border-border rounded-lg px-2.5 py-1.5 text-sm bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <div>{sets.slice(0, revealed).length > 1 && <DelBtn onClick={() => removeSet(i)} />}</div>
              </div>
            ))}
            <button onClick={revealNext} className="text-xs text-accent mt-1">
              + {revealed < sets.length ? `Set ${revealed + 1} (${sets[revealed].weight}kg × ${sets[revealed].reps})` : 'Add set'}
            </button>
          </div>

          <Btn onClick={addEntry} className="w-full">Save Exercise</Btn>
        </Card>
      )}

      {/* Exercise selector chips */}
      {exercises.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {exercises.map(e => (
            <Chip key={e} active={selEx === e} onClick={() => handleSelectEx(e)}>{e}</Chip>
          ))}
        </div>
      )}

      {/* Chart */}
      {exercises.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2.5">
            <SecTitle>Progress</SecTitle>
            <div className="flex gap-1">
              <Chip small active={chartMetric === 'maxWeight'} onClick={() => setChartMetric('maxWeight')}>Max kg</Chip>
              <Chip small active={chartMetric === 'volume'} onClick={() => setChartMetric('volume')}>Volume</Chip>
            </div>
          </div>
          <select
            value={chartEx}
            onChange={e => setSelEx(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary mb-3 focus:outline-none"
          >
            {exercises.map(e => <option key={e}>{e}</option>)}
          </select>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} width={40} />
                <Tooltip formatter={(v: number) => [`${v} kg`, chartMetric === 'maxWeight' ? 'Max Weight' : 'Volume']} />
                <Line
                  type="monotone"
                  dataKey={chartMetric}
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={(props: { cx?: number; cy?: number; payload?: { deload?: boolean }; index?: number }) => {
                    const { cx, cy, payload, index } = props
                    if (cx == null || cy == null) return <g key={index} />
                    return payload?.deload
                      ? <circle key={index} cx={cx} cy={cy} r={5} fill="#92400e" stroke="#fcd34d" strokeWidth={2} />
                      : <circle key={index} cx={cx} cy={cy} r={3} fill="#6366f1" />
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted text-center py-8">Not enough data to chart</p>
          )}
        </Card>
      )}

      {/* Recent entries */}
      <Card>
        <SecTitle>Recent</SecTitle>
        {recentGrouped.length === 0 ? (
          <EmptyMsg>No entries yet</EmptyMsg>
        ) : (
          recentGrouped.map((g, gi) => {
            if (g.type === 'superset') {
              return (
                <div key={gi} className="mb-3 border border-ss-b rounded-xl p-2.5 bg-ss-l">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <SSBadge />
                    <span className="text-[11px] text-ss font-semibold">Superset</span>
                    <span className="text-[11px] text-muted ml-auto">{g.entries[0].date}</span>
                    <DelBtn onClick={() => {
                      g.entries.forEach(e => removeWeightEntry(e.id))
                    }} />
                  </div>
                  {g.entries.map((e, ei) => (
                    <div key={ei} className={ei === 0 ? 'mb-1.5' : ''}>
                      <span className="text-xs font-semibold text-primary">{e.exercise}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {e.sets.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-surface text-[11px] text-muted">S{i + 1}: {s.weight}kg×{s.reps}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
            const entry = g.entries[0]
            return (
              <div key={gi} className="flex items-start justify-between py-2 border-b border-bg last:border-0">
                <div>
                  <p className="text-sm font-semibold text-primary">{entry.exercise}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {entry.sets.map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-bg text-[11px] text-muted">S{i + 1}: {s.weight}kg×{s.reps}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-2 mt-0.5">
                  <span className="text-[11px] text-muted">{entry.date}</span>
                  <DelBtn onClick={() => removeWeightEntry(entry.id)} />
                </div>
              </div>
            )
          })
        )}
      </Card>
    </div>
  )
}
