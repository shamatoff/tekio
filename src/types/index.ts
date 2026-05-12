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

export interface AppState {
  weights: WeightEntry[]
  bodyweight: BodyweightEntry[]
  cardio: CardioEntry[]
  mobility: MobilityEntry[]
  skills: SkillEntry[]
  donations: DonationEntry[]
  program: Program | null
}
