import { describe, it, expect } from 'vitest'
import {
  classifyWeightSet,
  classifyCardio,
  resolveExerciseAdaptation,
  adaptationCoverage,
  buildMuscleStatusTree,
} from '../lib/adaptations'
import type { CardioEntry, ExerciseMuscleLink, Habit, HabitCompletion, MuscleGroup, WeightEntry } from '../types'

// ── classifyWeightSet ─────────────────────────────────────────────────────────

describe('classifyWeightSet', () => {
  it('maps rep ranges to strength / hypertrophy / muscular endurance', () => {
    expect(classifyWeightSet(1)).toBe('strength')
    expect(classifyWeightSet(5)).toBe('strength')
    expect(classifyWeightSet(6)).toBe('hypertrophy')
    expect(classifyWeightSet(15)).toBe('hypertrophy')
    expect(classifyWeightSet(16)).toBe('muscular_endurance')
    expect(classifyWeightSet(30)).toBe('muscular_endurance')
  })

  it('lets an exercise override win over reps', () => {
    expect(classifyWeightSet(3, 'power')).toBe('power')
    expect(classifyWeightSet(20, 'speed')).toBe('speed')
  })
})

// ── classifyCardio ────────────────────────────────────────────────────────────

describe('classifyCardio', () => {
  const c = (duration: number): CardioEntry => ({ id: 'x', date: '2025-01-01', type: 'Running', duration })
  it('splits by duration proxy', () => {
    expect(classifyCardio(c(45))).toBe('endurance')
    expect(classifyCardio(c(25))).toBe('endurance')
    expect(classifyCardio(c(12))).toBe('vo2max')
    expect(classifyCardio(c(4))).toBe('anaerobic_capacity')
  })
})

// ── resolveExerciseAdaptation ─────────────────────────────────────────────────

describe('resolveExerciseAdaptation', () => {
  it('uses built-in keyword defaults', () => {
    expect(resolveExerciseAdaptation('Box Jump')).toBe('power')
    expect(resolveExerciseAdaptation('Power Clean')).toBe('power')
    expect(resolveExerciseAdaptation('40m Sprint')).toBe('speed')
    expect(resolveExerciseAdaptation('Pogo Hops')).toBe('speed')
  })

  it('returns null for ordinary lifts (fall back to reps)', () => {
    expect(resolveExerciseAdaptation('Back Squat')).toBeNull()
    expect(resolveExerciseAdaptation('Bench Press')).toBeNull()
  })

  it('lets user overrides win over keyword defaults', () => {
    expect(resolveExerciseAdaptation('Box Jump', { 'box jump': 'strength' })).toBe('strength')
  })
})

// ── buildMuscleStatusTree ─────────────────────────────────────────────────────

const groups: MuscleGroup[] = [
  { id: 'chest', name: 'Chest', bodyRegion: 'upper', parentId: null },
  { id: 'shoulders', name: 'Shoulders', bodyRegion: 'upper', parentId: null },
  { id: 'front-delt', name: 'Front Delt', bodyRegion: 'upper', parentId: 'shoulders' },
]

describe('buildMuscleStatusTree', () => {
  it('rolls children into parents and assigns status by target', () => {
    const tree = buildMuscleStatusTree({ Chest: 12, 'Front Delt': 4 }, groups, 10)
    const chest = tree.find(r => r.id === 'chest')!
    const shoulders = tree.find(r => r.id === 'shoulders')!
    expect(chest.status).toBe('on_track') // 12 >= 10
    expect(shoulders.aggSets).toBe(4)      // rolled up from child
    expect(shoulders.status).toBe('needs_work')
    expect(shoulders.children[0].name).toBe('Front Delt')
  })

  it('marks untouched groups', () => {
    const tree = buildMuscleStatusTree({}, groups, 10)
    expect(tree.every(r => r.status === 'untouched')).toBe(true)
  })
})

