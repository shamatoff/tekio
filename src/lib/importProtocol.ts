import type { Program, ProgramDay, ProgramBlock, BlockExercise, BlockType, TrainingTag } from '../types'

// ── Raw JSON shapes (matches the protocol JSON format) ────────────────────────

interface RawExercise {
  name: string
  tag?: string
  sets?: number | null
  reps?: string | null
  weight?: string | null
  duration?: string | null
  tempo?: string | null
  notes?: string | null
}

interface RawBlock {
  name: string
  type: string
  scheduledTime?: string | null
  durationMinutes?: number | null
  notes?: string | null
  exercises: RawExercise[]
  supersets?: [string, string][]
}

interface RawDay {
  name: string
  dayOfWeek?: string
  focus?: string
  blocks: RawBlock[]
  recoveryNotes?: string[]
}

interface RawProtocol {
  name: string
  startDate: string
  currentDayIndex?: number
  lastAdvancedDate?: string | null
  days: RawDay[]
}

// ── Converter ─────────────────────────────────────────────────────────────────

const VALID_BLOCK_TYPES = new Set<string>([
  'weight', 'mobility', 'conditioning', 'sport', 'warmup', 'recovery',
])

const VALID_TAGS = new Set<string>([
  'STRENGTH', 'POWER', 'PREHAB', 'CORE',
  'MOBILITY', 'CONDITIONING', 'WARMUP', 'RECOVERY', 'SKILL',
])

function toBlockType(raw: string): BlockType {
  const lower = raw.toLowerCase()
  if (VALID_BLOCK_TYPES.has(lower)) return lower as BlockType
  return 'weight'
}

function toTag(raw: string | undefined | null): TrainingTag | undefined {
  if (!raw) return undefined
  const upper = raw.toUpperCase()
  if (VALID_TAGS.has(upper)) return upper as TrainingTag
  return undefined
}

function convertExercise(raw: RawExercise): BlockExercise {
  return {
    name: raw.name,
    tag: toTag(raw.tag),
    sets: raw.sets != null ? String(raw.sets) : undefined,
    reps: raw.reps ?? undefined,
    weight: raw.weight ?? undefined,
    duration: raw.duration ?? undefined,
    tempo: raw.tempo ?? undefined,
    notes: raw.notes ?? undefined,
  }
}

function convertBlock(raw: RawBlock, index: number): ProgramBlock {
  return {
    name: raw.name,
    type: toBlockType(raw.type),
    scheduledTime: raw.scheduledTime ?? undefined,
    durationMinutes: raw.durationMinutes ?? undefined,
    notes: raw.notes ?? undefined,
    exercises: raw.exercises.map(convertExercise),
    supersets: raw.supersets ?? [],
    sortOrder: index,
  }
}

function convertDay(raw: RawDay): ProgramDay {
  const blocks = raw.blocks.map(convertBlock)
  const weightBlocks = blocks.filter(b => b.type === 'weight')

  return {
    name: raw.name,
    dayOfWeek: raw.dayOfWeek,
    focus: raw.focus,
    // Flat fields derived from weight blocks — keeps isTodayDone / getGrouped working
    exercises: weightBlocks.flatMap(b => b.exercises.map(e => e.name)),
    supersets: weightBlocks.flatMap(b => b.supersets),
    blocks,
    recoveryNotes: raw.recoveryNotes,
  }
}

export function importProtocol(raw: unknown): Program {
  const p = raw as RawProtocol

  if (!p?.name || !p?.startDate || !Array.isArray(p?.days)) {
    throw new Error('Invalid protocol JSON: missing name, startDate, or days array')
  }

  const startDate = p.startDate
  return {
    name: p.name,
    startDate,
    currentDayIndex: p.currentDayIndex ?? 0,
    lastAdvancedDate: p.lastAdvancedDate ?? startDate,
    days: p.days.map(convertDay),
  }
}
