import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { cycleInfo, getGrouped, sessionDates, defaultProgram, today } from '../../lib/utils'
import { CYCLE } from '../../constants/app'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Btn, DelBtn } from '../ui/Button'
import { SSBadge } from '../ui/Badges'
import type { Program, ProgramDay } from '../../types'

// ── Editor ────────────────────────────────────────────────────────────────────

function ProgramEditor({ draft, onSave, onCancel }: {
  draft: Program
  onSave: (p: Program) => void
  onCancel: () => void
}) {
  const [p, setP] = useState<Program>(JSON.parse(JSON.stringify(draft)))
  const [newDayName, setNewDayName] = useState('')
  const [newExName, setNewExName] = useState('')
  const [editDayIdx, setEditDayIdx] = useState<number | null>(null)
  const [pairingIdx, setPairingIdx] = useState<number | null>(null)
  const [pairFirst, setPairFirst] = useState<string | null>(null)

  const addDay = () => {
    if (!newDayName.trim()) return
    setP(d => ({ ...d, days: [...d.days, { name: newDayName.trim(), exercises: [], supersets: [] }] }))
    setNewDayName('')
  }

  const addEx = (di: number) => {
    if (!newExName.trim()) return
    setP(d => { const days = [...d.days]; days[di] = { ...days[di], exercises: [...days[di].exercises, newExName.trim()] }; return { ...d, days } })
    setNewExName('')
  }

  const removeEx = (di: number, ei: number) => setP(d => {
    const days = [...d.days]
    const exName = days[di].exercises[ei]
    days[di] = { ...days[di], exercises: days[di].exercises.filter((_, i) => i !== ei), supersets: (days[di].supersets || []).filter(pair => !pair.includes(exName)) }
    return { ...d, days }
  })

  const removeDay = (di: number) => setP(d => ({ ...d, days: d.days.filter((_, i) => i !== di) }))

  const togglePair = (di: number, exName: string) => {
    if (pairingIdx !== di) { setPairingIdx(di); setPairFirst(exName); return }
    if (pairFirst === exName) { setPairFirst(null); return }
    setP(d => {
      const days = [...d.days]
      const ss = (days[di].supersets || []).filter(pair => !pair.includes(pairFirst!) && !pair.includes(exName))
      ss.push([pairFirst!, exName])
      days[di] = { ...days[di], supersets: ss }
      return { ...d, days }
    })
    setPairingIdx(null); setPairFirst(null)
  }

  const unpair = (di: number, pair: [string, string]) => setP(d => {
    const days = [...d.days]
    days[di] = { ...days[di], supersets: (days[di].supersets || []).filter(pp => !(pp[0] === pair[0] && pp[1] === pair[1])) }
    return { ...d, days }
  })

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Program Name</SecTitle>
        <input
          value={p.name}
          onChange={e => setP(d => ({ ...d, name: e.target.value }))}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </Card>
      <Card>
        <SecTitle>Start Date</SecTitle>
        <input
          type="date"
          value={p.startDate}
          onChange={e => setP(d => ({ ...d, startDate: e.target.value }))}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </Card>

      {p.days.map((day: ProgramDay, di: number) => {
        const ss = day.supersets || []
        return (
          <Card key={di}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-primary">{day.name || `Day ${di + 1}`}</p>
              <DelBtn onClick={() => removeDay(di)} />
            </div>
            {ss.length > 0 && (
              <div className="mb-2">
                {ss.map((pair, pi) => (
                  <div key={pi} className="flex items-center gap-1.5 mb-1 px-2 py-1 bg-ss-l rounded-lg border border-ss-b">
                    <SSBadge />
                    <span className="text-xs text-ss font-medium">{pair[0]} + {pair[1]}</span>
                    <button onClick={() => unpair(di, pair as [string, string])} className="ml-auto text-muted text-base leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {day.exercises.map((ex, ei) => {
                const inSS = ss.some(pair => pair.includes(ex))
                const isPF = pairingIdx === di && pairFirst === ex
                return (
                  <span key={ei} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${inSS ? 'bg-ss-l border-ss-b text-ss' : 'bg-bg border-border text-primary'}`}>
                    {ex}
                    {!inSS && (
                      <button onClick={() => togglePair(di, ex)} className={`text-[11px] font-bold ${isPF ? 'text-ss' : 'text-muted'}`}>
                        {isPF ? '★' : '⊕'}
                      </button>
                    )}
                    <button onClick={() => removeEx(di, ei)} className="text-muted leading-none">×</button>
                  </span>
                )
              })}
            </div>
            {pairingIdx === di && pairFirst && (
              <p className="text-xs text-ss italic mb-2">Tap ⊕ on another exercise to pair with "{pairFirst}"</p>
            )}
            {editDayIdx === di ? (
              <div className="flex gap-2">
                <input
                  value={newExName}
                  onChange={e => setNewExName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addEx(di)}
                  placeholder="Exercise name…"
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <Btn small onClick={() => addEx(di)}>Add</Btn>
                <Btn small variant="secondary" onClick={() => setEditDayIdx(null)}>Done</Btn>
              </div>
            ) : (
              <button onClick={() => { setEditDayIdx(di); setNewExName('') }} className="text-xs text-accent">+ Add exercise</button>
            )}
          </Card>
        )
      })}

      <Card>
        <div className="flex gap-2">
          <input
            value={newDayName}
            onChange={e => setNewDayName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addDay()}
            placeholder="New day name…"
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <Btn small onClick={addDay}>+ Day</Btn>
        </div>
      </Card>

      <div className="flex gap-2">
        <Btn onClick={() => onSave(p)} className="flex-1">Save Program</Btn>
        <Btn onClick={onCancel} variant="secondary" className="flex-1">Cancel</Btn>
      </div>
    </div>
  )
}

// ── Main Program Tab ──────────────────────────────────────────────────────────

export function ProgramTab() {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const { program, weights, saveActiveProgram, advanceActiveProgram, removeProgram, setToast } = useAppStore()

  const { week, isDeload } = cycleInfo(program)
  const day = program ? program.days[program.currentDayIndex % program.days.length] : null

  const handleSave = async (p: Program) => {
    setSaving(true)
    try {
      await saveActiveProgram(p)
      setEditing(false)
      setToast('✅ Program saved!')
    } catch {
      setToast('❌ Failed to save program.')
    } finally {
      setSaving(false)
    }
  }

  const advanceDay = async () => {
    if (!program) return
    const newIndex = (program.currentDayIndex + 1) % program.days.length
    try {
      await advanceActiveProgram(newIndex, today())
      setToast(`✅ Advanced to ${program.days[newIndex].name}`)
    } catch {
      setToast('❌ Failed to advance.')
    }
  }

  if (editing) {
    const draft = program ?? { name: 'My Program', days: [], startDate: today(), currentDayIndex: 0, lastAdvancedDate: today() }
    return saving
      ? <div className="text-center py-12 text-muted text-sm">Saving program…</div>
      : <ProgramEditor draft={draft} onSave={handleSave} onCancel={() => setEditing(false)} />
  }

  if (!program) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <SecTitle>No Active Program</SecTitle>
          <p className="text-sm text-muted mb-4">Start with the predefined 5-day split or create your own.</p>
          <div className="flex flex-col gap-2">
            <Btn onClick={() => handleSave(defaultProgram())} className="w-full">🏋️ Use 5-Day High Efficiency Split</Btn>
            <Btn onClick={() => setEditing(true)} variant="secondary" className="w-full">✏️ Create Custom Program</Btn>
          </div>
        </Card>
      </div>
    )
  }

  const grouped = getGrouped(day)
  const nextDay = program.days[(program.currentDayIndex + 1) % program.days.length]

  return (
    <div className="flex flex-col gap-4">
      {/* Deload or cycle progress */}
      {isDeload ? (
        <div className="bg-dl-bg border-2 border-dl-bd rounded-2xl p-4">
          <p className="text-base font-bold text-dl-tx mb-1.5">⚠️ Deload Week</p>
          <p className="text-sm text-dl-tx">Recovery week. All targets set to <strong>70%</strong> of regular reps.</p>
        </div>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <p className="text-xs text-muted">6-Week Cycle</p>
              <p className="text-xl font-bold text-primary">Week {week} <span className="text-sm text-muted font-normal">of {CYCLE}</span></p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: CYCLE }, (_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full ${i < week - 1 ? 'bg-accent' : i === week - 1 ? 'bg-accent/40' : 'bg-bg'}`}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Today's day */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <SecTitle>Today's Day</SecTitle>
          <span className="text-xs text-muted">Day {(program.currentDayIndex % program.days.length) + 1}/{program.days.length}</span>
        </div>
        <p className="text-sm font-semibold text-primary mb-2">{day?.name}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {grouped.map((g, gi) =>
            g.type === 'superset' ? (
              <div key={gi} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-ss-l border border-ss-b rounded-lg">
                <SSBadge />
                {g.exercises.map((ex, i) => (
                  <span key={i} className="text-xs font-medium text-ss">{i > 0 ? '+ ' : ''}{ex}</span>
                ))}
              </div>
            ) : (
              <div key={gi} className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-accent-l text-accent text-xs font-medium">
                🏋️ {g.exercises[0]}
              </div>
            )
          )}
        </div>
        <Btn onClick={advanceDay} variant="secondary" className="w-full">
          ✓ Done → {nextDay?.name}
        </Btn>
      </Card>

      {/* Full schedule */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <SecTitle>Full Schedule — {program.name}</SecTitle>
          <button onClick={() => setEditing(true)} className="text-xs text-accent">Edit</button>
        </div>
        {program.days.map((d, i) => {
          const active = i === program.currentDayIndex % program.days.length
          return (
            <div key={i} className={`flex items-start gap-2.5 py-2 px-2.5 rounded-xl ${active ? 'bg-accent-l' : ''}`}>
              <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 ${active ? 'bg-accent text-white' : 'bg-bg text-muted'}`}>
                {i + 1}
              </span>
              <div>
                <p className={`text-xs font-${active ? 'semibold' : 'normal'} ${active ? 'text-accent' : 'text-primary'}`}>{d.name}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {getGrouped(d).map((g, gi) =>
                    g.type === 'superset' ? (
                      <span key={gi} className="text-[10px] text-ss bg-ss-l border border-ss-b rounded-full px-1.5 py-0.5">SS: {g.exercises.join('+')}</span>
                    ) : (
                      <span key={gi} className="text-[10px] text-muted">{g.exercises[0]}</span>
                    )
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div className="mt-2 pt-2 border-t border-bg">
          <button onClick={() => removeProgram()} className="text-xs text-danger">Remove program</button>
        </div>
      </Card>

      {/* Session history */}
      {program.days.some(d => sessionDates(weights, d.exercises).length > 0) && (
        <Card>
          <SecTitle>Session History</SecTitle>
          {program.days.map((d, i) => {
            const dates = sessionDates(weights, d.exercises)
            if (dates.length === 0) return null
            return (
              <div key={i} className="mb-3 last:mb-0">
                <p className="text-xs font-semibold text-primary mb-1">{d.name}</p>
                <div className="flex flex-wrap gap-1">
                  {dates.slice(0, 6).map(dt => (
                    <span key={dt} className="text-[10px] bg-bg text-muted px-2 py-0.5 rounded-full">{dt}</span>
                  ))}
                  {dates.length > 6 && <span className="text-[10px] text-muted">+{dates.length - 6} more</span>}
                </div>
              </div>
            )
          })}
        </Card>
      )}

      {program.days.length === 0 && <EmptyMsg>No days in this program</EmptyMsg>}
    </div>
  )
}
