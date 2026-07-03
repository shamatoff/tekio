// Builds a compact snapshot of the user's current data so the model can resolve
// names (muscle groups, exercises, habits, program days) without extra round-trips.
// Small by design — a single user's catalogue is tiny.
import type { AppState } from '../../types'

type ContextInput = Pick<AppState, 'muscleGroups' | 'exerciseMuscles' | 'habits' | 'programs'> & {
  exerciseNames: Record<string, string>
}

export function buildContext(s: ContextInput): string {
  const parts: string[] = []

  // Muscle groups (with parent, for the hierarchy).
  const nameById = new Map(s.muscleGroups.map(g => [g.id, g.name]))
  const muscles = s.muscleGroups
    .map(g => {
      const parent = g.parentId ? nameById.get(g.parentId) : null
      return `${g.name} (${g.bodyRegion}${parent ? `, under ${parent}` : ''})`
    })
    .sort()
  if (muscles.length) parts.push(`## Muscle groups\n${muscles.join('\n')}`)

  // Exercises.
  const exercises = Object.values(s.exerciseNames).sort()
  if (exercises.length) parts.push(`## Exercises\n${exercises.join(', ')}`)

  // Habits.
  if (s.habits.length) {
    const habits = s.habits.map(h => {
      const link = h.muscleGroupId
        ? ` [muscle: ${nameById.get(h.muscleGroupId) ?? '?'}]`
        : h.exerciseId
          ? ` [exercise: ${s.exerciseNames[h.exerciseId] ?? '?'}]`
          : ''
      const unit = h.unit ? ` ${h.unit}` : ''
      return `${h.name} (${h.cadence}, target ${h.targetCount}${unit})${link}`
    })
    parts.push(`## Habits\n${habits.join('\n')}`)
  }

  // Active programs and their days.
  if (s.programs.length) {
    const progs = s.programs.map(p => {
      const days = p.days
        .map(d => `  - ${d.name}: ${d.exercises.length ? d.exercises.join(', ') : '(empty)'}`)
        .join('\n')
      return `${p.name}\n${days}`
    })
    parts.push(`## Active programs\n${progs.join('\n')}`)
  }

  return parts.join('\n\n')
}
