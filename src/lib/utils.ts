import type { WeightEntry, Program, ProgramDay } from '../types'

export type GroupedExercise =
  | { type: 'single'; exercises: [string] }
  | { type: 'superset'; exercises: [string, string] }

const CYCLE = 6

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2)

export const today = (): string =>
  new Date().toISOString().slice(0, 10)

export const weekKey = (s: string): string => {
  const d = new Date(s)
  const j = new Date(d.getFullYear(), 0, 4)
  const w = Math.ceil(((d.getTime() - j.getTime()) / 86400000 + j.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(w).padStart(2, '0')}`
}

export const r05 = (v: number): number => Math.round(v * 2) / 2

export interface CycleInfo {
  week: number
  isDeload: boolean
}

export function cycleInfo(p: Program | null | undefined): CycleInfo {
  if (!p?.startDate) return { week: 1, isDeload: false }
  const days = Math.max(
    0,
    Math.floor((new Date(today()).getTime() - new Date(p.startDate).getTime()) / 86400000),
  )
  const wc = (Math.floor(days / 7) % (CYCLE + 1)) + 1
  return { week: wc, isDeload: wc === CYCLE }
}

export function isDeloadDate(startDate: string | null | undefined, d: string): boolean {
  if (!startDate) return false
  const days = Math.max(
    0,
    Math.floor((new Date(d).getTime() - new Date(startDate).getTime()) / 86400000),
  )
  const wc = (Math.floor(days / 7) % (CYCLE + 1)) + 1
  return wc === CYCLE
}

export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const m = new Map(existing.map((e) => [e.id, e]))
  incoming.forEach((e) => m.set(e.id, e))
  return [...m.values()]
}

export function getGrouped(day: ProgramDay | null | undefined): GroupedExercise[] {
  if (!day) return []
  const ss = day.supersets ?? []
  const used = new Set<string>()
  const groups: GroupedExercise[] = []
  for (const ex of day.exercises ?? []) {
    if (used.has(ex)) continue
    const pair = ss.find(p => p.includes(ex))
    if (pair) {
      const partner = pair.find(e => e !== ex)
      if (partner && day.exercises.includes(partner) && !used.has(partner)) {
        groups.push({ type: 'superset', exercises: [ex, partner] })
        used.add(ex); used.add(partner); continue
      }
    }
    groups.push({ type: 'single', exercises: [ex] })
    used.add(ex)
  }
  return groups
}

export function sessionDates(weights: WeightEntry[], exArr: string[]): string[] {
  const m: Record<string, Set<string>> = {}
  weights.forEach(w => {
    if (!m[w.date]) m[w.date] = new Set()
    m[w.date].add(w.exercise.toLowerCase())
  })
  return Object.entries(m)
    .filter(([, s]) => exArr.some(e => s.has(e.toLowerCase())))
    .map(([d]) => d)
    .sort((a, b) => b.localeCompare(a))
}

export function defaultProgram(): Program {
  return {
    name: '5-Day High Efficiency Split',
    startDate: today(),
    currentDayIndex: 0,
    lastAdvancedDate: today(),
    days: [
      { name: 'Day 1 — Squat + Bench + Curls', exercises: ['Back Squat', 'Bench Press', 'Bicep Curls'], supersets: [['Bench Press', 'Bicep Curls']] },
      { name: 'Day 2 — Deadlift + Rows + Calves', exercises: ['Deadlift', 'Rows', 'Calf Raises', 'Reverse Fly'], supersets: [['Calf Raises', 'Reverse Fly']] },
      { name: 'Day 3 — OHP + Pull-ups + Triceps', exercises: ['Overhead Press', 'Pull-ups', 'Tricep Extensions'], supersets: [] },
      { name: 'Day 4 — Squat + Bench + Curls', exercises: ['Back Squat', 'Bench Press', 'Bicep Curls'], supersets: [['Bench Press', 'Bicep Curls']] },
      { name: 'Day 5 — Rows + Deadlift + Triceps', exercises: ['Rows', 'Deadlift', 'Tricep Extensions', 'Calf Raises'], supersets: [['Tricep Extensions', 'Calf Raises']] },
    ],
  }
}

export function isTodayDone(
  weights: WeightEntry[],
  day: ProgramDay | null | undefined,
): boolean {
  return (day?.exercises ?? []).every((ex) =>
    weights.some((w) => w.date === today() && w.exercise === ex),
  )
}
