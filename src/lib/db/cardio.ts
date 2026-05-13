import { supabase } from '../supabase'
import { USER_ID, CARDIO_TYPE_MAP, CARDIO_TYPE_REVERSE } from '../../constants/app'
import type { CardioEntry } from '../../types'

export async function loadCardio(): Promise<CardioEntry[]> {
  const { data, error } = await supabase
    .from('cardio_sessions')
    .select('id, session_date, activity_type, duration_minutes, distance_km, notes')
    .eq('user_id', USER_ID)
    .order('session_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id,
    date: r.session_date,
    type: (CARDIO_TYPE_REVERSE[r.activity_type] ?? r.activity_type) as CardioEntry['type'],
    duration: r.duration_minutes,
    distance: r.distance_km ? Number(r.distance_km) : undefined,
    notes: r.notes ?? undefined,
  }))
}

export async function saveCardioEntry(entry: Omit<CardioEntry, 'id'>): Promise<CardioEntry> {
  const { data, error } = await supabase
    .from('cardio_sessions')
    .insert({
      user_id: USER_ID,
      session_date: entry.date,
      activity_type: CARDIO_TYPE_MAP[entry.type] ?? entry.type.toLowerCase(),
      duration_minutes: entry.duration,
      distance_km: entry.distance ?? null,
      notes: entry.notes ?? null,
    })
    .select('id, session_date, activity_type, duration_minutes, distance_km, notes')
    .single()
  if (error) throw error
  return {
    id: data.id,
    date: data.session_date,
    type: (CARDIO_TYPE_REVERSE[data.activity_type] ?? data.activity_type) as CardioEntry['type'],
    duration: data.duration_minutes,
    distance: data.distance_km ? Number(data.distance_km) : undefined,
    notes: data.notes ?? undefined,
  }
}

export async function deleteCardioEntry(id: string): Promise<void> {
  const { error } = await supabase.from('cardio_sessions').delete().eq('id', id)
  if (error) throw error
}
