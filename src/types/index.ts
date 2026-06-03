export interface LiftSet {
  weight: number
  reps: number
}

export interface WeightEntry {
  id: string
  date: string
  exercise: string
  sets: LiftSet[]
  supersetId?: string
}

export interface BodyweightEntry {
  id: string
  date: string
  weight: number
}

export type CardioType = 'Running' | 'Cycling' | 'Swimming' | 'Indoor Rowing'

export interface CardioEntry {
  id: string
  date: string
  type: CardioType
  duration: number
  distance?: number
  notes?: string
}

export interface MobilityExercise {
  name: string
  duration: number
  notes: string
}

export interface MobilityEntry {
  id: string
  date: string
  exercises: MobilityExercise[]
  duration: number
}

export type SkillType = 'Tennis' | 'Swimming' | 'Volleyball'
export type QualityRating = 1 | 2 | 3 | 4 | 5

export interface SkillEntry {
  id: string
  date: string
  skill: SkillType
  withTrainer: boolean
  quality: QualityRating
  notes: string
}

export type DonationType = 'Full Blood' | 'Plasma'

export interface DonationEntry {
  id: string
  date: string
  type: DonationType
  notes: string
}

// ── Program v1.1: block-aware types ──────────────────────────────────────────

export type BlockType =
  | 'weight' | 'mobility' | 'conditioning'
  | 'sport' | 'warmup' | 'recovery'

export type TrainingTag =
  | 'STRENGTH' | 'POWER' | 'PREHAB' | 'CORE'
  | 'MOBILITY' | 'CONDITIONING' | 'WARMUP' | 'RECOVERY' | 'SKILL'

export interface BlockExercise {
  id?: string        // program_day_exercises.id, set after DB round-trip
  name: string
  tag?: TrainingTag
  sets?: string      // '4', '3'
  reps?: string      // '5', '30s per side', '3 rotations each direction'
  weight?: string    // '87 kg', 'bodyweight', 'light cable'
  duration?: string  // '5 min', '30 min'
  tempo?: string
  notes?: string
}

export interface ProgramBlock {
  id?: string        // program_day_blocks.id, set after DB round-trip
  name: string
  type: BlockType
  scheduledTime?: string   // 'HH:MM'
  durationMinutes?: number
  notes?: string
  exercises: BlockExercise[]
  supersets: [string, string][]
  sortOrder: number
}

export interface ProgramDay {
  name: string
  dayOfWeek?: string
  focus?: string
  // Flat — used by weight logger, isTodayDone, getGrouped.
  // When blocks are present these are derived from the weight block(s) at load time.
  exercises: string[]
  supersets: [string, string][]
  // v1.1 block structure — present for multi-block / protocol days
  blocks?: ProgramBlock[]
  recoveryNotes?: string[]
}

export interface Program {
  name: string
  startDate: string
  currentDayIndex: number
  lastAdvancedDate: string
  days: ProgramDay[]
}

export interface AppState {
  weights: WeightEntry[]
  bodyweight: BodyweightEntry[]
  cardio: CardioEntry[]
  mobility: MobilityEntry[]
  skills: SkillEntry[]
  donations: DonationEntry[]
  program: Program | null
}

export type EditModalTarget =
  | { type: 'weight'; record: WeightEntry }
  | { type: 'weight-superset'; records: [WeightEntry, WeightEntry] }
  | { type: 'bodyweight'; record: BodyweightEntry }
  | { type: 'cardio'; record: CardioEntry }
  | { type: 'mobility'; record: MobilityEntry }
  | { type: 'skill'; record: SkillEntry }
  | { type: 'donation'; record: DonationEntry }
