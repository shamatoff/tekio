import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/app'
import { usePrefs } from '../../store/prefs'
import { startOfWeek, today } from '../../lib/utils'
import { adaptationCoverage, totalAdaptationVolume } from '../../lib/adaptations'
import { ADAPTATIONS } from '../../constants/adaptations'
import type { Adaptation } from '../../types'
import { Card } from '../ui/Card'
import { AdaptationCard } from './home/AdaptationCard'
import { AdaptationGuide } from './home/AdaptationGuide'
import { MuscleCoverageCard } from './home/MuscleCoverageCard'

interface HomeTabProps {
  setTab: (t: string) => void
}

export function HomeTab({ setTab }: HomeTabProps) {
  const { weights, cardio, skills, exerciseMuscles, muscleGroups, exerciseAdaptations, adaptationTargets } = useAppStore()
  const { weekStartDay, trackedMuscleGroupIds } = usePrefs()
  const weekStart = startOfWeek(today(), weekStartDay)
  const [openKey, setOpenKey] = useState<Adaptation | null>(null)

  const coverage = useMemo(
    () => adaptationCoverage({ weights, cardio, skills, exerciseMuscles, muscleGroups, weekStart, overrides: exerciseAdaptations, trackedMuscleIds: trackedMuscleGroupIds, targets: adaptationTargets }),
    [weights, cardio, skills, exerciseMuscles, muscleGroups, weekStart, exerciseAdaptations, trackedMuscleGroupIds, adaptationTargets],
  )

  const total = totalAdaptationVolume(coverage)
  const onTarget = ADAPTATIONS.filter(a => coverage[a.key].met).length

  return (
    <div className="flex flex-col gap-4">
      {/* Week summary hero */}
      <div className="rounded-2xl p-4 bg-primary text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60 mb-1">
          Adaptations · This Week
        </p>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-3xl font-bold leading-none">{onTarget}<span className="text-lg text-white/50">/9</span></p>
            <p className="text-[11px] text-white/60 mt-1">on target this week</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold leading-none">{total}</p>
            <p className="text-[11px] text-white/60 mt-1">total sets + sessions</p>
          </div>
        </div>
      </div>

      {total === 0 && (
        <Card>
          <p className="text-sm text-muted text-center py-2">
            Nothing logged this week yet.{' '}
            <button onClick={() => setTab('Overview')} className="text-accent font-semibold">
              Log a session →
            </button>
          </p>
        </Card>
      )}

      {/* Nine adaptation cards */}
      <div className="flex flex-col gap-2">
        {ADAPTATIONS.map(meta => (
          <AdaptationCard
            key={meta.key}
            meta={meta}
            summary={coverage[meta.key]}
            open={openKey === meta.key}
            onToggle={() => setOpenKey(k => (k === meta.key ? null : meta.key))}
          />
        ))}
      </div>

      {/* Status legend */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-muted">
        <span>🟢 on track</span>
        <span>🟡 needs work</span>
        <span>⚪ untouched</span>
      </div>

      <MuscleCoverageCard />

      <AdaptationGuide />
    </div>
  )
}
