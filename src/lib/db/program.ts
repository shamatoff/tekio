import { supabase } from '../supabase'
import { USER_ID, CYCLE } from '../../constants/app'
import type { Program, ProgramDay, ActiveProgram, ProgramCycle } from '../../types'

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

async function loadDaysForPrograms(programIds: string[]): Promise<Map<string, ProgramDay[]>> {
  const daysByProgram = new Map<string, ProgramDay[]>()
  if (programIds.length === 0) return daysByProgram

  const { data: days, error: daysErr } = await supabase
    .from('program_days')
    .select('id, name, sort_order, program_id')
    .in('program_id', programIds)
    .order('sort_order')
  if (daysErr) throw daysErr

  const dayIds = (days ?? []).map(d => d.id)

  const exByDay = new Map<string, string[]>()
  const ssByDay = new Map<string, [string, string][]>()

  if (dayIds.length > 0) {
    const { data: allExercises, error: dexErr } = await supabase
      .from('program_day_exercises')
      .select('id, program_day_id, sort_order, exercises(name)')
      .in('program_day_id', dayIds)
      .is('block_id', null)
      .order('sort_order')
    if (dexErr) throw dexErr

    const dexIdToName = new Map<string, string>()
    for (const de of allExercises ?? []) {
      const name = (de.exercises as unknown as { name: string } | null)?.name ?? ''
      const arr = exByDay.get(de.program_day_id) ?? []
      arr.push(name)
      exByDay.set(de.program_day_id, arr)
      dexIdToName.set(de.id, name)
    }

    const { data: supersets, error: ssErr } = await supabase
      .from('program_supersets')
      .select('program_day_id, exercise_a_id, exercise_b_id')
      .in('program_day_id', dayIds)
    if (ssErr) throw ssErr

    for (const ss of supersets ?? []) {
      const pair: [string, string] = [
        dexIdToName.get(ss.exercise_a_id) ?? '',
        dexIdToName.get(ss.exercise_b_id) ?? '',
      ]
      const arr = ssByDay.get(ss.program_day_id) ?? []
      arr.push(pair)
      ssByDay.set(ss.program_day_id, arr)
    }
  }

  for (const d of days ?? []) {
    const arr = daysByProgram.get(d.program_id) ?? []
    arr.push({
      name: d.name,
      exercises: exByDay.get(d.id) ?? [],
      supersets: ssByDay.get(d.id) ?? [],
    })
    daysByProgram.set(d.program_id, arr)
  }

  return daysByProgram
}

async function loadProgramRows(status: 'active' | 'paused'): Promise<ActiveProgram[]> {
  const { data: ups, error: upErr } = await supabase
    .from('user_programs')
    .select('id, start_date, current_day_index, last_advanced_date, program_id')
    .eq('user_id', USER_ID)
    .eq('status', status)
  if (upErr) throw upErr
  if (!ups || ups.length === 0) return []

  const programIds = ups.map(u => u.program_id)

  const { data: progs, error: progErr } = await supabase
    .from('programs')
    .select('id, name')
    .in('id', programIds)
  if (progErr) throw progErr

  const daysByProgram = await loadDaysForPrograms(programIds)
  const progMap = new Map((progs ?? []).map(p => [p.id, p]))

  return ups.map(up => {
    const prog = progMap.get(up.program_id)!
    return {
      programId: prog.id,
      userProgramId: up.id,
      name: prog.name,
      startDate: up.start_date,
      currentDayIndex: up.current_day_index,
      lastAdvancedDate: up.last_advanced_date ?? up.start_date,
      days: daysByProgram.get(up.program_id) ?? [],
    }
  })
}

export async function loadActivePrograms(): Promise<ActiveProgram[]> {
  return loadProgramRows('active')
}

export async function loadPausedPrograms(): Promise<ActiveProgram[]> {
  return loadProgramRows('paused')
}

export async function saveProgram(
  program: Program,
  existingProgramId?: string,
  existingUserProgramId?: string
): Promise<ActiveProgram> {
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
      })
      .select('id')
      .single()
    if (dayErr) throw dayErr

    await saveFlatDay(dayRow.id, day)
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

    await supabase.from('program_cycles').insert({
      user_program_id: userProgramId,
      cycle_number: 1,
      start_date: program.startDate,
      status: 'active',
    })
  }

  return { ...program, programId: programId!, userProgramId: userProgramId! }
}

