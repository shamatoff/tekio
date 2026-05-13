import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  children: ReactNode
  ss?: boolean
}

export function Chip({ active, children, ss, className = '', ...props }: ChipProps) {
  const activeClass = ss
    ? 'bg-ss text-white border-ss'
    : 'bg-accent text-white border-accent'
  const inactiveClass = 'bg-surface text-muted border-border hover:border-accent/50'

  return (
    <button
      className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${active ? activeClass : inactiveClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
