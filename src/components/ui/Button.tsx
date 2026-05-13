import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ss' | 'ghost'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:opacity-90',
  secondary: 'bg-surface border border-border text-primary hover:bg-bg',
  danger: 'bg-danger text-white hover:opacity-90',
  ss: 'bg-ss text-white hover:opacity-90',
  ghost: 'text-muted hover:text-primary',
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  small?: boolean
}

export function Btn({ variant = 'primary', children, small, className = '', ...props }: BtnProps) {
  return (
    <button
      className={`${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} font-medium rounded-lg transition-opacity disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface DelBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
}

export function DelBtn({ label = 'Delete', className = '', ...props }: DelBtnProps) {
  return (
    <button
      aria-label={label}
      className={`w-7 h-7 flex items-center justify-center text-danger hover:bg-danger/10 rounded transition-colors ${className}`}
      {...props}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    </button>
  )
}
