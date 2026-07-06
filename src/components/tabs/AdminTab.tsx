import { Card } from '../ui/Card'
import { MuscleGroupEditor } from './admin/MuscleGroupEditor'
import { AdaptationTargetsEditor } from './admin/AdaptationTargetsEditor'
import { ExerciseMuscleEditor } from './habits/ExerciseMuscleEditor'

/**
 * Admin-only maintenance screen for the exercise/muscle taxonomy. Intended to be
 * gated behind an admin role once permissions land.
 */
export function AdminTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-warning/40 bg-warning/5 px-3 py-2">
        <p className="text-xs text-warning font-semibold">🛠️ Admin — taxonomy maintenance</p>
        <p className="text-[11px] text-muted">
          These editors change the shared exercise/muscle data behind every dashboard.
        </p>
      </div>

      <Card>
        <AdaptationTargetsEditor />
      </Card>

      <Card>
        <MuscleGroupEditor />
      </Card>

      <Card>
        <ExerciseMuscleEditor />
      </Card>
    </div>
  )
}
