import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { SkillEntry, SkillTypeInfo, NewSkillFlags, QualityRating, MatchResult } from '../../types'

async function getOrCreateSkillType(name: string, newSkillFlags?: NewSkillFlags): Promise<string> {
  const { data: existing, error: selectError } = await supabase
    .from('skill_types')
    .select('id')
    .eq('user_id', USER_ID)
    .eq('name', name)
    .maybeSingle()
  if (selectError) throw selectError
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('skill_types')
    .insert({
      user_id: USER_ID,
      name,
      is_system: false,
      has_competitor: newSkillFlags?.hasCompetitor ?? false,
      has_teammate: newSkillFlags?.hasTeammate ?? false,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function loadSkillTypes(): Promise<SkillTypeInfo[]> {
  const { data, error } = await supabase
    .from('skill_types')
    .select('name, has_competitor, has_teammate')
    .eq('user_id', USER_ID)
  if (error) throw error
  return (data ?? []).map(r => ({ name: r.name, hasCompetitor: r.has_competitor, hasTeammate: r.has_teammate }))
}

export async function loadSkills(): Promise<SkillEntry[]> {
  const { data, error } = await supabase
    .from('skill_sessions')
    .select('id, session_date, with_trainer, quality, notes, competitor_names, result, teammate_names, skill_types(name)')
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
    competitorNames: r.competitor_names ?? undefined,
    result: (r.result ?? undefined) as MatchResult | undefined,
    teammateNames: r.teammate_names ?? undefined,
  }))
}

export async function saveSkillEntry(
  entry: Omit<SkillEntry, 'id'>,
  newSkillFlags?: NewSkillFlags
): Promise<SkillEntry> {
  const skillTypeId = await getOrCreateSkillType(entry.skill, newSkillFlags)
  const { data, error } = await supabase
    .from('skill_sessions')
    .insert({
      user_id: USER_ID,
      skill_type_id: skillTypeId,
      session_date: entry.date,
      with_trainer: entry.withTrainer,
      quality: entry.quality || null,
      notes: entry.notes || null,
      competitor_names: entry.competitorNames?.length ? entry.competitorNames : null,
      result: entry.result || null,
      teammate_names: entry.teammateNames?.length ? entry.teammateNames : null,
    })
    .select('id, session_date, with_trainer, quality, notes, competitor_names, result, teammate_names')
    .single()
  if (error) throw error
  return {
    id: data.id,
    date: data.session_date,
    skill: entry.skill,
    withTrainer: data.with_trainer,
    quality: (data.quality ?? 0) as QualityRating,
    notes: data.notes ?? '',
    competitorNames: data.competitor_names ?? undefined,
    result: (data.result ?? undefined) as MatchResult | undefined,
    teammateNames: data.teammate_names ?? undefined,
  }
}

export async function deleteSkillEntry(id: string): Promise<void> {
  const { error } = await supabase.from('skill_sessions').delete().eq('id', id)
  if (error) throw error
}

export async function updateSkillEntry(
  id: string,
  patch: Omit<SkillEntry, 'id'>,
  newSkillFlags?: NewSkillFlags
): Promise<void> {
  const skillTypeId = await getOrCreateSkillType(patch.skill, newSkillFlags)
  const { error } = await supabase
    .from('skill_sessions')
    .update({
      skill_type_id: skillTypeId,
      session_date: patch.date,
      with_trainer: patch.withTrainer,
      quality: patch.quality || null,
      notes: patch.notes || null,
      competitor_names: patch.competitorNames?.length ? patch.competitorNames : null,
      result: patch.result || null,
      teammate_names: patch.teammateNames?.length ? patch.teammateNames : null,
    })
    .eq('id', id)
  if (error) throw error
}