// ── adaptationCoverage ────────────────────────────────────────────────────────

const links: ExerciseMuscleLink[] = [
  { exercise: 'Bench Press', group: 'Chest', region: 'upper', level: 1, contribution: 'stimulus' },
  { exercise: 'Box Jump', group: 'Front Delt', region: 'upper', level: 1, contribution: 'stimulus' },
]

function w(id: string, date: string, exercise: string, reps: number, nSets: number): WeightEntry {
  return { id, date, exercise, sets: Array.from({ length: nSets }, () => ({ weight: 60, reps })) }
}

describe('adaptationCoverage', () => {
  it('classifies sets into adaptations and accumulates muscle stimulus', () => {
    const cov = adaptationCoverage({
      weights: [
        w('a', '2025-01-02', 'Bench Press', 4, 3),  // strength ×3, Chest lvl1 → 3
        w('b', '2025-01-03', 'Bench Press', 10, 4), // hypertrophy ×4, Chest → 4
        w('c', '2025-01-03', 'Box Jump', 5, 5),     // power ×5 (keyword), Front Delt → 5
      ],
      cardio: [{ id: 'r', date: '2025-01-04', type: 'Running', duration: 45 }],
      skills: [{ id: 's', date: '2025-01-04', skill: 'Tennis', withTrainer: false, quality: 3, notes: '' }],
      exerciseMuscles: links,
      muscleGroups: groups,
      weekStart: '2025-01-01',
      date: '2025-01-07',
    })

    expect(cov.strength.volume).toBe(3)
    expect(cov.hypertrophy.volume).toBe(4)
    expect(cov.power.volume).toBe(5)
    expect(cov.endurance.volume).toBe(1)
    expect(cov.skill.volume).toBe(1)

    const chestStrength = cov.strength.muscles.find(m => m.id === 'chest')!
    expect(chestStrength.aggSets).toBe(3)
    const chestHyp = cov.hypertrophy.muscles.find(m => m.id === 'chest')!
    expect(chestHyp.aggSets).toBe(4)
    // Box Jump power routed to Front Delt (child of Shoulders)
    const shouldersPower = cov.power.muscles.find(m => m.id === 'shoulders')!
    expect(shouldersPower.aggSets).toBe(5)
  })

  it('ignores entries outside the week window', () => {
    const cov = adaptationCoverage({
      weights: [w('a', '2024-12-30', 'Bench Press', 4, 3)],
      cardio: [],
      skills: [],
      exerciseMuscles: links,
      muscleGroups: groups,
      weekStart: '2025-01-01',
      date: '2025-01-07',
    })
    expect(cov.strength.volume).toBe(0)
  })

  it('folds manual exercise-linked habit ticks into the exercise\'s adaptation', () => {
    const boxJumpHabit: Habit = {
      id: 'hb', name: 'Box Jumps', cadence: 'daily', targetCount: 1, autoSource: 'none',
      countLevel: 1, contribution: 'stimulus', singleTick: true, active: true, sortOrder: 0, exerciseId: 'bj',
    }
    const comps: HabitCompletion[] = [
      { id: 'c1', habitId: 'hb', periodStart: '2025-01-02', count: 2 },
      { id: 'c2', habitId: 'hb', periodStart: '2024-12-30', count: 5 }, // outside window → excluded
    ]
    const cov = adaptationCoverage({
      weights: [], cardio: [], skills: [],
      exerciseMuscles: links, muscleGroups: groups,
      weekStart: '2025-01-01', date: '2025-01-07',
      habits: [boxJumpHabit], habitCompletions: comps, exerciseNames: { bj: 'Box Jump' },
    })
    expect(cov.power.volume).toBe(2) // Box Jump → power (keyword), 2 in-week ticks
    const shoulders = cov.power.muscles.find(m => m.id === 'shoulders')!
    expect(shoulders.aggSets).toBe(2) // Front Delt L1 × 2, rolled up to Shoulders
  })
})
