import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/app'
import { usePrefs } from '../../store/prefs'
import { habitProgress, muscleCoverage, startOfWeek, today } from '../../lib/utils'
import type { HabitProgressContext } from '../../lib/utils'
import type { Habit, HabitCadence } from '../../types'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Btn, DelBtn, EditBtn } from '../ui/Button'
import { HabitForm } from './habits/HabitForm'
import { ExerciseMuscleEditor } from './habits/ExerciseMuscleEditor'

const CADENCE_ORDER: HabitCadence[] = ['daily', 'weekly', 'monthly']
const CADENCE_LABEL: Record<HabitCadence, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

// ── Habit row ─────────────────────────────────────────────────────────────────

function HabitRow({ habit, ctx, weekStart }: { habit: Habit; ctx: HabitProgressContext; weekStart: 'monday' | 'sunday' }) {
  const { completeHabit, removeHabit, openEditModal, setToast } = useAppStore()
  const p = habitProgress(habit, ctx, today(), weekStart)
  const pct = Math.min(100, Math.round((p.current / p.target) * 100))
  const manual = habit.autoSource === 'none'
  const isCheck = manual && (habit.singleTick || habit.targetCount <= 1)

  const onComplete = async () => {
    try {
      if (isCheck) await completeHabit(habit.id, p.done ? 0 : habit.targetCount)
      else await completeHabit(habit.id, p.current + 1)
    } catch { setToast('❌ Failed to update.') }
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-bg last:border-0">
      <span className="text-xl w-7 text-center shrink-0">{habit.icon || '✅'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-primary truncate">{habit.name}</p>
          {p.done && <span className="text-xs">🎉</span>}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${p.done ? 'bg-success' : 'bg-accent'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-muted font-medium shrink-0 tabular-nums">
            {isCheck
              ? (habit.targetCount > 1 ? `${fmt(habit.targetCount)}${habit.unit ? ` ${habit.unit}` : ''}` : '')
              : `${fmt(p.current)}/${fmt(p.target)}${habit.unit ? ` ${habit.unit}` : ''}`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {manual ? (
          <button
            onClick={onComplete}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              p.done ? 'border-success bg-success/10 text-success' : 'border-accent bg-accent-l text-accent active:scale-95'
            }`}
          >
            {isCheck ? (p.done ? '✓ Done' : 'Mark done') : '+1'}
          </button>
        ) : (
          <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${p.done ? 'bg-success/10 text-success' : 'bg-bg text-muted'}`}>
            {p.done ? '✓ auto' : 'auto'}
          </span>
        )}
        <EditBtn onClick={() => openEditModal({ type: 'habit', record: habit })} />
        <DelBtn onClick={() => removeHabit(habit.id)} />
      </div>
    </div>
  )
}

// ── Muscle coverage dashboard ─────────────────────────────────────────────────

function MuscleCoverageCard() {
  const { weights, mobility, exerciseMuscles, muscleGroups } = useAppStore()
  const { weekStartDay } = usePrefs()
  const weekStart = startOfWeek(today(), weekStartDay)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const rows = useMemo(
    () => muscleCoverage(weights, mobility, exerciseMuscles, muscleGroups, weekStart),
    [weights, mobility, exerciseMuscles, muscleGroups, weekStart],
  )

  const byId = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows])
  const tree = useMemo(() => {
    const tops = rows.filter(r => !r.parentId)
    return tops
      .map(top => {
        const children = rows.filter(r => r.parentId === top.id)
        const stimulus = top.stimulus + children.reduce((s, c) => s + c.stimulus, 0)
        const recovery = top.recovery + children.reduce((s, c) => s + c.recovery, 0)
        return { ...top, children, aggStimulus: stimulus, aggRecovery: recovery }
      })
      .sort((a, b) => b.aggStimulus - a.aggStimulus || a.name.localeCompare(b.name))
  }, [rows])

  const maxStim = Math.max(1, ...tree.map(t => t.aggStimulus))

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <Card>
      <SecTitle>Muscle Coverage · This Week</SecTitle>
      <p className="text-[11px] text-muted mb-3">Weighted training stimulus (by impact level) and recovery work per muscle.</p>
      <div className="flex flex-col gap-1.5">
        {tree.map(t => {
          const hasChildren = t.children.length > 0
          const isOpen = expanded.has(t.id)
          const low = t.aggStimulus === 0
          return (
            <div key={t.id}>
              <button
                onClick={() => hasChildren && toggle(t.id)}
                className={`w-full flex items-center gap-2 py-1 ${hasChildren ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {hasChildren && <span className="text-[10px] text-muted w-3">{isOpen ? '▾' : '▸'}</span>}
                {!hasChildren && <span className="w-3" />}
                <span className="text-xs font-semibold text-primary w-28 text-left truncate">{t.name}</span>
                <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((t.aggStimulus / maxStim) * 100)}%` }} />
                </div>
                <span className="text-[11px] text-muted tabular-nums w-9 text-right">{low ? '—' : fmt(t.aggStimulus)}</span>
                {t.aggRecovery > 0 && <span className="text-[10px] text-success shrink-0" title="recovery minutes">💆{fmt(t.aggRecovery)}</span>}
                {low && t.aggRecovery === 0 && <span className="text-[10px] shrink-0" title="no work this week">⚠️</span>}
              </button>
              {hasChildren && isOpen && (
                <div className="pl-5 flex flex-col gap-1 pb-1">
                  {t.children
                    .slice()
                    .sort((a, b) => b.stimulus - a.stimulus || a.name.localeCompare(b.name))
                    .map(c => {
                      const cr = byId.get(c.id)!
                      return (
                        <div key={c.id} className="flex items-center gap-2">
                          <span className="text-[11px] text-muted w-28 text-left truncate">{c.name}</span>
                          <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round((cr.stimulus / maxStim) * 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-muted tabular-nums w-9 text-right">{cr.stimulus === 0 ? '—' : fmt(cr.stimulus)}</span>
                          {cr.recovery > 0 && <span className="text-[10px] text-success shrink-0">💆{fmt(cr.recovery)}</span>}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <ExerciseMuscleEditor />
    </Card>
  )
}

// ── Tab ───────────────────────────────────────────────────────────────────────

export function HabitsTab() {
  const { habits, weights, mobility, water, cardio, habitCompletions, exerciseMuscles, muscleGroups, exerciseNames } = useAppStore()
  const { weekStartDay } = usePrefs()
  const [showForm, setShowForm] = useState(false)

  const ctx: HabitProgressContext = {
    weights, mobility, water, cardio, habitCompletions, exerciseMuscles, muscleGroups, exerciseNames,
  }

  const byCadence = (c: HabitCadence) => habits.filter(h => h.active && h.cadence === c)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between">
          <SecTitle className="mb-0">Habits & Milestones</SecTitle>
          <Btn small variant={showForm ? 'secondary' : 'primary'} onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Close' : '+ New'}
          </Btn>
        </div>
        {showForm && (
          <div className="mt-3 pt-3 border-t border-bg">
            <HabitForm onDone={() => setShowForm(false)} />
          </div>
        )}
      </Card>

      {habits.length === 0 ? (
        <Card><EmptyMsg>No habits yet — add one to start building a routine.</EmptyMsg></Card>
      ) : (
        CADENCE_ORDER.map(c => {
          const list = byCadence(c)
          if (list.length === 0) return null
          return (
            <Card key={c}>
              <SecTitle>{CADENCE_LABEL[c]}</SecTitle>
              {list.map(h => (
                <HabitRow key={h.id} habit={h} ctx={ctx} weekStart={weekStartDay} />
              ))}
            </Card>
          )
        })
      )}

      <MuscleCoverageCard />
    </div>
  )
}
