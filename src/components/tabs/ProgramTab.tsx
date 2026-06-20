import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { cycleInfo, getGrouped, sessionDates, defaultProgram, today, cycleExerciseProgress } from '../../lib/utils'
import { CYCLE } from '../../constants/app'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Btn, DelBtn } from '../ui/Button'
import { SSBadge } from '../ui/Badges'
import { Chip } from '../ui/Chip'
import { MiniChart } from '../ui/MiniChart'
import type { Program, ProgramDay, ActiveProgram, ProgramCycle, WeightEntry } from '../../types'

// ── Program Editor ────────────────────────────────────────────────────────────

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

// ── Program Card (one per active program) ─────────────────────────────────────

function ProgramCard({
  ap,
  weights,
  onEdit,
  onAdvance,
  onRestart,
  onPause,
  onDelete,
}: {
  ap: ActiveProgram
  weights: WeightEntry[]
  onEdit: () => void
  onAdvance: () => void
  onRestart: () => void
  onPause: () => void
  onDelete: () => void
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const { week, isDeload, isComplete } = cycleInfo(ap)
  const dayIndex = ap.currentDayIndex % ap.days.length
  const day = ap.days[dayIndex]
  const nextDay = ap.days[(ap.currentDayIndex + 1) % ap.days.length]

  return (
    <Card>
      {/* Header: name + week badge */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-base font-bold text-primary">{ap.name}</p>
          {isComplete ? (
            <span className="text-xs text-accent font-semibold">🎉 Cycle complete</span>
          ) : isDeload ? (
            <span className="text-xs text-dl-tx font-semibold">⚠️ Deload week</span>
          ) : (
            <span className="text-xs text-muted">Week {week} of {CYCLE}</span>
          )}
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <button onClick={onEdit} className="text-xs text-accent">Edit</button>
          <button onClick={onPause} className="text-xs text-muted">Pause</button>
        </div>
      </div>

      {/* Cycle progress bar */}
      {!isComplete && !isDeload && (
        <div className="flex gap-1 mb-3">
          {Array.from({ length: CYCLE }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full ${i < week - 1 ? 'bg-accent' : i === week - 1 ? 'bg-accent/40' : 'bg-bg'}`}
            />
          ))}
        </div>
      )}

      {/* Today's day */}
      {day && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted">Today · Day {dayIndex + 1}/{ap.days.length}</p>
          </div>
          <p className="text-sm font-semibold text-primary mb-1.5">{day.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {getGrouped(day).map((g, gi) =>
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
            {day.exercises.length === 0 && (
              <span className="text-xs text-muted italic">Rest day</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {isComplete ? (
        <div className="flex gap-2 mb-3">
          <Btn onClick={onRestart} className="flex-1">🔄 Restart</Btn>
          <Btn onClick={onEdit} variant="secondary" className="flex-1">✏️ Edit</Btn>
        </div>
      ) : (
        <Btn onClick={onAdvance} variant="secondary" className="w-full mb-3">
          ✓ Done → {nextDay?.name}
        </Btn>
      )}

      {/* Expandable schedule */}
      <button
        onClick={() => setScheduleOpen(o => !o)}
        className="text-xs text-muted w-full text-left py-1 border-t border-bg mt-1"
      >
        {scheduleOpen ? '▲ Hide schedule' : '▼ Full schedule'}
      </button>

      {scheduleOpen && (
        <div className="mt-2 space-y-0.5">
          {ap.days.map((d, i) => {
            const active = i === dayIndex
            const dates = sessionDates(weights, d.exercises)
            return (
              <div key={i} className={`flex items-start gap-2.5 py-2 px-2.5 rounded-xl ${active ? 'bg-accent-l' : ''}`}>
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 ${active ? 'bg-accent text-white' : 'bg-bg text-muted'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-${active ? 'semibold' : 'normal'} ${active ? 'text-accent' : 'text-primary'} truncate`}>{d.name}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {getGrouped(d).map((g, gi) =>
                      g.type === 'superset' ? (
                        <span key={gi} className="text-[10px] text-ss bg-ss-l border border-ss-b rounded-full px-1.5 py-0.5">SS: {g.exercises.join('+')}</span>
                      ) : (
                        <span key={gi} className="text-[10px] text-muted">{g.exercises[0]}</span>
                      )
                    )}
                  </div>
                  {dates.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {dates.slice(0, 3).map(dt => (
                        <span key={dt} className="text-[10px] bg-bg text-muted px-1.5 py-0.5 rounded-full">{dt}</span>
                      ))}
                      {dates.length > 3 && <span className="text-[10px] text-muted">+{dates.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {ap.days.length === 0 && <EmptyMsg>No days in this program</EmptyMsg>}
          <div className="pt-2 border-t border-bg mt-1">
            <button onClick={onDelete} className="text-xs text-danger">Delete program</button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Program History Card (one per past/paused cycle) ──────────────────────────

const STATUS_BADGE: Record<ProgramCycle['status'], string> = {
  active: '',
  paused: '⏸ Paused',
  completed: '🎉 Completed',
  abandoned: '⏹ Stopped early',
}

function ProgramHistoryCard({
  cycle,
  weights,
  onResume,
  onDelete,
}: {
  cycle: ProgramCycle
  weights: WeightEntry[]
  onResume: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [metric, setMetric] = useState<'maxWeight' | 'volume'>('maxWeight')
  const progress = cycleExerciseProgress(weights, cycle)
  const fmt = (n: number) => Math.round(n * 10) / 10
  const unit = metric === 'maxWeight' ? 'kg' : ''

  return (
    <Card>
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-sm font-bold text-primary">
            {cycle.programName}{cycle.cycleNumber > 1 ? ` · Cycle ${cycle.cycleNumber}` : ''}
          </p>
          <p className="text-xs text-muted">
            {cycle.startDate} – {cycle.endDate ?? 'ongoing'}
          </p>
        </div>
        <span className="text-xs font-semibold text-muted shrink-0">{STATUS_BADGE[cycle.status]}</span>
      </div>

      {cycle.status === 'paused' && (
        <div className="flex gap-2 mt-2 mb-1">
          <Btn small onClick={onResume}>▶ Resume</Btn>
          <DelBtn label="Delete program" onClick={onDelete} />
        </div>
      )}

      <button onClick={() => setOpen(o => !o)} className="text-xs text-muted w-full text-left py-1 border-t border-bg mt-2">
        {open ? '▲ Hide progress' : '▼ View progress'}
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          {progress.length > 0 && (
            <div className="flex gap-1">
              <Chip small active={metric === 'maxWeight'} onClick={() => setMetric('maxWeight')}>Max kg</Chip>
              <Chip small active={metric === 'volume'} onClick={() => setMetric('volume')}>Volume</Chip>
            </div>
          )}
          {progress.length === 0 && <EmptyMsg>No exercises logged in this cycle</EmptyMsg>}
          {progress.map(p => {
            const m = p[metric]
            return (
              <div key={p.exercise}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-primary">{p.exercise}</span>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${m.delta > 0 ? 'text-accent' : m.delta < 0 ? 'text-danger' : 'text-muted'}`}>
                      {fmt(m.first)}{unit} → {fmt(m.last)}{unit} ({m.delta > 0 ? '+' : ''}{fmt(m.delta)}{unit})
                    </span>
                    <p className="text-[11px] text-muted">Peak {fmt(m.peak)}{unit}</p>
                  </div>
                </div>
                <MiniChart data={m.series} />
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ── Main Program Tab ──────────────────────────────────────────────────────────

type EditingState = { programId?: string; userProgramId?: string; draft: Program } | null

export function ProgramTab() {
  const [editing, setEditing] = useState<EditingState>(null)
  const [saving, setSaving] = useState(false)
  const {
    programs,
    programHistory,
    weights,
    saveActiveProgram,
    advanceActiveProgram,
    restartActiveProgram,
    pauseActiveProgram,
    resumeActiveProgram,
    removeProgram,
    setToast,
  } = useAppStore()

  const handleSave = async (p: Program, programId?: string, userProgramId?: string) => {
    setSaving(true)
    try {
      await saveActiveProgram(p, programId, userProgramId)
      setEditing(null)
      setToast('✅ Program saved!')
    } catch {
      setToast('❌ Failed to save program.')
    } finally {
      setSaving(false)
    }
  }

  const handleAdvance = async (ap: ActiveProgram) => {
    const newIndex = (ap.currentDayIndex + 1) % ap.days.length
    try {
      await advanceActiveProgram(ap.userProgramId, newIndex, today())
      setToast(`✅ Advanced to ${ap.days[newIndex].name}`)
    } catch {
      setToast('❌ Failed to advance.')
    }
  }

  const handleRestart = async (ap: ActiveProgram) => {
    try {
      await restartActiveProgram(ap.userProgramId, today())
      setToast('🔄 Program restarted!')
    } catch {
      setToast('❌ Failed to restart.')
    }
  }

  const handlePause = async (ap: ActiveProgram) => {
    try {
      await pauseActiveProgram(ap.userProgramId)
      setToast(`⏸ ${ap.name} paused`)
    } catch {
      setToast('❌ Failed to pause.')
    }
  }

  const handleDelete = async (ap: ActiveProgram) => {
    try {
      await removeProgram(ap.programId, ap.userProgramId)
      setToast(`🗑 ${ap.name} deleted`)
    } catch {
      setToast('❌ Failed to delete.')
    }
  }

  const handleResume = async (cycle: ProgramCycle) => {
    try {
      await resumeActiveProgram(cycle.userProgramId)
      setToast(`▶ ${cycle.programName} resumed`)
    } catch {
      setToast('❌ Failed to resume.')
    }
  }

  const handleDeleteHistory = async (cycle: ProgramCycle) => {
    try {
      await removeProgram(cycle.programId, cycle.userProgramId)
      setToast(`🗑 ${cycle.programName} deleted`)
    } catch {
      setToast('❌ Failed to delete.')
    }
  }

  if (saving) {
    return <div className="text-center py-12 text-muted text-sm">Saving program…</div>
  }

  if (editing !== null) {
    return (
      <ProgramEditor
        draft={editing.draft}
        onSave={p => handleSave(p, editing.programId, editing.userProgramId)}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {programs.length === 0 && (
        <Card>
          <SecTitle>No Active Programs</SecTitle>
          <p className="text-sm text-muted mb-4">
            Create your own program or start with the predefined 5-day split.
          </p>
          <div className="flex flex-col gap-2">
            <Btn
              onClick={() => setEditing({ draft: defaultProgram() })}
              className="w-full"
            >
              🏋️ Use 5-Day High Efficiency Split
            </Btn>
          </div>
        </Card>
      )}

      {programs.map(ap => (
        <ProgramCard
          key={ap.userProgramId}
          ap={ap}
          weights={weights}
          onEdit={() => setEditing({ programId: ap.programId, userProgramId: ap.userProgramId, draft: ap })}
          onAdvance={() => handleAdvance(ap)}
          onRestart={() => handleRestart(ap)}
          onPause={() => handlePause(ap)}
          onDelete={() => handleDelete(ap)}
        />
      ))}

      {programHistory.filter(c => c.status !== 'active').length > 0 && (
        <div className="flex flex-col gap-3">
          <SecTitle>📜 Program History</SecTitle>
          {programHistory.filter(c => c.status !== 'active').map(cycle => (
            <ProgramHistoryCard
              key={cycle.id}
              cycle={cycle}
              weights={weights}
              onResume={() => handleResume(cycle)}
              onDelete={() => handleDeleteHistory(cycle)}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setEditing({
          draft: { name: 'New Program', days: [], startDate: today(), currentDayIndex: 0, lastAdvancedDate: today() },
        })}
        className="w-full border-2 border-dashed border-border bg-surface rounded-2xl p-4 text-center"
      >
        <span className="text-sm font-semibold text-accent">+ Add New Program</span>
      </button>
    </div>
  )
}
