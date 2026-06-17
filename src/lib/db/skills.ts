import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { SkillEntry, SkillTypeInfo, QualityRating, MatchResult } from '../../types'

async function getOrCreateSkillType(name: string): Promise<string> {
  // Try insert first (idempotent)
  await supabase
    .from('skill_types')
    .upsert({ user_id: USER_ID, name, is_system: false }, { onConflict: 'user_id,name' })
  const { data, error } = await supabase
    .from('skill_types')
    .select('id')
    .eq('user_id', USER_ID)
    .eq('name', name)
    .single()
  if (error) throw error
  return data.id
}

export async function loadSkillTypes(): Promise<SkillTypeInfo[]> {
  const { data, error } = await supabase
    .from('skill_types')
    .select('name, has_competitor')
    .eq('user_id', USER_ID)
  if (error) throw error
  return (data ?? []).map(r => ({ name: r.name, hasCompetitor: r.has_competitor }))
}

export async function loadSkills(): Promise<SkillEntry[]> {
  const { data, error } = await supabase
    .from('skill_sessions')
    .select('id, session_date, with_trainer, quality, notes, competitor_name, result, skill_types(name)')
    .eq('user_id', USER_ID)
    .order('session_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id,
    date: r.session_date,
    skill: ((r.skill_types as unknown as { name: string } | null)?.name ?? '') as SkillEntry['skill'],
    withTrainer: r.with_trainer,
    quality: (r.quality ?? 0) as QualityRating,
    notes: r.notes ?? '',
    competitorName: r.competitor_name ?? undefined,
    result: (r.result ?? undefined) as MatchResult | undefined,
  }))
}

export async function saveSkillEntry(entry: Omit<SkillEntry, 'id'>): Promise<SkillEntry> {
  const skillTypeId = await getOrCreateSkillType(entry.skill)
  const { data, error } = await supabase
    .from('skill_sessions')
    .insert({
      user_id: USER_ID,
      skill_type_id: skillTypeId,
      session_date: entry.date,
      with_trainer: entry.withTrainer,
      quality: entry.quality || null,
      notes: entry.notes || null,
      competitor_name: entry.competitorName || null,
      result: entry.result || null,
    })
    .select('id, session_date, with_trainer, quality, notes, competitor_name, result')
    .single()
  if (error) throw error
  return {
    id: data.id,
    date: data.session_date,
    skill: entry.skill,
    withTrainer: data.with_trainer,
    quality: (data.quality ?? 0) as QualityRating,
    notes: data.notes ?? '',
    competitorName: data.competitor_name ?? undefined,
    result: (data.result ?? undefined) as MatchResult | undefined,
  }
}

export async function deleteSkillEntry(id: string): Promise<void> {
  const { error } = await supabase.from('skill_sessions').delete().eq('id', id)
  if (error) throw error
}

export async function updateSkillEntry(
  id: string,
  patch: Omit<SkillEntry, 'id'>
): Promise<void> {
  const skillTypeId = await getOrCreateSkillType(patch.skill)
  const { error } = await supabase
    .from('skill_sessions')
    .update({
      skill_type_id: skillTypeId,
      session_date: patch.date,
      with_trainer: patch.withTrainer,
      quality: patch.quality || null,
      notes: patch.notes || null,
      competitor_name: patch.competitorName || null,
      result: patch.result || null,
    })
    .eq('id', id)
  if (error) throw error
}
