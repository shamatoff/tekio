import { useState } from 'react'
import { cycleInfo, getGrouped, isDeloadDate, isTodayDone } from '../../../lib/utils'
import { ExPlan, deloadSets } from './ExPlan'
import { SSBadge } from '../../ui/Badges'
import type { Program, WeightEntry, LiftSet } from '../../../types'

interface TodaysPlanProps {
  program: Program
  weights: WeightEntry[]
  onPickSingle: (ex: string) => void
  onPickSingleWithSets: (ex: string, sets: LiftSet[]) => void
  onPickSuperset: (exercises: [string, string]) => void
  onPickSupersetDeload: (exercises: [string, string], lastPerf: (n: string) => WeightEntry | undefined) => void
}

export function TodaysPlan({ program, weights, onPickSingle, onPickSingleWithSets, onPickSuperset, onPickSupersetDeload }: TodaysPlanProps) {
  const [open, setOpen] = useState(true)
  const { isDeload } = cycleInfo(program)
  const day = program.days[program.currentDayIndex % program.days.length]
  if (!day) return null

  const lastPerf = (n: string): WeightEntry | undefined =>
    [...weights]
      .filter(d => d.exercise.toLowerCase() === n.toLowerCase() && !isDeloadDate(program.startDate, d.date))
      .sort((a, b) => b.date.localeCompare(a.date))[0]

  const done = isTodayDone(weights, day)
  const groups = getGrouped(day)

  const headerLabel = isDeload ? '⚠️ Deload Week' : done ? `✅ ${day.name} — Done` : `📋 ${day.name}`
  const headerColor = isDeload ? 'text-dl-tx' : done ? 'text-success' : 'text-primary'
  const headerBg = isDeload ? 'bg-dl-bg border-dl-bd' : done ? 'bg-green-50 border-green-200' : 'bg-[#f8fafc] border-border'

  return (
    <div className={`rounded-2xl overflow-hidden border mb-1 ${headerBg}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3.5 py-3 border-b ${headerBg}`}
      >
        <span className={`text-xs font-bold ${headerColor}`}>{headerLabel}</span>
        <span className="text-xs text-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="bg-surface px-3.5 pb-3.5">
          {groups.map((g, gi) => {
            if (g.type === 'superset') {
              return (
                <div key={gi} className="mt-3 border border-ss-b rounded-xl p-2.5 bg-ss-l">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <SSBadge />
                      <span className="text-xs text-ss font-semibold">Superset</span>
                    </div>
                    {isDeload ? (
                      <button
                        onClick={() => onPickSupersetDeload(g.exercises, lastPerf)}
                        className="text-[11px] font-semibold text-white bg-dl-tx rounded-full px-2.5 py-1"
                      >
                        Deload ↓
                      </button>
                    ) : (
                      <button
                        onClick={() => onPickSuperset(g.exercises)}
                        className="text-[11px] font-semibold text-white bg-ss rounded-full px-2.5 py-1"
                      >
                        Log Together ↓
                      </button>
                    )}
                  </div>
                  {g.exercises.map((ex, ei) => (
                    <ExPlan
                      key={ei}
                      ex={ex}
                      last={lastPerf(ex)}
                      isDeload={isDeload}
                      programStartDate={program.startDate}
                      onPick={onPickSingle}
                      onPickWithSets={onPickSingleWithSets}
                    />
                  ))}
                </div>
              )
            }
            return (
              <ExPlan
                key={gi}
                ex={g.exercises[0]}
                last={lastPerf(g.exercises[0])}
                isDeload={isDeload}
                programStartDate={program.startDate}
                onPick={onPickSingle}
                onPickWithSets={onPickSingleWithSets}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// Export helper so WeightsTab can use it
export { deloadSets }
