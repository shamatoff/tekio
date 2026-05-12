export const C = {
  bg: '#f1f5f9',
  surface: '#fff',
  primary: '#1e293b',
  accent: '#6366f1',
  accentL: '#eef2ff',
  muted: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  ss: '#7c3aed',
  ssL: '#f5f3ff',
  ssB: '#c4b5fd',
  dlBg: '#fffbeb',
  dlBd: '#fcd34d',
  dlTx: '#92400e',
} as const

export type ColorKey = keyof typeof C