async function saveFlatDay(dayId: string, day: ProgramDay): Promise<void> {
  if (day.exercises.length === 0) return

  const exerciseIds = await Promise.all(day.exercises.map(name => getOrCreateExercise(name)))

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

async function getOpenCycle(userProgramId: string): Promise<{ id: string; cycleNumber: number; startDate: string } | null> {
  const { data, error } = await supabase
    .from('program_cycles')
    .select('id, cycle_number, start_date')
    .eq('user_program_id', userProgramId)
    .is('end_date', null)
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { id: data.id, cycleNumber: data.cycle_number, startDate: data.start_date }
}

export async function pauseProgram(userProgramId: string): Promise<void> {
  const { error } = await supabase
    .from('user_programs')
    .update({ status: 'paused' })
    .eq('id', userProgramId)
  if (error) throw error

  const openCycle = await getOpenCycle(userProgramId)
  if (openCycle) {
    await supabase.from('program_cycles').update({ status: 'paused' }).eq('id', openCycle.id)
  }
}

export async function hardDeleteProgram(programId: string, userProgramId: string): Promise<void> {
  await supabase.from('user_programs').delete().eq('id', userProgramId)
  await supabase.from('programs').delete().eq('id', programId)
}

export async function restartProgram(userProgramId: string, startDate: string): Promise<void> {
  const openCycle = await getOpenCycle(userProgramId)
  if (openCycle) {
    const elapsedDays = Math.max(
      0,
      Math.floor((new Date(startDate).getTime() - new Date(openCycle.startDate).getTime()) / 86400000)
    )
    const closingStatus = elapsedDays >= CYCLE * 7 ? 'completed' : 'abandoned'
    await supabase
      .from('program_cycles')
      .update({ end_date: startDate, status: closingStatus })
      .eq('id', openCycle.id)
  }

  await supabase.from('program_cycles').insert({
    user_program_id: userProgramId,
    cycle_number: (openCycle?.cycleNumber ?? 0) + 1,
    start_date: startDate,
    status: 'active',
  })

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

export async function resumeProgram(userProgramId: string): Promise<void> {
  const { error } = await supabase
    .from('user_programs')
    .update({ status: 'active' })
    .eq('id', userProgramId)
  if (error) throw error

  const openCycle = await getOpenCycle(userProgramId)
  if (openCycle) {
    await supabase.from('program_cycles').update({ status: 'active' }).eq('id', openCycle.id)
  }
}

export async function loadProgramCycles(): Promise<ProgramCycle[]> {
  const { data: ups, error: upErr } = await supabase
    .from('user_programs')
    .select('id, program_id')
    .eq('user_id', USER_ID)
  if (upErr) throw upErr
  if (!ups || ups.length === 0) return []

  const userProgramIds = ups.map(u => u.id)
  const programIds = [...new Set(ups.map(u => u.program_id))]

  const { data: cycles, error: cycErr } = await supabase
    .from('program_cycles')
    .select('id, user_program_id, cycle_number, start_date, end_date, status')
    .in('user_program_id', userProgramIds)
    .order('cycle_number', { ascending: false })
  if (cycErr) throw cycErr
  if (!cycles || cycles.length === 0) return []

  const { data: progs, error: progErr } = await supabase
    .from('programs')
    .select('id, name')
    .in('id', programIds)
  if (progErr) throw progErr

  const daysByProgram = await loadDaysForPrograms(programIds)
  const progMap = new Map((progs ?? []).map(p => [p.id, p]))
  const upToProgram = new Map(ups.map(u => [u.id, u.program_id]))

  return cycles
    .map(c => {
      const programId = upToProgram.get(c.user_program_id)!
      const prog = progMap.get(programId)!
      return {
        id: c.id,
        userProgramId: c.user_program_id,
        programId,
        programName: prog.name,
        cycleNumber: c.cycle_number,
        startDate: c.start_date,
        endDate: c.end_date,
        status: c.status as ProgramCycle['status'],
        days: daysByProgram.get(programId) ?? [],
      }
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
}
