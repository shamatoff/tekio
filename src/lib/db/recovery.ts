import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { SleepEntry, SaunaEntry, ColdEntry, SleepQuality } from '../../types'

// ── Sleep (sleep_logs: log_date / duration_hours / quality) ─────────────────

export async function loadSleep(): Promise<SleepEntry[]> {
  const { data, error } = await supabase
    .from('sleep_logs')
    .select('id, log_date, duration_hours, quality, notes')
    .eq('user_id', USER_ID)
    .order('log_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id,
    date: r.log_date,
    hours: r.duration_hours != null ? Number(r.duration_hours) : 0,
    quality: r.quality != null ? (r.quality as SleepQuality) : undefined,
    notes: r.notes ?? undefined,
  }))
}

export async function saveSleepEntry(entry: Omit<SleepEntry, 'id'>): Promise<SleepEntry> {
  const { data, error } = await supabase
    .from('sleep_logs')
    .insert({
      user_id: USER_ID,
      log_date: entry.date,
      duration_hours: entry.hours,
      quality: entry.quality ?? null,
      notes: entry.notes ?? null,
    })
    .select('id, log_date, duration_hours, quality, notes')
    .single()
  if (error) throw error
  return {
    id: data.id,
    date: data.log_date,
    hours: data.duration_hours != null ? Number(data.duration_hours) : 0,
    quality: data.quality != null ? (data.quality as SleepQuality) : undefined,
    notes: data.notes ?? undefined,
  }
}

export async function updateSleepEntry(id: string, patch: Omit<SleepEntry, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('sleep_logs')
    .update({
      log_date: patch.date,
      duration_hours: patch.hours,
      quality: patch.quality ?? null,
      notes: patch.notes ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteSleepEntry(id: string): Promise<void> {
  const { error } = await supabase.from('sleep_logs').delete().eq('id', id)
  if (error) throw error
}

// ── Sauna & Cold (session tables, identical shape) ──────────────────────────

function mapSession(r: { id: string; session_date: string; duration_minutes: number | string; temperature_c: number | string | null; notes: string | null }) {
  return {
    id: r.id,
    date: r.session_date,
    duration: Number(r.duration_minutes),
    tempC: r.temperature_c != null ? Number(r.temperature_c) : undefined,
    notes: r.notes ?? undefined,
  }
}

async function loadSessions(table: 'sauna_sessions' | 'cold_sessions') {
  const { data, error } = await supabase
    .from(table)
    .select('id, session_date, duration_minutes, temperature_c, notes')
    .eq('user_id', USER_ID)
    .order('session_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapSession)
}

async function saveSession(table: 'sauna_sessions' | 'cold_sessions', entry: { date: string; duration: number; tempC?: number; notes?: string }) {
  const { data, error } = await supabase
    .from(table)
    .insert({
      user_id: USER_ID,
      session_date: entry.date,
      duration_minutes: entry.duration,
      temperature_c: entry.tempC ?? null,
      notes: entry.notes ?? null,
    })
    .select('id, session_date, duration_minutes, temperature_c, notes')
    .single()
  if (error) throw error
  return mapSession(data)
}

async function updateSession(table: 'sauna_sessions' | 'cold_sessions', id: string, patch: { date: string; duration: number; tempC?: number; notes?: string }) {
  const { error } = await supabase
    .from(table)
    .update({
      session_date: patch.date,
      duration_minutes: patch.duration,
      temperature_c: patch.tempC ?? null,
      notes: patch.notes ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

async function deleteSession(table: 'sauna_sessions' | 'cold_sessions', id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export const loadSauna = (): Promise<SaunaEntry[]> => loadSessions('sauna_sessions')
export const saveSaunaEntry = (entry: Omit<SaunaEntry, 'id'>): Promise<SaunaEntry> => saveSession('sauna_sessions', entry)
export const updateSaunaEntry = (id: string, patch: Omit<SaunaEntry, 'id'>): Promise<void> => updateSession('sauna_sessions', id, patch)
export const deleteSaunaEntry = (id: string): Promise<void> => deleteSession('sauna_sessions', id)

export const loadCold = (): Promise<ColdEntry[]> => loadSessions('cold_sessions')
export const saveColdEntry = (entry: Omit<ColdEntry, 'id'>): Promise<ColdEntry> => saveSession('cold_sessions', entry)
export const updateColdEntry = (id: string, patch: Omit<ColdEntry, 'id'>): Promise<void> => updateSession('cold_sessions', id, patch)
export const deleteColdEntry = (id: string): Promise<void> => deleteSession('cold_sessions', id)
