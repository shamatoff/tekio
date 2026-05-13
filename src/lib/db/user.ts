import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'

export async function getOrCreateUser(): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({ id: USER_ID, units: 'metric', progression_model: 'volume', timezone: 'UTC' }, { onConflict: 'id' })
  if (error) throw error
}
