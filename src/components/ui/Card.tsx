import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  deload?: boolean
}

export function Card({ children, deload, className = '', ...props }: CardProps) {
  const base = deload
    ? 'bg-dl-bg border border-dl-bd rounded-xl p-4'
    : 'bg-surface border border-border rounded-xl p-4'
  return (
    <div className={`${base} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function SecTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold text-muted uppercase tracking-wide mb-2 ${className}`}>
      {children}
    </p>
  )
}

export function EmptyMsg({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted text-center py-6">{children}</p>
}
