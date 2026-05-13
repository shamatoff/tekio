import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  children: ReactNode
  ss?: boolean
  small?: boolean
}

export function Chip({ active, children, ss, small, className = '', ...props }: ChipProps) {
  const activeClass = ss
    ? 'bg-ss text-white border-ss'
    : 'bg-accent text-white border-accent'
  const inactiveClass = 'bg-surface text-muted border-border hover:border-accent/50'
  const sizeClass = small ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'

  return (
    <button
      className={`${sizeClass} font-medium rounded-full border transition-colors ${active ? activeClass : inactiveClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
