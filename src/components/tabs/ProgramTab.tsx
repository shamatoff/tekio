import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { cycleInfo, getGrouped, sessionDates, defaultProgram, today } from '../../lib/utils'
import { importProtocol } from '../../lib/importProtocol'
import { CYCLE } from '../../constants/app'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Btn, DelBtn } from '../ui/Button'
import { SSBadge } from '../ui/Badges'
import type { Program, ProgramDay, ProgramBlock, BlockType } from '../../types'

// ── Block type display config ─────────────────────────────────────────────────

const BLOCK_LABEL: Record<BlockType, string> = {
  weight:       'LIFT',
  mobility:     'MOB',
  conditioning: 'COND',
  sport:        'SPORT',
  warmup:       'WARM',
  recovery:     'REST',
}

const BLOCK_PILL: Record<BlockType, string> = {
  weight:       'bg-accent-l text-accent border-accent/30',
  mobility:     'bg-green-50 text-green-700 border-green-200',
  conditioning: 'bg-orange-50 text-orange-700 border-orange-200',
  sport:        'bg-purple-50 text-purple-700 border-purple-200',
  warmup:       'bg-yellow-50 text-yellow-700 border-yellow-200',
  recovery:     'bg-blue-50 text-blue-700 border-blue-200',
}

const BLOCK_HEADER: Record<BlockType, string> = {
  weight:       'border-accent/20 bg-accent-l/60',
  mobility:     'border-green-200 bg-green-50/60',
  conditioning: 'border-orange-200 bg-orange-50/60',
  sport:        'border-purple-200 bg-purple-50/60',
  warmup:       'border-yellow-200 bg-yellow-50/60',
  recovery:     'border-blue-200 bg-blue-50/60',
}

// ── Block section (for Today's Day view) ──────────────────────────────────────

