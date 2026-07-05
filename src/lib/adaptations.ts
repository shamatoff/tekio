import type {
  Adaptation, WeightEntry, CardioEntry, SkillEntry, ExerciseMuscleLink, MuscleGroup,
} from '../types'
import { ADAPTATIONS, ADAPTATION_MAP, defaultAdaptationForExercise } from '../constants/adaptations'
import { LEVEL_WEIGHT, today } from './utils'

// ── Classification ─────────────────────────────────────────────────────────────

/**
 * Adaptation an exercise is *always* trained for, regardless of reps.
 * Precedence: user override map → built-in keyword defaults → null (use reps).
 */
export function resolveExerciseAdaptation(
  exercise: string,
  overrides?: Record<string, Adaptation>,
): Adaptation | null {
  const key = exercise.toLowerCase()
  if (overrides && overrides[key]) return overrides[key]
  return defaultAdaptationForExercise(exercise)
}

/** Classify a single logged resistance set. An exercise `override` wins over reps. */
export function classifyWeightSet(reps: number, override?: Adaptation | null): Adaptation {
  if (override) return override
  if (reps <= 5) return 'strength'
  if (reps <= 15) return 'hypertrophy'
  return 'muscular_endurance'
}

/**
 * Classify a cardio session. Without HR/intensity we use duration as a proxy:
 * long steady state = endurance; medium = VO₂max intervals; short = anaerobic.
 */
export function classifyCardio(entry: CardioEntry): Adaptation {
  if (entry.duration >= 25) return 'endurance'
  if (entry.duration >= 8) return 'vo2max'
  return 'anaerobic_capacity'
}

// ── Coverage ────────────────────────────────────────────────────────────────────

export type MuscleStatus = 'on_track' | 'needs_work' | 'untouched'

export interface MuscleStatusRow {
  id: string
  name: string
  parentId: string | null
  /** Weighted sets toward this adaptation this week (self only). */
  sets: number
  /** Weighted sets including immediate children. */
  aggSets: number
  target: number
  status: MuscleStatus
  children: MuscleStatusRow[]
}

export interface AdaptationSummary {
  key: Adaptation
  /** Primary weekly volume: set count (resistance) or session count (cardio/skill). */
  volume: number
  unit: 'sets' | 'sessions'
  /** Top-level muscle rows with rolled-up children (resistance adaptations only). */
  muscles: MuscleStatusRow[]
  /** On-track / worked / total muscle counts (resistance only). */
  onTrack: number
  worked: number
  totalMuscles: number
}

function statusFor(aggSets: number, target: number): MuscleStatus {
  if (aggSets <= 0) return 'untouched'
  if (aggSets >= target) return 'on_track'
  return 'needs_work'
}

const inRange = (d: string, start: string, end: string) => d >= start && d <= end

/**
 * Per-adaptation weekly coverage across all modalities for [weekStart, date].
 * Resistance adaptations get a rolled-up muscle-group breakdown with status;
 * cardio/skill adaptations report session counts.
 */
export function adaptationCoverage(
  args: {
    weights: WeightEntry[]
    cardio: CardioEntry[]
    skills: SkillEntry[]
    exerciseMuscles: ExerciseMuscleLink[]
    muscleGroups: MuscleGroup[]
    weekStart: string
    date?: string
    /** Optional exercise-name → adaptation overrides (lowercased keys). */
    overrides?: Record<string, Adaptation>
  },
): Record<Adaptation, AdaptationSummary> {
  const { weights, cardio, skills, exerciseMuscles, muscleGroups, weekStart, overrides } = args
  const date = args.date ?? today()

  // exercise (lower) → stimulus links
  const linksByExercise = new Map<string, ExerciseMuscleLink[]>()
  for (const l of exerciseMuscles) {
    if (l.contribution !== 'stimulus') continue
    const k = l.exercise.toLowerCase()
    const arr = linksByExercise.get(k) ?? []
    arr.push(l)
    linksByExercise.set(k, arr)
  }

  const volume = {} as Record<Adaptation, number>
  // adaptation → groupName → weighted sets
  const muscle = {} as Record<Adaptation, Record<string, number>>
  for (const a of ADAPTATIONS) {
    volume[a.key] = 0
    muscle[a.key] = {}
  }

  // Resistance work, classified per set.
  for (const w of weights) {
    if (!inRange(w.date, weekStart, date)) continue
    const override = resolveExerciseAdaptation(w.exercise, overrides)
    const links = linksByExercise.get(w.exercise.toLowerCase())
    for (const set of w.sets) {
      const a = classifyWeightSet(set.reps, override)
      volume[a] += 1
      if (links) {
        for (const l of links) {
          muscle[a][l.group] = (muscle[a][l.group] ?? 0) + (LEVEL_WEIGHT[l.level] ?? 0)
        }
      }
    }
  }

  // Cardio sessions.
  for (const c of cardio) {
    if (!inRange(c.date, weekStart, date)) continue
    volume[classifyCardio(c)] += 1
  }

  // Skill sessions.
  for (const s of skills) {
    if (!inRange(s.date, weekStart, date)) continue
    volume.skill += 1
  }

  const out = {} as Record<Adaptation, AdaptationSummary>
  for (const meta of ADAPTATIONS) {
    const byGroup = muscle[meta.key]
    const muscles = meta.modality === 'resistance' && meta.weeklyMuscleTarget > 0
      ? buildMuscleStatusTree(byGroup, muscleGroups, meta.weeklyMuscleTarget)
      : []
    out[meta.key] = {
      key: meta.key,
      volume: volume[meta.key],
      unit: meta.modality === 'resistance' ? 'sets' : 'sessions',
      muscles,
      onTrack: muscles.filter(m => m.status === 'on_track').length,
      worked: muscles.filter(m => m.status !== 'untouched').length,
      totalMuscles: muscles.length,
    }
  }
  return out
}

/**
 * Rolls direct per-group weighted sets up into a top-level tree (parent +
 * immediate children), assigning each a status against `target`.
 */
export function buildMuscleStatusTree(
  byGroupName: Record<string, number>,
  groups: MuscleGroup[],
  target: number,
): MuscleStatusRow[] {
  const direct = (name: string) => +(byGroupName[name] ?? 0).toFixed(2)

  const tops = groups.filter(g => !g.parentId)
  return tops
    .map(top => {
      const children = groups
        .filter(g => g.parentId === top.id)
        .map<MuscleStatusRow>(c => {
          const sets = direct(c.name)
          return {
            id: c.id, name: c.name, parentId: c.parentId ?? null,
            sets, aggSets: sets, target,
            status: statusFor(sets, target), children: [],
          }
        })
      const selfSets = direct(top.name)
      const aggSets = +(selfSets + children.reduce((s, c) => s + c.sets, 0)).toFixed(2)
      return {
        id: top.id, name: top.name, parentId: null,
        sets: selfSets, aggSets, target,
        status: statusFor(aggSets, target),
        children: children.sort((a, b) => b.sets - a.sets || a.name.localeCompare(b.name)),
      }
    })
    .sort((a, b) => b.aggSets - a.aggSets || a.name.localeCompare(b.name))
}

/** Convenience: total tracked volume across all adaptations this week. */
export function totalAdaptationVolume(cov: Record<Adaptation, AdaptationSummary>): number {
  return ADAPTATIONS.reduce((s, a) => s + cov[a.key].volume, 0)
}

export { ADAPTATIONS, ADAPTATION_MAP }
