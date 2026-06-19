import type { WeightEntry, Program, ProgramDay } from '../types'

export type GroupedExercise =
  | { type: 'single'; exercises: [string] }
  | { type: 'superset'; exercises: [string, string] }

const CYCLE = 6

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2)

export const today = (): string =>
  new Date().toISOString().slice(0, 10)

export type WeekStartDay = 'sunday' | 'monday'

/** Returns the date (YYYY-MM-DD) of the start of the week containing `s`. */
export const startOfWeek = (s: string, weekStart: WeekStartDay = 'monday'): string => {
  const d = new Date(s)
  const day = d.getDay() // 0 = Sunday … 6 = Saturday
  const offset = weekStart === 'monday' ? (day + 6) % 7 : day
  d.setDate(d.getDate() - offset)
  return d.toISOString().slice(0, 10)
}

/** Groups a date into its containing week, keyed by that week's start date. */
export const weekKey = (s: string, weekStart: WeekStartDay = 'monday'): string =>
  startOfWeek(s, weekStart)

export const r05 = (v: number): number => Math.round(v * 2) / 2

export interface CycleInfo {
  week: number
  isDeload: boolean
  isComplete: boolean
}

export function cycleInfo(p: Program | null | undefined): CycleInfo {
  if (!p?.startDate) return { week: 1, isDeload: false, isComplete: false }
  const days = Math.max(
    0,
    Math.floor((new Date(today()).getTime() - new Date(p.startDate).getTime()) / 86400000),
  )
  const weekCount = Math.floor(days / 7) // 0-based completed-week count
  // Once all CYCLE weeks (including deload) have elapsed, the program is done
  if (weekCount >= CYCLE) return { week: CYCLE, isDeload: false, isComplete: true }
  const wc = weekCount + 1 // 1-based current week number (1 … CYCLE)
  return { week: wc, isDeload: wc === CYCLE, isComplete: false }
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

// ── Cardio duration helpers ───────────────────────────────────────────────────

/** Parses "MM:SS" or plain minutes string → decimal minutes */
export function parseDurationMins(raw: string): number {
  const s = raw.trim()
  if (s.includes(':')) {
    const [mStr, sStr] = s.split(':')
    const m = parseInt(mStr, 10) || 0
    const sec = Math.min(parseInt(sStr, 10) || 0, 59)
    return m + sec / 60
  }
  return parseFloat(s) || 0
}

/** Formats decimal minutes → "MM:SS" */
export function formatDurationMins(mins: number): string {
  const m = Math.floor(mins)
  const s = Math.round((mins - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Returns pace string "M:SS/km" or empty string if data missing */
export function calcPace(mins: number, distKm: number): string {
  if (!distKm || !mins) return ''
  const paceMin = mins / distKm
  const m = Math.floor(paceMin)
  const s = Math.round((paceMin - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

/** Counts consecutive days of activity ending today (or yesterday, if today has none yet). */
export function currentStreak(activeDates: Set<string>): number {
  const d = new Date(today())
  if (!activeDates.has(d.toISOString().slice(0, 10))) {
    d.setDate(d.getDate() - 1)
  }
  let streak = 0
  while (activeDates.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function isTodayDone(
  weights: WeightEntry[],
  day: ProgramDay | null | undefined,
): boolean {
  return (day?.exercises ?? []).every((ex) =>
    weights.some((w) => w.date === today() && w.exercise === ex),
  )
}
