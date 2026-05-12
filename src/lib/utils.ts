import type { WeightEntry, Program, ProgramDay } from '../types'

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

export function isTodayDone(
  weights: WeightEntry[],
  day: ProgramDay | null | undefined,
): boolean {
  return (day?.exercises ?? []).every((ex) =>
    weights.some((w) => w.date === today() && w.exercise === ex),
  )
}
