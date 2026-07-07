import { useMemo, useState } from 'react'
import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { muscleCoverage, startOfWeek, today } from '../../../lib/utils'
import { Card, SecTitle } from '../../ui/Card'

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export function MuscleCoverageCard() {
  const { weights, mobility, exerciseMuscles, muscleGroups, habits, habitCompletions, exerciseNames } = useAppStore()
  const { weekStartDay } = usePrefs()
  const weekStart = startOfWeek(today(), weekStartDay)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const rows = useMemo(
    () => muscleCoverage(weights, mobility, exerciseMuscles, muscleGroups, weekStart, today(), habits, habitCompletions, exerciseNames),
    [weights, mobility, exerciseMuscles, muscleGroups, weekStart, habits, habitCompletions, exerciseNames],
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
    </Card>
  )
}