function BlockSection({ block }: { block: ProgramBlock }) {
  const [open, setOpen] = useState(block.type === 'weight')
  const pill = BLOCK_PILL[block.type]
  const header = BLOCK_HEADER[block.type]

  return (
    <div className={`rounded-xl border overflow-hidden mb-2 last:mb-0 ${header}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${pill}`}>
          {BLOCK_LABEL[block.type]}
        </span>
        <span className="text-xs font-semibold text-primary flex-1 truncate">{block.name}</span>
        {block.scheduledTime && (
          <span className="text-[10px] text-muted shrink-0">{block.scheduledTime}</span>
        )}
        {block.durationMinutes && (
          <span className="text-[10px] text-muted shrink-0">{block.durationMinutes}m</span>
        )}
        <span className="text-[10px] text-muted shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3 pb-2.5 pt-0.5 space-y-1">
          {block.type === 'weight' ? (
            // Weight block: show exercise chips (same as flat day)
            <WeightBlockExercises block={block} />
          ) : (
            // Other blocks: compact exercise list
            block.exercises.map((ex, ei) => (
              <div key={ei} className="flex items-start gap-2 py-0.5">
                <span className="text-xs text-primary font-medium flex-1">{ex.name}</span>
                <span className="text-[10px] text-muted shrink-0 text-right">
                  {ex.duration
                    ? ex.duration
                    : [
                        ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ex.reps,
                        ex.weight,
                      ]
                        .filter(Boolean)
                        .join(' @ ') || null}
                </span>
              </div>
            ))
          )}
          {block.notes && (
            <p className="text-[10px] text-muted italic mt-1">{block.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}

function WeightBlockExercises({ block }: { block: ProgramBlock }) {
  const ss = block.supersets
  const used = new Set<string>()
  const groups: Array<{ type: 'single' | 'superset'; exercises: string[] }> = []

  for (const ex of block.exercises) {
    if (used.has(ex.name)) continue
    const pair = ss.find(p => p.includes(ex.name))
    if (pair) {
      const partner = pair.find(e => e !== ex.name)
      if (partner && block.exercises.some(e => e.name === partner) && !used.has(partner)) {
        groups.push({ type: 'superset', exercises: [ex.name, partner] })
        used.add(ex.name); used.add(partner); continue
      }
    }
    groups.push({ type: 'single', exercises: [ex.name] })
    used.add(ex.name)
  }

  return (
    <div className="flex flex-wrap gap-1.5 pt-0.5">
      {groups.map((g, gi) =>
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
  )
}

// ── Recovery notes card ───────────────────────────────────────────────────────

function RecoveryNotes({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null
  return (
    <Card>
      <SecTitle>Recovery Notes</SecTitle>
      <ul className="space-y-1">
        {notes.map((note, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted">
            <span className="shrink-0 mt-0.5 text-muted">◦</span>
            {note}
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ── Import JSON modal ─────────────────────────────────────────────────────────

function ImportProtocolModal({
  onImport,
  onCancel,
}: {
  onImport: (p: Program) => void
  onCancel: () => void
}) {
  const [raw, setRaw] = useState('')
  const [err, setErr] = useState('')

  const handleImport = () => {
    setErr('')
    try {
      const json = JSON.parse(raw)
      const program = importProtocol(json)
      onImport(program)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Import Protocol JSON</SecTitle>
        <p className="text-xs text-muted mb-3">
          Paste a protocol JSON (with <code className="font-mono">name</code>, <code className="font-mono">startDate</code>, and <code className="font-mono">days</code> with blocks).
        </p>
        <textarea
          value={raw}
          onChange={e => setRaw(e.target.value)}
          placeholder='{ "name": "My Protocol", "startDate": "2026-06-09", "days": [...] }'
          rows={12}
          className="w-full border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
        />
        {err && <p className="text-xs text-danger mt-1">{err}</p>}
      </Card>
      <div className="flex gap-2">
        <Btn onClick={handleImport} className="flex-1">Import</Btn>
        <Btn onClick={onCancel} variant="secondary" className="flex-1">Cancel</Btn>
      </div>
    </div>
  )
}

// ── Program Editor (flat programs, unchanged) ─────────────────────────────────

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
  const [mode, setMode] = useState<'view' | 'edit' | 'import'>('view')
  const [saving, setSaving] = useState(false)
  const { program, weights, saveActiveProgram, advanceActiveProgram, restartActiveProgram, removeProgram, setToast } = useAppStore()

  const { week, isDeload, isComplete } = cycleInfo(program)
  const dayIndex = program ? program.currentDayIndex % program.days.length : 0
  const day = program ? program.days[dayIndex] : null
  const isProtocol = !!day?.blocks?.length

  const handleSave = async (p: Program) => {
    setSaving(true)
    try {
      await saveActiveProgram(p)
      setMode('view')
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

  const handleRestart = async () => {
    try {
      await restartActiveProgram(today())
      setToast('🔄 Program restarted!')
    } catch {
      setToast('❌ Failed to restart program.')
    }
  }

  if (saving) {
    return <div className="text-center py-12 text-muted text-sm">Saving program…</div>
  }

  if (mode === 'edit') {
    const draft = program ?? { name: 'My Program', days: [], startDate: today(), currentDayIndex: 0, lastAdvancedDate: today() }
    return <ProgramEditor draft={draft} onSave={handleSave} onCancel={() => setMode('view')} />
  }

  if (mode === 'import') {
    return (
      <ImportProtocolModal
        onImport={handleSave}
        onCancel={() => setMode('view')}
      />
    )
  }

  if (!program) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <SecTitle>No Active Program</SecTitle>
          <p className="text-sm text-muted mb-4">Start with the predefined 5-day split, create your own, or import a protocol JSON.</p>
          <div className="flex flex-col gap-2">
            <Btn onClick={() => handleSave(defaultProgram())} className="w-full">🏋️ Use 5-Day High Efficiency Split</Btn>
            <Btn onClick={() => setMode('edit')} variant="secondary" className="w-full">✏️ Create Custom Program</Btn>
            <Btn onClick={() => setMode('import')} variant="secondary" className="w-full">📋 Import Protocol JSON</Btn>
          </div>
        </Card>
      </div>
    )
  }

  const nextDay = program.days[(program.currentDayIndex + 1) % program.days.length]

  return (
    <div className="flex flex-col gap-4">
      {/* Cycle progress — hidden for protocol programs */}
      {!isProtocol && (
        isComplete ? (
          <div className="bg-accent-l border-2 border-accent rounded-2xl p-4">
            <p className="text-base font-bold text-accent mb-1">🎉 Cycle Complete!</p>
            <p className="text-sm text-muted mb-4">
              You've finished all {CYCLE} weeks including the deload. Choose how to continue.
            </p>
            <div className="flex flex-col gap-2">
              <Btn onClick={handleRestart} className="w-full">🔄 Restart Same Program</Btn>
              <Btn onClick={() => setMode('edit')} variant="secondary" className="w-full">✏️ Configure New Program</Btn>
            </div>
          </div>
        ) : isDeload ? (
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
        )
      )}

      {/* Today's day */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <SecTitle>Today's Day</SecTitle>
          <span className="text-xs text-muted">Day {dayIndex + 1}/{program.days.length}</span>
        </div>
        <p className="text-sm font-semibold text-primary mb-1">{day?.name}</p>
        {day?.focus && (
          <p className="text-xs text-muted italic mb-3">{day.focus}</p>
        )}

        {day?.blocks?.length ? (
          // Protocol / block view
          <div className="mb-3">
            {day.blocks.map((block, bi) => (
              <BlockSection key={bi} block={block} />
            ))}
          </div>
        ) : (
          // Flat view
          <div className="flex flex-wrap gap-1.5 mb-3">
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
          </div>
        )}

        <Btn onClick={advanceDay} variant="secondary" className="w-full">
          ✓ Done → {nextDay?.name}
        </Btn>
      </Card>

      {/* Recovery notes (protocol days only) */}
      {day?.recoveryNotes?.length ? (
        <RecoveryNotes notes={day.recoveryNotes} />
      ) : null}

      {/* Full schedule */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <SecTitle>Full Schedule — {program.name}</SecTitle>
          {!isProtocol && (
            <button onClick={() => setMode('edit')} className="text-xs text-accent">Edit</button>
          )}
        </div>
        {program.days.map((d, i) => {
          const active = i === dayIndex
          return (
            <div key={i} className={`flex items-start gap-2.5 py-2 px-2.5 rounded-xl ${active ? 'bg-accent-l' : ''}`}>
              <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 ${active ? 'bg-accent text-white' : 'bg-bg text-muted'}`}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-${active ? 'semibold' : 'normal'} ${active ? 'text-accent' : 'text-primary'} truncate`}>{d.name}</p>
                {d.blocks?.length ? (
                  // Protocol: show block type pills
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {d.blocks.map((b, bi) => (
                      <span key={bi} className={`text-[10px] px-1.5 py-0.5 rounded border ${BLOCK_PILL[b.type]}`}>
                        {BLOCK_LABEL[b.type]}
                      </span>
                    ))}
                  </div>
                ) : (
                  // Flat: show exercise chips
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {getGrouped(d).map((g, gi) =>
                      g.type === 'superset' ? (
                        <span key={gi} className="text-[10px] text-ss bg-ss-l border border-ss-b rounded-full px-1.5 py-0.5">SS: {g.exercises.join('+')}</span>
                      ) : (
                        <span key={gi} className="text-[10px] text-muted">{g.exercises[0]}</span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div className="mt-2 pt-2 border-t border-bg flex items-center justify-between">
          <button onClick={() => removeProgram()} className="text-xs text-danger">Remove program</button>
          <button onClick={() => setMode('import')} className="text-xs text-accent">Import new protocol</button>
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
