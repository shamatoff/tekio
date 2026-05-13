import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { MobilityEntry } from '../../types'

export async function loadMobility(): Promise<MobilityEntry[]> {
  const { data, error } = await supabase
    .from('mobility_sessions')
    .select('id, session_date, total_duration, notes, mobility_exercises(id, exercise_name, duration_minutes, notes)')
    .eq('user_id', USER_ID)
    .order('session_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => {
    const exercises = (r.mobility_exercises ?? []) as { id: string; exercise_name: string; duration_minutes: number | null; notes: string | null }[]
    return {
      id: r.id,
      date: r.session_date,
      exercises: exercises.map(e => ({
        name: e.exercise_name,
        duration: e.duration_minutes ?? 0,
        notes: e.notes ?? '',
      })),
      duration: r.total_duration ?? exercises.reduce((s, e) => s + (e.duration_minutes ?? 0), 0),
    }
  })
}

export async function saveMobilityEntry(entry: Omit<MobilityEntry, 'id'>): Promise<MobilityEntry> {
  const totalDuration = entry.exercises.reduce((s, e) => s + e.duration, 0)
  const { data: session, error: sessionErr } = await supabase
    .from('mobility_sessions')
    .insert({ user_id: USER_ID, session_date: entry.date, total_duration: totalDuration })
    .select('id')
    .single()
  if (sessionErr) throw sessionErr

  if (entry.exercises.length > 0) {
    const { error: exErr } = await supabase.from('mobility_exercises').insert(
      entry.exercises.map(e => ({
        session_id: session.id,
        exercise_name: e.name,
        duration_minutes: e.duration,
        notes: e.notes || null,
      }))
    )
    if (exErr) throw exErr
  }

  return { id: session.id, date: entry.date, exercises: entry.exercises, duration: totalDuration }
}

export async function deleteMobilityEntry(id: string): Promise<void> {
  const { error } = await supabase.from('mobility_sessions').delete().eq('id', id)
  if (error) throw error
}
