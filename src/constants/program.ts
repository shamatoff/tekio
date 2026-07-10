import type { BlockType, TrainingTag } from '../types'

export const BLOCK_TYPES: BlockType[] = [
  'warmup', 'weight', 'mobility', 'conditioning', 'sport', 'recovery',
]

export const BLOCK_META: Record<BlockType, { icon: string; label: string }> = {
  warmup: { icon: '🔥', label: 'Warm-up' },
  weight: { icon: '🏋️', label: 'Weights' },
  mobility: { icon: '🧘', label: 'Mobility' },
  conditioning: { icon: '🫀', label: 'Conditioning' },
  sport: { icon: '⚽', label: 'Sport' },
  recovery: { icon: '🛌', label: 'Recovery' },
}

export const TRAINING_TAGS: TrainingTag[] = [
  'STRENGTH', 'POWER', 'PREHAB', 'CORE', 'CONDITIONING',
  'MOBILITY', 'WARMUP', 'RECOVERY', 'SKILL',
]

/** Default training tag for an exercise added to a block of the given type. */
export const DEFAULT_TAG: Record<BlockType, TrainingTag> = {
  warmup: 'WARMUP',
  weight: 'STRENGTH',
  mobility: 'MOBILITY',
  conditioning: 'CONDITIONING',
  sport: 'SKILL',
  recovery: 'RECOVERY',
}

export const DAYS_OF_WEEK: import('../types').DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]
