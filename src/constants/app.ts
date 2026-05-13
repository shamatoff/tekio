export const USER_ID = 'a0000000-0000-0000-0000-000000000001'

export const CYCLE = 6

export const CARDIO_TYPES = ['Running', 'Cycling', 'Swimming', 'Indoor Rowing'] as const
export type CardioDisplayType = typeof CARDIO_TYPES[number]

export const CARDIO_TYPE_MAP: Record<string, string> = {
  Running: 'running',
  Cycling: 'cycling',
  Swimming: 'swimming',
  'Indoor Rowing': 'rowing',
}
export const CARDIO_TYPE_REVERSE: Record<string, string> = {
  running: 'Running',
  cycling: 'Cycling',
  swimming: 'Swimming',
  rowing: 'Indoor Rowing',
}
export const CARDIO_ICONS: Record<string, string> = {
  Running: '🏃',
  Cycling: '🚴',
  Swimming: '🏊',
  'Indoor Rowing': '🚣',
}

export const DONATION_TYPES = ['Full Blood', 'Plasma'] as const
export type DonationDisplayType = typeof DONATION_TYPES[number]

export const DONATION_TYPE_MAP: Record<string, string> = {
  'Full Blood': 'full_blood',
  Plasma: 'plasma',
}
export const DONATION_TYPE_REVERSE: Record<string, string> = {
  full_blood: 'Full Blood',
  plasma: 'Plasma',
}
export const DONATION_ICONS: Record<string, string> = {
  'Full Blood': '🩸',
  Plasma: '💉',
}
export const DONATION_ELIGIBILITY_DAYS: Record<string, number> = {
  'Full Blood': 56,
  Plasma: 14,
}

export const SKILL_TYPES_DEFAULT = ['Tennis', 'Swimming', 'Volleyball']
