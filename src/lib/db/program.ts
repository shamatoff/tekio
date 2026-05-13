import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { Program, ProgramDay } from '../../types'

export interface ActiveProgramResult {
  program: Program
  programId: string
  userProgramId: string
}

async function getOrCreateExercise(name: string): Promise<string> {
  await supabase
    .from('exercises')
    .upsert({ user_id: USER_ID, name, is_system: false }, { onConflict: 'user_id,name' })
  const { data, error } = await supabase
    .from('exercises')
    .select('id')
    .eq('user_id', USER_ID)
    .eq('name', name)
    .single()
  if (error) throw error
  return data.id
}

export async function loadActiveProgram(): Promise<ActiveProgramResult | null> {
  const { data: up, error: upErr } = await supabase
    .from('user_programs')
    .select('id, start_date, current_day_index, last_advanced_date, program_id')
    .eq('user_id', USER_ID)
    .eq('status', 'active')
    .maybeSingle()
  if (upErr) throw upErr
  if (!up) return null

  const { data: prog, error: progErr } = await supabase
    .from('programs')
    .select('id, name')
    .eq('id', up.program_id)
    .single()
  if (progErr) throw progErr

  // Load all days with exercises
  const { data: days, error: daysErr } = await supabase
    .from('program_days')
    .select('id, name, sort_order')
    .eq('program_id', up.program_id)
    .order('sort_order')
  if (daysErr) throw daysErr

  const dayIds = (days ?? []).map(d => d.id)
  if (dayIds.length === 0) {
    return {
      programId: prog.id,
      userProgramId: up.id,
      program: {
        name: prog.name,
        startDate: up.start_date,
        currentDayIndex: up.current_day_index,
        lastAdvancedDate: up.last_advanced_date ?? up.start_date,
        days: [],
      },
    }
  }

  // Load exercises for all days
  const { data: dayExercises, error: dexErr } = await supabase
    .from('program_day_exercises')
    .select('id, program_day_id, sort_order, exercises(name)')
    .in('program_day_id', dayIds)
    .order('sort_order')
  if (dexErr) throw dexErr

  // Load supersets for all days
  const { data: supersets, error: ssErr } = await supabase
    .from('program_supersets')
    .select('program_day_id, exercise_a_id, exercise_b_id')
    .in('program_day_id', dayIds)
  if (ssErr) throw ssErr

  // Build exercise id → name map
  const exIdToName = new Map<string, string>()
  for (const de of dayExercises ?? []) {
    exIdToName.set(de.id, (de.exercises as unknown as { name: string } | null)?.name ?? '')
  }

  // Assemble days
  const programDays: ProgramDay[] = (days ?? []).map(d => {
    const exercises = (dayExercises ?? [])
      .filter(de => de.program_day_id === d.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(de => (de.exercises as unknown as { name: string } | null)?.name ?? '')

    const daySupersets = (supersets ?? [])
      .filter(ss => ss.program_day_id === d.id)
      .map(ss => [
        exIdToName.get(ss.exercise_a_id) ?? '',
        exIdToName.get(ss.exercise_b_id) ?? '',
      ] as [string, string])

    return { name: d.name, exercises, supersets: daySupersets }
  })

  return {
    programId: prog.id,
    userProgramId: up.id,
    program: {
      name: prog.name,
      startDate: up.start_date,
      currentDayIndex: up.current_day_index,
      lastAdvancedDate: up.last_advanced_date ?? up.start_date,
      days: programDays,
    },
  }
}

export async function saveProgram(
  program: Program,
  existingProgramId?: string,
  existingUserProgramId?: string
): Promise<ActiveProgramResult> {
  let programId = existingProgramId
  let userProgramId = existingUserProgramId

  if (programId) {
    await supabase.from('programs').update({ name: program.name }).eq('id', programId)
    // Delete old days (cascades to exercises and supersets)
    await supabase.from('program_days').delete().eq('program_id', programId)
  } else {
    const { data: prog, error: progErr } = await supabase
      .from('programs')
      .insert({
        user_id: USER_ID,
        name: program.name,
        cycle_length_weeks: 6,
        deload_week: 6,
        deload_strategy: { type: 'reps', factor: 0.7 },
      })
      .select('id')
      .single()
    if (progErr) throw progErr
    programId = prog.id
  }

  // Insert days + exercises + supersets
  for (let i = 0; i < program.days.length; i++) {
    const day = program.days[i]
    const { data: dayRow, error: dayErr } = await supabase
      .from('program_days')
      .insert({ program_id: programId, name: day.name, sort_order: i })
      .select('id')
      .single()
    if (dayErr) throw dayErr

    // Ensure exercises exist and get their IDs
    const exerciseIds = await Promise.all(day.exercises.map(name => getOrCreateExercise(name)))

    // Insert program_day_exercises
    if (exerciseIds.length > 0) {
      const { data: dayExRows, error: dexErr } = await supabase
        .from('program_day_exercises')
        .insert(exerciseIds.map((exId, j) => ({
          program_day_id: dayRow.id,
          exercise_id: exId,
          sort_order: j,
        })))
        .select('id, exercise_id')
      if (dexErr) throw dexErr

      // Build exercise_id → day_exercise_id map for superset insertion
      const exIdToDayExId = new Map<string, string>()
      for (const row of dayExRows ?? []) {
        exIdToDayExId.set(row.exercise_id, row.id)
      }

      // Insert supersets
      const ssRows = day.supersets
        .map(([nameA, nameB]) => {
          const idxA = day.exercises.indexOf(nameA)
          const idxB = day.exercises.indexOf(nameB)
          if (idxA === -1 || idxB === -1) return null
          const dayExIdA = exIdToDayExId.get(exerciseIds[idxA])
          const dayExIdB = exIdToDayExId.get(exerciseIds[idxB])
          if (!dayExIdA || !dayExIdB) return null
          return {
            program_day_id: dayRow.id,
            exercise_a_id: dayExIdA,
            exercise_b_id: dayExIdB,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)

      if (ssRows.length > 0) {
        await supabase.from('program_supersets').insert(ssRows)
      }
    }
  }

  // Upsert user_programs
  if (userProgramId) {
    await supabase
      .from('user_programs')
      .update({
        start_date: program.startDate,
        current_day_index: program.currentDayIndex,
        last_advanced_date: program.lastAdvancedDate,
        status: 'active',
      })
      .eq('id', userProgramId)
  } else {
    const { data: up, error: upErr } = await supabase
      .from('user_programs')
      .insert({
        user_id: USER_ID,
        program_id: programId,
        start_date: program.startDate,
        current_day_index: program.currentDayIndex ?? 0,
        last_advanced_date: program.lastAdvancedDate ?? program.startDate,
        status: 'active',
      })
      .select('id')
      .single()
    if (upErr) throw upErr
    userProgramId = up.id
  }

  return { program, programId: programId!, userProgramId: userProgramId! }
}

export async function advanceProgram(
  userProgramId: string,
  newIndex: number,
  date: string
): Promise<void> {
  const { error } = await supabase
    .from('user_programs')
    .update({ current_day_index: newIndex, last_advanced_date: date })
    .eq('id', userProgramId)
  if (error) throw error
}

export async function deleteProgram(programId: string, userProgramId: string): Promise<void> {
  await supabase.from('user_programs').delete().eq('id', userProgramId)
  await supabase.from('programs').delete().eq('id', programId)
}
