import type { Adaptation } from '../types'

/** Training modality an adaptation is primarily trained through. */
export type AdaptationModality = 'resistance' | 'cardio' | 'skill'

export interface AdaptationRx {
  /** Load / intensity guidance. */
  load: string
  reps: string
  sets: string
  rest: string
  /** Proximity to failure / effort. */
  effort: string
  /** One-line coaching cue. */
  cue: string
}

export interface AdaptationMeta {
  key: Adaptation
  label: string
  icon: string
  /** Hex colour used for bars, chips and accents. */
  color: string
  /** One-line essence, shown under the label. */
  summary: string
  rx: AdaptationRx
  modality: AdaptationModality
  /**
   * Inclusive rep range used to auto-classify a resistance set into this
   * adaptation. `null` = not rep-derived (needs an exercise tag, or comes from
   * cardio / skill logging).
   */
  repRange: [number, number] | null
  /**
   * Default weekly per-muscle-group target (weighted sets) used to colour a
   * muscle green (on track) vs amber (needs work). `0` = not muscle-targeted
   * (cardio / skill adaptations show sessions instead).
   */
  weeklyMuscleTarget: number
  /**
   * Weekly session target for non-resistance adaptations (cardio / skill). An
   * adaptation counts as "on target" once this many sessions are logged. `0` for
   * resistance adaptations, which are judged by their muscle targets instead.
   */
  weeklySessionTarget: number
}

/**
 * The nine adaptations, ordered along Galpin's force–velocity → endurance
 * continuum. This array is the single source of truth for the dashboard,
 * tooltips and reference card.
 */
export const ADAPTATIONS: AdaptationMeta[] = [
  {
    key: 'skill',
    label: 'Skill',
    icon: '🎯',
    color: '#8b5cf6',
    summary: 'Movement proficiency & technique',
    modality: 'skill',
    repRange: null,
    weeklyMuscleTarget: 0,
    weeklySessionTarget: 3,
    rx: {
      load: 'Very light / bodyweight',
      reps: '3–5 crisp reps',
      sets: 'Many short bouts',
      rest: 'Full — stay fresh',
      effort: 'Never to fatigue',
      cue: 'Practice often with perfect form; stop before quality drops.',
    },
  },
  {
    key: 'speed',
    label: 'Speed',
    icon: '⚡',
    color: '#06b6d4',
    summary: 'Rate of movement / quickness',
    modality: 'resistance',
    repRange: null,
    weeklyMuscleTarget: 3,
    weeklySessionTarget: 0,
    rx: {
      load: '0–30% 1RM',
      reps: '1–5, maximal velocity',
      sets: '3–5',
      rest: '2–5 min (full)',
      effort: 'Never to fatigue',
      cue: 'Every rep as fast as possible; quit when speed drops.',
    },
  },
  {
    key: 'power',
    label: 'Power',
    icon: '💥',
    color: '#f97316',
    summary: 'Force × velocity — explosiveness',
    modality: 'resistance',
    repRange: null,
    weeklyMuscleTarget: 4,
    weeklySessionTarget: 0,
    rx: {
      load: '30–70% 1RM',
      reps: '1–5, explosive intent',
      sets: '3–5',
      rest: '2–5 min (full)',
      effort: 'Never to fatigue',
      cue: 'Jumps, throws, Olympic lifts — move with maximal intent.',
    },
  },
  {
    key: 'strength',
    label: 'Strength',
    icon: '🏋️',
    color: '#ef4444',
    summary: 'Maximal force production',
    modality: 'resistance',
    repRange: [1, 5],
    weeklyMuscleTarget: 8,
    weeklySessionTarget: 0,
    rx: {
      load: '85–100% 1RM',
      reps: '3–5',
      sets: '3–5',
      rest: '2–5 min (full)',
      effort: '1–2 reps shy of failure',
      cue: 'Galpin’s 3–5 rule: 3–5 reps, 3–5 sets, 3–5 min rest, ~3–5×/week.',
    },
  },
  {
    key: 'hypertrophy',
    label: 'Hypertrophy',
    icon: '💪',
    color: '#6366f1',
    summary: 'Muscle growth',
    modality: 'resistance',
    repRange: [6, 15],
    weeklyMuscleTarget: 10,
    weeklySessionTarget: 0,
    rx: {
      load: '30–80% 1RM',
      reps: '5–30 (≈8–15)',
      sets: '10–20 / muscle / week',
      rest: '30 s–2 min',
      effort: '0–4 reps shy of failure',
      cue: 'Drive total weekly volume with high effort per set.',
    },
  },
  {
    key: 'muscular_endurance',
    label: 'Muscular Endurance',
    icon: '🔁',
    color: '#14b8a6',
    summary: 'Resistance to local muscle fatigue',
    modality: 'resistance',
    repRange: [16, 999],
    weeklyMuscleTarget: 6,
    weeklySessionTarget: 0,
    rx: {
      load: '<50% 1RM',
      reps: '15–40+',
      sets: '2–4',
      rest: 'Short (<60 s)',
      effort: 'To / near failure',
      cue: 'High-rep, short-rest circuits and bodyweight work.',
    },
  },
  {
    key: 'anaerobic_capacity',
    label: 'Anaerobic Capacity',
    icon: '🔥',
    color: '#eab308',
    summary: 'Glycolytic power / lactate tolerance',
    modality: 'cardio',
    repRange: null,
    weeklyMuscleTarget: 0,
    weeklySessionTarget: 1,
    rx: {
      load: 'All-out',
      reps: '20 s–2 min efforts',
      sets: '3–8 rounds',
      rest: 'Incomplete (1:2–1:4)',
      effort: 'Maximal',
      cue: 'Brutal short intervals with partial recovery.',
    },
  },
  {
    key: 'vo2max',
    label: 'Max Aerobic (VO₂max)',
    icon: '🫀',
    color: '#ec4899',
    summary: 'Maximal oxygen uptake',
    modality: 'cardio',
    repRange: null,
    weeklyMuscleTarget: 0,
    weeklySessionTarget: 1,
    rx: {
      load: '~90–100% max HR',
      reps: '3–8 min efforts',
      sets: '4–6',
      rest: '≈1:1',
      effort: 'Maximal',
      cue: 'Classic 4×4 min at 90–95% HRmax, 3 min easy between.',
    },
  },
  {
    key: 'endurance',
    label: 'Long-Duration Endurance',
    icon: '🏃',
    color: '#10b981',
    summary: 'Aerobic base / steady state',
    modality: 'cardio',
    repRange: null,
    weeklyMuscleTarget: 0,
    weeklySessionTarget: 2,
    rx: {
      load: 'Zone 2 (conversational)',
      reps: '30 min–hours',
      sets: '1 continuous',
      rest: '—',
      effort: 'Easy, sustainable',
      cue: 'Nasal-breathing pace; builds mitochondria & fat oxidation.',
    },
  },
]

