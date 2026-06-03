import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { Program, ProgramDay, ProgramBlock, BlockExercise, BlockType, TrainingTag } from '../../types'

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

  const { data: days, error: daysErr } = await supabase
    .from('program_days')
    .select('id, name, sort_order, day_of_week, focus, recovery_notes')
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

  // Load all exercises for all days (flat + block)
  const { data: allExercises, error: dexErr } = await supabase
    .from('program_day_exercises')
    .select('id, program_day_id, block_id, sort_order, training_tag, duration_text, tempo, sets_text, reps_text, weight_text, notes, exercises(name)')
    .in('program_day_id', dayIds)
    .order('sort_order')
  if (dexErr) throw dexErr

  // Load blocks
  const { data: dbBlocks, error: blocksErr } = await supabase
    .from('program_day_blocks')
    .select('id, program_day_id, name, block_type, scheduled_time, duration_minutes, notes, sort_order')
    .in('program_day_id', dayIds)
    .order('sort_order')
  if (blocksErr) throw blocksErr

  // Load supersets for all days
  const { data: supersets, error: ssErr } = await supabase
    .from('program_supersets')
    .select('program_day_id, exercise_a_id, exercise_b_id')
    .in('program_day_id', dayIds)
  if (ssErr) throw ssErr

  // Build maps
  const exIdToName = new Map<string, string>()
  for (const de of allExercises ?? []) {
    exIdToName.set(de.id, (de.exercises as unknown as { name: string } | null)?.name ?? '')
  }

  const dayHasBlocks = new Set((dbBlocks ?? []).map(b => b.program_day_id))

  // block_id → exercises in that block
  const blockExMap = new Map<string, (typeof allExercises extends (infer T)[] ? T : never)[]>()
  for (const de of allExercises ?? []) {
    if (!de.block_id) continue
    const arr = blockExMap.get(de.block_id) ?? []
    arr.push(de)
    blockExMap.set(de.block_id, arr)
  }

  const programDays: ProgramDay[] = (days ?? []).map(d => {
    const daySupersets = (supersets ?? [])
      .filter(ss => ss.program_day_id === d.id)

    if (dayHasBlocks.has(d.id)) {
      const dayBlocks: ProgramBlock[] = (dbBlocks ?? [])
        .filter(b => b.program_day_id === d.id)
        .map(b => {
          const blockExRows = (blockExMap.get(b.id) ?? [])
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)

          const blockExIds = new Set(blockExRows.map(de => de.id))

          const exercises: BlockExercise[] = blockExRows.map(de => ({
            id: de.id,
            name: (de.exercises as unknown as { name: string } | null)?.name ?? '',
            tag: (de.training_tag as TrainingTag | null) ?? undefined,
            sets: de.sets_text ?? undefined,
            reps: de.reps_text ?? undefined,
            weight: de.weight_text ?? undefined,
            duration: de.duration_text ?? undefined,
            tempo: de.tempo ?? undefined,
            notes: de.notes ?? undefined,
          }))

          const blockSupersets: [string, string][] = daySupersets
            .filter(ss => blockExIds.has(ss.exercise_a_id))
            .map(ss => [
              exIdToName.get(ss.exercise_a_id) ?? '',
              exIdToName.get(ss.exercise_b_id) ?? '',
            ])

          return {
            id: b.id,
            name: b.name,
            type: b.block_type as BlockType,
            scheduledTime: b.scheduled_time ?? undefined,
            durationMinutes: b.duration_minutes ?? undefined,
            notes: b.notes ?? undefined,
            exercises,
            supersets: blockSupersets,
            sortOrder: b.sort_order,
          }
        })

      // Flat exercises/supersets derived from weight blocks for the weight logger
      const weightBlocks = dayBlocks.filter(b => b.type === 'weight')
      const flatExercises = weightBlocks.flatMap(b => b.exercises.map(e => e.name))
      const flatSupersets = weightBlocks.flatMap(b => b.supersets)

      return {
        name: d.name,
        dayOfWeek: d.day_of_week ?? undefined,
        focus: d.focus ?? undefined,
        exercises: flatExercises,
        supersets: flatSupersets,
        blocks: dayBlocks,
        recoveryNotes: (d.recovery_notes as string[] | null) ?? undefined,
      }
    }

    // Flat day (no blocks) — existing behaviour
    const exercises = (allExercises ?? [])
      .filter(de => de.program_day_id === d.id && !de.block_id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(de => (de.exercises as unknown as { name: string } | null)?.name ?? '')

    const flatSupersets = daySupersets.map(ss => [
      exIdToName.get(ss.exercise_a_id) ?? '',
      exIdToName.get(ss.exercise_b_id) ?? '',
    ] as [string, string])

    return { name: d.name, exercises, supersets: flatSupersets }
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

  for (let i = 0; i < program.days.length; i++) {
    const day = program.days[i]
    const { data: dayRow, error: dayErr } = await supabase
      .from('program_days')
      .insert({
        program_id: programId,
        name: day.name,
        sort_order: i,
        day_of_week: day.dayOfWeek ?? null,
        focus: day.focus ?? null,
        recovery_notes: day.recoveryNotes ?? null,
      })
      .select('id')
      .single()
    if (dayErr) throw dayErr

    if (day.blocks && day.blocks.length > 0) {
      await saveBlocks(dayRow.id, day.blocks)
    } else {
      await saveFlatDay(dayRow.id, day)
    }
  }

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

async function saveBlocks(dayId: string, blocks: ProgramBlock[]): Promise<void> {
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi]
    const { data: blockRow, error: blockErr } = await supabase
      .from('program_day_blocks')
      .insert({
        program_day_id: dayId,
        name: block.name,
        block_type: block.type,
        scheduled_time: block.scheduledTime ?? null,
        duration_minutes: block.durationMinutes ?? null,
        notes: block.notes ?? null,
        sort_order: bi,
      })
      .select('id')
      .single()
    if (blockErr) throw blockErr

    if (block.exercises.length === 0) continue

    const exerciseIds = await Promise.all(
      block.exercises.map(ex => getOrCreateExercise(ex.name))
    )

    const { data: dayExRows, error: dexErr } = await supabase
      .from('program_day_exercises')
      .insert(
        exerciseIds.map((exId, j) => ({
          program_day_id: dayId,
          block_id: blockRow.id,
          exercise_id: exId,
          sort_order: j,
          training_tag: block.exercises[j].tag ?? null,
          duration_text: block.exercises[j].duration ?? null,
          tempo: block.exercises[j].tempo ?? null,
          sets_text: block.exercises[j].sets ?? null,
          reps_text: block.exercises[j].reps ?? null,
          weight_text: block.exercises[j].weight ?? null,
          notes: block.exercises[j].notes ?? null,
        }))
      )
      .select('id, exercise_id')
    if (dexErr) throw dexErr

    if (block.supersets.length > 0) {
      const exIdToDayExId = new Map<string, string>()
      for (const row of dayExRows ?? []) {
        exIdToDayExId.set(row.exercise_id, row.id)
      }

      const ssRows = block.supersets
        .map(([nameA, nameB]) => {
          const idxA = block.exercises.findIndex(e => e.name === nameA)
          const idxB = block.exercises.findIndex(e => e.name === nameB)
          if (idxA === -1 || idxB === -1) return null
          const dayExIdA = exIdToDayExId.get(exerciseIds[idxA])
          const dayExIdB = exIdToDayExId.get(exerciseIds[idxB])
          if (!dayExIdA || !dayExIdB) return null
          return { program_day_id: dayId, exercise_a_id: dayExIdA, exercise_b_id: dayExIdB }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)

      if (ssRows.length > 0) {
        await supabase.from('program_supersets').insert(ssRows)
      }
    }
  }
}

async function saveFlatDay(dayId: string, day: ProgramDay): Promise<void> {
  const exerciseIds = await Promise.all(day.exercises.map(name => getOrCreateExercise(name)))
  if (exerciseIds.length === 0) return

  const { data: dayExRows, error: dexErr } = await supabase
    .from('program_day_exercises')
    .insert(exerciseIds.map((exId, j) => ({
      program_day_id: dayId,
      exercise_id: exId,
      sort_order: j,
    })))
    .select('id, exercise_id')
  if (dexErr) throw dexErr

  const exIdToDayExId = new Map<string, string>()
  for (const row of dayExRows ?? []) {
    exIdToDayExId.set(row.exercise_id, row.id)
  }

  const ssRows = day.supersets
    .map(([nameA, nameB]) => {
      const idxA = day.exercises.indexOf(nameA)
      const idxB = day.exercises.indexOf(nameB)
      if (idxA === -1 || idxB === -1) return null
      const dayExIdA = exIdToDayExId.get(exerciseIds[idxA])
      const dayExIdB = exIdToDayExId.get(exerciseIds[idxB])
      if (!dayExIdA || !dayExIdB) return null
      return { program_day_id: dayId, exercise_a_id: dayExIdA, exercise_b_id: dayExIdB }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  if (ssRows.length > 0) {
    await supabase.from('program_supersets').insert(ssRows)
  }
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

export async function restartProgram(userProgramId: string, startDate: string): Promise<void> {
  const { error } = await supabase
    .from('user_programs')
    .update({
      start_date: startDate,
      current_day_index: 0,
      last_advanced_date: startDate,
      status: 'active',
    })
    .eq('id', userProgramId)
  if (error) throw error
}
