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
export type MatchResult = 'win' | 'loss' | 'tie'

export interface SkillEntry {
  id: string
  date: string
  skill: SkillType
  withTrainer: boolean
  quality: QualityRating
  notes: string
  competitorNames?: string[]
  result?: MatchResult
  teammateNames?: string[]
}

export interface SkillTypeInfo {
  name: string
  hasCompetitor: boolean
  hasTeammate: boolean
}

export interface NewSkillFlags {
  hasCompetitor: boolean
  hasTeammate: boolean
}

export interface WaterEntry {
  id: string
  date: string
  amountMl: number
}

export type DonationType = 'Full Blood' | 'Plasma'

export interface DonationEntry {
  id: string
  date: string
  type: DonationType
  notes: string
}

export interface ProgramDay {
  name: string
  exercises: string[]
  supersets: [string, string][]
}

export interface Program {
  name: string
  startDate: string
  currentDayIndex: number
  lastAdvancedDate: string
  days: ProgramDay[]
}

export interface ActiveProgram extends Program {
  programId: string
  userProgramId: string
}

export interface ProgramCycle {
  id: string
  userProgramId: string
  programId: string
  programName: string
  cycleNumber: number
  startDate: string
  endDate: string | null
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  days: ProgramDay[]
}

export interface AppState {
  weights: WeightEntry[]
  bodyweight: BodyweightEntry[]
  cardio: CardioEntry[]
  mobility: MobilityEntry[]
  skills: SkillEntry[]
  skillTypes: SkillTypeInfo[]
  donations: DonationEntry[]
  water: WaterEntry[]
  programs: ActiveProgram[]
  programHistory: ProgramCycle[]
}

export type EditModalTarget =
  | { type: 'weight'; record: WeightEntry }
  | { type: 'weight-superset'; records: [WeightEntry, WeightEntry] }
  | { type: 'bodyweight'; record: BodyweightEntry }
  | { type: 'cardio'; record: CardioEntry }
  | { type: 'mobility'; record: MobilityEntry }
  | { type: 'skill'; record: SkillEntry }
  | { type: 'donation'; record: DonationEntry }
  | { type: 'water'; record: WaterEntry }
