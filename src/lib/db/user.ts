import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { WeekStartDay } from '../utils'

export async function getOrCreateUser(): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      { id: USER_ID, units: 'metric', progression_model: 'volume', timezone: 'UTC', week_start_day: 'monday' },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  if (error) throw error
}

export async function getWeekStartDay(): Promise<WeekStartDay> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('week_start_day')
    .eq('id', USER_ID)
    .single()
  if (error) throw error
  return data.week_start_day as WeekStartDay
}

export async function updateWeekStartDay(value: WeekStartDay): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ week_start_day: value })
    .eq('id', USER_ID)
  if (error) throw error
}
