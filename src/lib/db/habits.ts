import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { Habit, HabitCompletion } from '../../types'

const HABIT_COLS =
  'id, name, icon, cadence, target_count, unit, muscle_group_id, exercise_id, auto_source, count_level, contribution, single_tick, active, sort_order, notes'

type HabitRow = {
  id: string
  name: string
  icon: string | null
  cadence: Habit['cadence']
  target_count: number
  unit: string | null
  muscle_group_id: string | null
  exercise_id: string | null
  auto_source: Habit['autoSource']
  count_level: number
  contribution: Habit['contribution']
  single_tick: boolean
  active: boolean
  sort_order: number
  notes: string | null
}

function fromRow(r: HabitRow): Habit {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    cadence: r.cadence,
    targetCount: Number(r.target_count),
    unit: r.unit,
    muscleGroupId: r.muscle_group_id,
    exerciseId: r.exercise_id,
    autoSource: r.auto_source,
    countLevel: (r.count_level ?? 1) as 1 | 2 | 3,
    contribution: r.contribution,
    singleTick: r.single_tick ?? true,
    active: r.active,
    sortOrder: r.sort_order,
    notes: r.notes,
  }
}

function toRow(h: Omit<Habit, 'id'>) {
  return {
    user_id: USER_ID,
    name: h.name,
    icon: h.icon ?? null,
    cadence: h.cadence,
    target_count: h.targetCount,
    unit: h.unit ?? null,
    muscle_group_id: h.muscleGroupId ?? null,
    exercise_id: h.exerciseId ?? null,
    auto_source: h.autoSource,
    count_level: h.countLevel,
    contribution: h.contribution,
    single_tick: h.singleTick,
    active: h.active,
    sort_order: h.sortOrder,
    notes: h.notes ?? null,
  }
}

export async function loadHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select(HABIT_COLS)
    .eq('user_id', USER_ID)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return ((data ?? []) as HabitRow[]).map(fromRow)
}

export async function saveHabit(habit: Omit<Habit, 'id'>): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert(toRow(habit))
    .select(HABIT_COLS)
    .single()
  if (error) throw error
  return fromRow(data as HabitRow)
}

export async function updateHabit(id: string, patch: Omit<Habit, 'id'>): Promise<void> {
  const { user_id, ...row } = toRow(patch)
  void user_id
  const { error } = await supabase.from('habits').update(row).eq('id', id)
  if (error) throw error
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw error
}

export async function loadHabitCompletions(): Promise<HabitCompletion[]> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('id, habit_id, period_start, count, notes')
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id,
    habitId: r.habit_id,
    periodStart: r.period_start,
    count: Number(r.count),
    notes: r.notes,
  }))
}

/** Sets the manual-completion count for a habit's period (insert or replace). */
export async function upsertHabitCompletion(
  habitId: string,
  periodStart: string,
  count: number,
): Promise<HabitCompletion> {
  const { data, error } = await supabase
    .from('habit_completions')
    .upsert(
      { habit_id: habitId, period_start: periodStart, count, completed_at: new Date().toISOString() },
      { onConflict: 'habit_id,period_start' },
    )
    .select('id, habit_id, period_start, count, notes')
    .single()
  if (error) throw error
  return {
    id: data.id,
    habitId: data.habit_id,
    periodStart: data.period_start,
    count: Number(data.count),
    notes: data.notes,
  }
}
