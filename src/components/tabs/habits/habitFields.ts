import type { Habit, HabitAutoSource, MuscleGroup } from '../../../types'

export type LinkType = 'none' | 'muscle' | 'exercise'

export const AUTO_SOURCE_LABEL: Record<HabitAutoSource, string> = {
  none: 'Manual check-off',
  weight_sets: 'Weight sets (auto)',
  mobility_minutes: 'Mobility minutes (auto)',
  water: 'Water intake (auto)',
  cardio_sessions: 'Cardio sessions (auto)',
}

/** Auto-source options available for a given link choice. */
export function autoSourceOptions(link: LinkType): HabitAutoSource[] {
  if (link === 'muscle' || link === 'exercise') return ['weight_sets', 'mobility_minutes', 'none']
  return ['none', 'water', 'cardio_sessions']
}

/** Sensible default source when the link type changes. */
export function defaultAutoSource(link: LinkType): HabitAutoSource {
  return link === 'none' ? 'none' : 'weight_sets'
}

/** Default unit string implied by an auto-source. */
export function defaultUnit(src: HabitAutoSource): string {
  return { weight_sets: 'sets', mobility_minutes: 'minutes', water: 'ml', cardio_sessions: 'sessions', none: '' }[src]
}

/** Auto-sources that require a muscle/exercise link to compute progress. */
export function sourceNeedsLink(src: HabitAutoSource): boolean {
  return src === 'weight_sets' || src === 'mobility_minutes'
}

/** Builds <option> data for a muscle select: top-level groups then "Parent › Child". */
export function muscleOptions(groups: MuscleGroup[]): { value: string; label: string }[] {
  const byId = new Map(groups.map(g => [g.id, g]))
  const topLevel = groups.filter(g => !g.parentId).sort((a, b) => a.name.localeCompare(b.name))
  const out: { value: string; label: string }[] = []
  for (const top of topLevel) {
    out.push({ value: top.id, label: top.name })
    groups
      .filter(g => g.parentId === top.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(child => out.push({ value: child.id, label: `${byId.get(top.id)!.name} › ${child.name}` }))
  }
  return out
}

export function linkTypeOf(habit: Pick<Habit, 'muscleGroupId' | 'exerciseId'>): LinkType {
  if (habit.muscleGroupId) return 'muscle'
  if (habit.exerciseId) return 'exercise'
  return 'none'
}