/** Fast lookup by key. */
export const ADAPTATION_MAP: Record<Adaptation, AdaptationMeta> = Object.fromEntries(
  ADAPTATIONS.map(a => [a.key, a]),
) as Record<Adaptation, AdaptationMeta>

/** Cross-cutting principle shown at the top of the reference card. */
export const ADAPTATION_PRINCIPLE =
  'Skill · Speed · Power · Strength are quality-driven — never train to fatigue, rest fully. ' +
  'Hypertrophy → Endurance are volume/fatigue-driven — accumulate work and push effort.'

/**
 * Keyword → adaptation defaults for exercises whose quality can’t be read from
 * reps alone (explosive / plyometric / sprint work). Checked as case-insensitive
 * substring matches; first hit wins. User-set tags override these.
 */
const KEYWORD_ADAPTATION: [string, Adaptation][] = [
  // Speed / sprint / reactive
  ['sprint', 'speed'],
  ['dash', 'speed'],
  ['agility', 'speed'],
  ['pogo', 'speed'],
  // Power / plyometric / ballistic / Olympic
  ['clean', 'power'],
  ['snatch', 'power'],
  ['jerk', 'power'],
  ['box jump', 'power'],
  ['broad jump', 'power'],
  ['jump squat', 'power'],
  ['jump', 'power'],
  ['plyo', 'power'],
  ['throw', 'power'],
  ['med ball', 'power'],
  ['medicine ball', 'power'],
  ['slam', 'power'],
  ['kettlebell swing', 'power'],
  ['kb swing', 'power'],
  ['sled', 'power'],
  ['hop', 'power'],
]

/** Built-in adaptation for an exercise name, or null if it should fall back to reps. */
export function defaultAdaptationForExercise(name: string): Adaptation | null {
  const n = name.toLowerCase()
  for (const [kw, a] of KEYWORD_ADAPTATION) {
    if (n.includes(kw)) return a
  }
  return null
}
